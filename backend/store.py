"""Firestore transactions serialize budgets across every backend/platform instance."""
import time
from .core import APIError, keys, check_budget, context

class Store:
    def __init__(self, db, limits):
        self.db, self.limits = db, limits

    def conversations(self, uid):
        return self.db.collection('aiUsers').document(uid).collection('conversations')

    def refs(self, uid, now):
        day, provider_day, minute = keys(now)
        return [self.db.collection('aiUsage').document(k) for k in
                (f'u_{uid}_{day}', f'g_{day}', f'p_{provider_day}', 'rate_window')]

    def usage(self, uid):
        u, g, p, _ = [r.get().to_dict() or {} for r in self.refs(uid, time.time())]
        return {'individual': max(0, 20-u.get('count',0)), 'global': max(0,200-g.get('count',0)),
                'provider': max(0,self.limits['rpd']-p.get('count',0)), 'day':keys()[0]}

    def list(self, uid):
        docs = self.conversations(uid).order_by('updatedAt', direction='DESCENDING').select(['title','updatedAt']).limit(30).stream()
        return [{'id':d.id,'title':d.to_dict()['title'],'updatedAt':d.to_dict()['updatedAt']} for d in docs]

    def get(self, uid, cid):
        data = self.conversations(uid).document(cid).get().to_dict()
        if data is None:
            raise APIError(404, 'Conversa não encontrada.')
        return data

    def reserve(self, uid, cid, rid, text):
        from firebase_admin import firestore
        now = time.time()
        refs = self.refs(uid, now)
        conv = self.conversations(uid).document(cid)
        owner = self.db.collection('aiUsers').document(uid)
        @firestore.transactional
        def run(tx):
            u,g,p,m = [r.get(transaction=tx).to_dict() or {} for r in refs]
            existing = conv.get(transaction=tx).to_dict()
            meta = owner.get(transaction=tx).to_dict() or {}
            if meta.get('busyUntil',0) > now:
                raise APIError(429,'Aguarde a resposta anterior.')
            if not existing and meta.get('conversationCount',0) >= 30:
                raise APIError(409,'Você pode guardar até 30 conversas. Exclua uma para continuar.')
            c = existing or {'title':text[:70], 'messages':[]}
            if rid in u.get('requests',[]):
                raise APIError(409, 'Este envio já foi recebido. Atualize a conversa antes de tentar novamente.')
            if len(c['messages']) >= 60:
                raise APIError(409, 'Esta conversa atingiu 30 respostas. Crie uma nova conversa.')
            contents, tokens = context(c['messages'], text)
            entries = [e for e in m.get('entries',[]) if e['at'] > now-60]
            window = {'count':len(entries),'tokens':sum(e['tokens'] for e in entries)}
            check_budget(u,g,p,window,self.limits,now,tokens)
            tx.set(owner,{**meta,'busyUntil':now+120,'pending':cid})
            tx.set(refs[0], {'count':u.get('count',0)+1,'last':now,'busyUntil':now+120,
                             'requests':(u.get('requests',[])+[rid])[-20:]})
            tx.set(refs[1], {'count':g.get('count',0)+1})
            tx.set(refs[2], {**p,'count':p.get('count',0)+1,'tokens':p.get('tokens',0)+tokens})
            tx.set(refs[3], {'entries':entries+[{'at':now,'tokens':tokens}]})
            return c, contents, refs[0], refs[2]
        return run(self.db.transaction())

    def finish(self, uid, cid, c, text, answer, uref, pref, blocked=False):
        from firebase_admin import firestore
        @firestore.transactional
        def run(tx):
            owner = self.db.collection('aiUsers').document(uid)
            meta = owner.get(transaction=tx).to_dict() or {}
            exists = self.conversations(uid).document(cid).get(transaction=tx).exists
            p = pref.get(transaction=tx).to_dict() or {} if blocked else None
            tx.update(uref, {'busyUntil':0})
            tx.set(owner,{**meta,'busyUntil':0,'pending':None,'conversationCount':meta.get('conversationCount',0)+(1 if answer and not exists else 0)})
            if blocked:
                tx.set(pref, {**p, 'blockedUntil':time.time()+3600})
            if answer:
                record = {**c, 'messages':c['messages']+[{'role':'user','text':text}, {'role':'model','text':answer}], 'updatedAt':time.time()}
                tx.set(self.conversations(uid).document(cid), record)
        run(self.db.transaction())

    def delete(self, uid, cid=None):
        from firebase_admin import firestore
        # Same per-user lock prevents a pending generation from restoring deleted history.
        uref = self.db.collection('aiUsers').document(uid)
        @firestore.transactional
        def run(tx):
            u = uref.get(transaction=tx).to_dict() or {}
            if u.get('busyUntil',0) > time.time():
                raise APIError(409,'Aguarde a resposta antes de excluir.')
            docs = [d for d in [self.conversations(uid).document(cid).get(transaction=tx)] if d.exists] if cid else list(self.conversations(uid).limit(100).stream(transaction=tx))
            tx.set(uref,{**u,'conversationCount':max(0,u.get('conversationCount',0)-len(docs))}) # conflict with any concurrent send
            for d in docs:
                tx.delete(d.reference if hasattr(d,'reference') else d)
            return len(docs)
        return run(self.db.transaction())
