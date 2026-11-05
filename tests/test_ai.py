import unittest, threading, copy, io, json
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from unittest.mock import patch, Mock
from backend.core import APIError, keys, validate, context, check_budget
from backend.store import Store
from backend.server import Service, Handler, load_config

LIMITS = {'rpd':1000,'rpm':1000,'tpm':100000000,'tpd':100000000}
NOW = 1793880000

class Snap:
    def __init__(self, ref): self.reference,self.id,self.data = ref,ref.id,copy.deepcopy(ref.db.data.get(ref.path))
    @property
    def exists(self): return self.data is not None
    def to_dict(self): return copy.deepcopy(self.data)
class Ref:
    def __init__(self, db, path): self.db,self.path,self.id = db,path,path.split('/')[-1]
    def get(self, transaction=None): return Snap(self)
    def collection(self,name): return Collection(self.db,self.path+'/'+name)
class Collection:
    def __init__(self,db,path): self.db,self.path,self.n,self.desc=db,path,100,False
    def document(self,name): return Ref(self.db,self.path+'/'+name)
    def limit(self,n): self.n=n; return self
    def order_by(self,*args,**kwargs): self.desc=True; return self
    def select(self,*args,**kwargs): return self
    def stream(self, transaction=None):
        docs=[Ref(self.db,k).get() for k in self.db.data if k.startswith(self.path+'/') and k.count('/')==self.path.count('/')+1]
        return iter(sorted(docs,key=lambda d:d.data.get('updatedAt',0),reverse=self.desc)[:self.n])
class Tx:
    def __init__(self,db): self.db,self.writes=db,[]
    def set(self,r,d): self.writes.append(('set',r.path,copy.deepcopy(d)))
    def update(self,r,d): self.writes.append(('set',r.path,{**self.db.data.get(r.path,{}),**d}))
    def delete(self,r): self.writes.append(('delete',r.path,None))
class DB:
    def __init__(self): self.data,self.lock={},threading.Lock()
    def collection(self,name): return Collection(self,name)
    def transaction(self): return Tx(self)
def transactional(fn):
    def call(tx):
        with tx.db.lock:
            result=fn(tx)
            for op,key,val in tx.writes:
                if op=='delete': tx.db.data.pop(key,None)
                else: tx.db.data[key]=val
            return result
    return call

class PolicyTests(unittest.TestCase):
    def test_brasilia_midnight(self):
        before=datetime(2026,11,5,2,59,59,tzinfo=timezone.utc).timestamp()
        self.assertEqual(keys(before)[0],'2026-11-04')
        self.assertEqual(keys(before+1)[0],'2026-11-05')
        self.assertEqual(keys(before)[1],keys(before+1)[1])
    def test_validate(self):
        base={'text':' x² ', 'conversationId':'abc','requestId':'uuid'}
        self.assertEqual(validate(base)[0],'x²')
        for invalid in ('', ' '*20,'x'*2001,23,None):
            with self.assertRaises(APIError): validate({**base,'text':invalid})
        with self.assertRaises(APIError): validate({**base,'conversationId':'../../someone'})
        with self.assertRaises(APIError): validate({**base,'level':'admin'})
    def test_context_bounded(self):
        c,t=context([{'text':'á'*2000,'role':'user' if i%2==0 else 'model'} for i in range(100)],'dica')
        self.assertLessEqual(len(c),13); self.assertLess(t,16000)
        self.assertEqual(c[-1]['parts'][0]['text'],'dica')
    def test_each_budget(self):
        for state in [({'count':20},{},{},{}), ({},{'count':200},{},{}), ({},{},{'count':1000},{}),
                      ({},{},{'tokens':100000000},{}), ({},{},{},{'count':1000}),
                      ({},{},{},{'tokens':100000000}), ({},{},{'blockedUntil':NOW+10},{}),
                      ({'busyUntil':NOW+10},{},{},{}), ({'last':NOW-2},{},{},{})]:
            with self.assertRaises(APIError): check_budget(*state,LIMITS,NOW,100)

class StoreTests(unittest.TestCase):
    def setUp(self):
        self.db=DB();self.store=Store(self.db,LIMITS)
        self.mock=patch('firebase_admin.firestore.transactional',transactional);self.mock.start()
        self.clock_patch=patch('backend.store.time.time',return_value=NOW);self.clock=self.clock_patch.start()
    def tearDown(self): self.mock.stop();self.clock_patch.stop()
    def send(self,uid='alice',cid='chat',rid='req',answer='Resposta'):
        c,ctx,u,p=self.store.reserve(uid,cid,rid,'Pergunta')
        self.store.finish(uid,cid,c,'Pergunta',answer,u,p)
        return ctx
    def test_history_resume_and_isolation(self):
        self.send()
        self.assertEqual(len(self.store.get('alice','chat')['messages']),2)
        self.assertEqual(self.store.list('alice')[0]['id'],'chat')
        with self.assertRaises(APIError): self.store.get('bob','chat')
        self.assertEqual(self.store.list('bob'),[])
        self.clock.return_value=NOW+6
        self.assertEqual(len(self.send(rid='req2')),3)
    def test_replay_not_charged_twice(self):
        self.send();self.clock.return_value=NOW+6
        with self.assertRaises(APIError): self.send()
        self.assertEqual(self.store.usage('alice')['individual'],19)
    def test_individual_twentieth_and_twenty_first(self):
        ref=self.store.refs('alice',NOW)[0]
        self.db.data[ref.path]={'count':19}
        self.send();self.clock.return_value=NOW+6
        with self.assertRaises(APIError): self.send(rid='req2')
        self.assertEqual(self.store.usage('alice')['individual'],0)
    def test_concurrent_global_only_one_last_slot(self):
        ref=self.store.refs('alice',NOW)[1];self.db.data[ref.path]={'count':199}
        def attempt(i):
            try: self.send(uid='student'+str(i));return True
            except APIError: return False
        with ThreadPoolExecutor(max_workers=20) as pool: results=list(pool.map(attempt,range(30)))
        self.assertEqual(sum(results),1)
        self.assertEqual(self.db.data[ref.path]['count'],200)
    def test_simultaneous_same_uid(self):
        self.store.reserve('alice','chat','r1','a')
        with self.assertRaises(APIError): self.store.reserve('alice','other','r2','b')
    def test_failure_preserves_budget_no_false_message(self):
        self.send(answer=None)
        self.assertEqual(self.store.usage('alice')['individual'],19)
        self.assertEqual(self.store.list('alice'),[])
    def test_provider_429_circuit_breaker(self):
        c,ctx,u,p=self.store.reserve('alice','chat','r1','a')
        self.store.finish('alice','chat',c,'a',None,u,p,True)
        with self.assertRaises(APIError): self.store.reserve('bob','chat','r2','b')
    def test_delete_keeps_limits_and_other_students(self):
        self.send();self.send(uid='bob')
        self.assertEqual(self.store.delete('alice'),1)
        self.assertEqual(self.store.list('alice'),[])
        self.assertEqual(self.store.usage('alice')['individual'],19)
        self.assertEqual(len(self.store.list('bob')),1)
    def test_no_delete_while_pending_even_after_midnight(self):
        before=datetime(2026,11,5,2,59,59,tzinfo=timezone.utc).timestamp()
        self.clock.return_value=before
        self.store.reserve('alice','chat','r1','a')
        self.clock.return_value=before+2
        with self.assertRaises(APIError): self.store.delete('alice')
    def test_storage_limits(self):
        self.db.data['aiUsers/alice']={'conversationCount':30}
        with self.assertRaises(APIError): self.send()
        self.db.data['aiUsers/alice']={}
        self.db.data['aiUsers/alice/conversations/chat']={'title':'x','messages':[{'role':'user','text':'x'}]*60}
        with self.assertRaises(APIError): self.send()
    def test_next_day_resets(self):
        self.send();self.clock.return_value=NOW+86400
        self.assertEqual(self.store.usage('alice')['individual'],20)

class AuthTests(unittest.TestCase):
    def setUp(self):
        self.s=Service({}); self.s.store=Mock();self.s.app=None
    def test_verified_user(self):
        u=Mock(disabled=False,email_verified=True,email='student@example.com')
        with patch('firebase_admin.auth.verify_id_token',return_value={'uid':'student','firebase':{'sign_in_provider':'password'}}) as verify, patch('firebase_admin.auth.get_user',return_value=u):
            self.assertEqual(self.s.user('token',''),'student')
            self.assertTrue(verify.call_args.kwargs['check_revoked'])
    def test_unverified_disabled_anonymous(self):
        for disabled,verified,provider in [(False,False,'password'),(True,True,'google.com'),(False,True,'anonymous')]:
            with patch('firebase_admin.auth.verify_id_token',return_value={'uid':'x','firebase':{'sign_in_provider':provider}}), patch('firebase_admin.auth.get_user',return_value=Mock(disabled=disabled,email_verified=verified,email='x@y.com')):
                with self.assertRaises(APIError) as e:self.s.user('token','')
                self.assertEqual(e.exception.status,403)
    def test_invalid_token(self):
        with patch('firebase_admin.auth.verify_id_token',side_effect=ValueError):
            with self.assertRaises(APIError) as e:self.s.user('bad','')
            self.assertEqual(e.exception.status,401)
    def test_appcheck(self):
        self.s.config={'appCheckSiteKey':'sitekey'}
        with patch('firebase_admin.auth.verify_id_token',return_value={'uid':'student'}),patch('firebase_admin.auth.get_user',return_value=Mock(disabled=False,email_verified=True,email='a@b.com')),patch('firebase_admin.app_check.verify_token',side_effect=ValueError):
            with self.assertRaises(APIError):self.s.user('token','invalid-attestation')
    def test_no_configuration_fail_closed(self):
        self.assertFalse(Service({}).ready())
        with self.assertRaises(APIError):Service({}).user('token','')

class HTTPTests(unittest.TestCase):
    def request(self,path,method='GET',host='localhost:8765',origin=None):
        h=Handler.__new__(Handler)
        h.headers={'Host':host}
        if origin: h.headers['Origin']=origin
        h.path,h.command=path,method
        h.server=Mock(server_port=8765,service=Service({}))
        h.send=Mock()
        h.dispatch()
        return h.send.call_args.args
    def test_status_and_safe_local_config(self):
        self.assertFalse(self.request('/api/status')[1]['ready'])
        cfg=self.request('/assets/js/firebase-config.js')[1].decode()
        self.assertIn('CONFIG=null',cfg);self.assertNotIn('briif-site',cfg)
    def test_no_credentials_or_source_served(self):
        for path in ['/.local/config.json','/.git/config','/backend/server.py','/requirements.lock.txt','/assets/../../.local/config.json']:
            with self.assertRaises(APIError):self.request(path)
    def test_host_and_origin(self):
        with self.assertRaises(APIError):self.request('/api/status',host='evil.example')
        with self.assertRaises(APIError):self.request('/api/status',origin='https://evil.example')
    def test_protected_endpoints(self):
        for path in ['/api/messages','/api/conversations','/api/usage']:
            with self.assertRaises(APIError) as e:self.request(path)
            self.assertEqual(e.exception.status,401)
    def test_model_error_sanitized(self):
        from urllib.error import HTTPError
        s=Service({});s.config={'geminiModel':'gemini-test'};s.key=lambda:'SECRET'
        with patch('backend.server.urlopen',side_effect=HTTPError('url',429,'secret upstream body',None,None)):
            with self.assertRaises(APIError) as e:s.generate([], 'iniciante')
            self.assertEqual(e.exception.status,429);self.assertNotIn('secret',e.exception.message)
    def test_production_project_rejected(self):
        with patch('backend.server.CONFIG_FILE') as f:
            f.exists.return_value=True;f.read_text.return_value=json.dumps({'firebase':{'projectId':'briif-site'}})
            with self.assertRaises(RuntimeError):load_config()

if __name__=='__main__':unittest.main()
