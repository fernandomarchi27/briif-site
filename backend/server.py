"""Local-only BRIIFF AI server. No deploy commands; no production project allowed."""
import json, os, re, time, threading
from pathlib import Path
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import urlsplit
from .core import APIError, PROMPT, validate, identifier

ROOT = Path(__file__).resolve().parent.parent
CONFIG_FILE = ROOT / '.local/config.json'

def load_config():
    c = json.loads(CONFIG_FILE.read_text()) if CONFIG_FILE.exists() else {}
    f = c.get('firebase',{})
    project = f.get('projectId','')
    if project and (project == 'briif-site' or not re.fullmatch(r'[a-z][a-z0-9-]*-(test|dev|sandbox)',project)):
        raise RuntimeError('Use um projeto Firebase separado terminado em -test, -dev ou -sandbox.')
    if f and (f.get('authDomain') != project+'.firebaseapp.com'):
        raise RuntimeError('authDomain deve pertencer ao projeto de testes.')
    return c

class Service:
    def __init__(self, config):
        self.config, self.store, self.app = config, None, None
        self.error = 'Configure um Firebase de testes e o Gemini. Consulte docs/BRIIFF_AI.md.'
        if not config.get('firebase'):
            return
        try:
            import firebase_admin
            from firebase_admin import credentials, firestore
            from .store import Store
            credential = config.get('credentialFile')
            if config.get('environment') == 'production':
                cred_data = config.get('adminCredential', {})
                if cred_data.get('project_id') != config['firebase']['projectId']:
                    raise ValueError('Credencial do servidor não corresponde ao projeto.')
                admin_credential = credentials.Certificate(cred_data)
            elif config.get('useFirebaseCliCredentials'):
                from .local_credentials import firebase_cli_credential
                admin_credential = firebase_cli_credential(config['firebase']['projectId'])
            elif credential:
                cred_data = json.loads(Path(credential).expanduser().read_text())
                if cred_data.get('project_id') != config['firebase']['projectId']:
                    raise ValueError('Credencial não pertence ao projeto de testes.')
                admin_credential = credentials.Certificate(cred_data)
            else:
                self.error = 'Conecte o Firebase CLI ou configure a credencial do projeto de testes.'
                return
            limits = config.get('limits',{})
            for name in ('rpd','rpm','tpm','tpd'):
                if type(limits.get(name)) is not int or limits[name] < 1:
                    raise ValueError('Confira as cotas no AI Studio e configure limits: rpd, rpm, tpm e tpd.')
            self.app = firebase_admin.initialize_app(admin_credential,
                {'projectId':config['firebase']['projectId']})
            self.store = Store(firestore.client(app=self.app),limits)
            self.error = ''
        except Exception as e:
            self.error = 'Revise o arquivo local de configuração e as credenciais do projeto de testes.'

    def key(self):
        p = self.config.get('geminiKeyFile')
        try:
            return Path(p).expanduser().read_text().strip() if p else os.environ.get('GEMINI_API_KEY','')
        except OSError:
            return ''

    def ready(self):
        return bool(self.store and self.key() and self.config.get('geminiModel'))

    def user(self, token, appcheck):
        if not self.store:
            raise APIError(503, self.error)
        from firebase_admin import auth, app_check
        try:
            claims = auth.verify_id_token(token, app=self.app, check_revoked=True)
            user = auth.get_user(claims['uid'], app=self.app)
            if user.disabled or not user.email_verified or not user.email:
                raise APIError(403,'Confirme seu e-mail antes de usar o BRIIFF AI.')
            if claims.get('firebase',{}).get('sign_in_provider') == 'anonymous':
                raise APIError(403,'Entre com e-mail e senha ou Google para usar o BRIIFF AI.')
            if self.config.get('appCheckSiteKey'):
                app_check.verify_token(appcheck, app=self.app)
            return claims['uid']
        except APIError:
            raise
        except Exception:
            raise APIError(401,'Sua sessão expirou. Entre novamente.')

    def generate(self, contents, level):
        model = self.config['geminiModel']
        if not re.fullmatch(r'gemini-[a-zA-Z0-9.-]+',model):
            raise APIError(503,'Modelo Gemini inválido na configuração local.')
        body = {'systemInstruction':{'parts':[{'text':PROMPT+'\nNível do aluno: '+level}]},
                'contents':contents,'generationConfig':{'maxOutputTokens':1024,'temperature':0.3}}
        thinking = self.config.get('geminiThinkingLevel')
        if thinking in ('minimal','low','medium','high'):
            body['generationConfig']['thinkingConfig'] = {'thinkingLevel':thinking}
        req = Request(f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
                      data=json.dumps(body).encode(),headers={'Content-Type':'application/json','x-goog-api-key':self.key()})
        try:
            with urlopen(req, timeout=45) as r:
                data = json.load(r)
        except HTTPError as e:
            print(f'Gemini provider HTTP {e.code}', flush=True)
            e.close()
            if e.code == 429:
                raise APIError(429,'A cota do Gemini foi atingida. Novos envios foram suspensos por uma hora.')
            raise APIError(503,'O Gemini está indisponível. Tente mais tarde.')
        except Exception as e:
            print(f'Gemini transport error {type(e).__name__}', flush=True)
            raise APIError(503,'Não foi possível receber uma resposta do Gemini.')
        candidates = data.get('candidates',[])
        answer = ''.join(p.get('text','') for p in candidates[0].get('content',{}).get('parts',[]) if not p.get('thought')) if candidates else ''
        if not answer.strip():
            raise APIError(503,'A IA não conseguiu responder. Reformule a pergunta.')
        return answer[:6000]

class Handler(BaseHTTPRequestHandler):
    server_version = 'BRIIFFLocal/1'
    def log_message(self, fmt, *args):
        pass # No student prompts, tokens, emails, or secret paths in logs.

    def send(self, status, data, content_type='application/json; charset=utf-8'):
        raw = json.dumps(data,ensure_ascii=False).encode() if isinstance(data,(dict,list)) else data
        self.send_response(status)
        self.send_header('Content-Type',content_type)
        self.send_header('Content-Length',str(len(raw)))
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('X-Frame-Options','DENY')
        self.send_header('Referrer-Policy','same-origin')
        self.end_headers()
        self.wfile.write(raw)

    def dispatch(self):
        host = self.headers.get('Host','')
        if host not in (f'127.0.0.1:{self.server.server_port}',f'localhost:{self.server.server_port}'):
            raise APIError(403,'Host não permitido.')
        origin = self.headers.get('Origin')
        if origin and origin not in (f'http://127.0.0.1:{self.server.server_port}',f'http://localhost:{self.server.server_port}'):
            raise APIError(403,'Origem não permitida.')
        path = urlsplit(self.path).path
        service = self.server.service
        if path == '/assets/js/firebase-config.js' and self.command == 'GET':
            public = service.config.get('firebase') or None
            extra = {'appCheckSiteKey':service.config.get('appCheckSiteKey'),'apiBase':''}
            return self.send(200,('window.BRIIF_FIREBASE_CONFIG='+json.dumps(public)+';window.BRIIFF_AI_CONFIG='+json.dumps(extra)+';').encode(),'text/javascript')
        if path == '/api/status' and self.command == 'GET':
            return self.send(200, {'ready':service.ready(),'firebase':bool(service.config.get('firebase')),
                'message':service.error or ('' if service.ready() else 'Falta configurar chave e modelo Gemini.'),'testEnvironment':True})
        if not path.startswith('/api/'):
            if self.command != 'GET':
                raise APIError(405,'Método não permitido.')
            import mimetypes
            target = (ROOT / (path.lstrip('/') or 'index.html')).resolve()
            safe = target.is_relative_to(ROOT/'assets') or (target.parent == ROOT and target.suffix in ('.html','.svg'))
            if not safe or not target.is_file() or target.is_symlink():
                raise APIError(404,'Página não encontrada.')
            return self.send(200,target.read_bytes(),mimetypes.guess_type(target)[0] or 'application/octet-stream')
        token = self.headers.get('Authorization','')
        if not token.startswith('Bearer '):
            raise APIError(401,'Entre na sua conta para continuar.')
        # Bound local workload before costly Firebase token verification.
        if not self.server.slots.acquire(blocking=False):
            raise APIError(429,'Servidor ocupado. Tente novamente em instantes.')
        try:
            uid = service.user(token[7:],self.headers.get('X-Firebase-AppCheck',''))
            # Bound reads and invalid requests as well as model calls.
            with self.server.rate_lock:
                minute = int(time.time()//60)
                count,stamp = self.server.rates.get(uid,(0,minute))
                count = count if stamp == minute else 0
                if count >= 30: raise APIError(429,'Muitas requisições. Aguarde um minuto.')
                self.server.rates[uid] = (count+1,minute)
                if len(self.server.rates)>1000:
                    self.server.rates = {k:v for k,v in self.server.rates.items() if v[1]>=minute-1}
            store = service.store
            if path == '/api/usage' and self.command == 'GET':
                return self.send(200,store.usage(uid))
            if path == '/api/conversations':
                if self.command == 'GET': return self.send(200,store.list(uid))
                if self.command == 'DELETE': return self.send(200,{'deleted':store.delete(uid)})
            if path.startswith('/api/conversations/'):
                cid = identifier(path.removeprefix('/api/conversations/'))
                if self.command == 'GET': return self.send(200,store.get(uid,cid))
                if self.command == 'DELETE': return self.send(200,{'deleted':store.delete(uid,cid)})
            if path == '/api/messages' and self.command == 'POST':
                if not service.ready(): raise APIError(503,'Configure a chave e o modelo Gemini no backend local.')
                try:
                    size = int(self.headers.get('Content-Length','0'))
                    if not 0 < size <= 12000: raise ValueError()
                    body = json.loads(self.rfile.read(size))
                    if not isinstance(body,dict): raise ValueError()
                except (ValueError,UnicodeError):
                    raise APIError(400,'Mensagem inválida ou muito longa.')
                text,cid,rid,level = validate(body)
                c,contents,uref,pref = store.reserve(uid,cid,rid,text)
                answer,blocked = None,False
                try:
                    answer = service.generate(contents,level)
                except APIError as e:
                    blocked = e.status == 429
                    raise
                finally:
                    store.finish(uid,cid,c,text,answer,uref,pref,blocked)
                return self.send(200,{'answer':answer,'conversationId':cid,'usage':store.usage(uid)})
            raise APIError(404,'Recurso não encontrado.')
        finally:
            self.server.slots.release()

    def handle_request(self):
        self.connection.settimeout(60)
        try:
            self.dispatch()
        except APIError as e:
            self.send(e.status,{'error':e.message})
        except (BrokenPipeError,ConnectionResetError):
            pass
        except Exception:
            self.send(503,{'error':'Serviço temporariamente indisponível. Tente novamente mais tarde.'})
    do_GET = do_POST = do_DELETE = handle_request

def main():
    service = Service(load_config())
    server = ThreadingHTTPServer(('127.0.0.1',8765),Handler)
    server.rates,server.rate_lock = {},threading.Lock()
    server.service,server.slots = service,threading.BoundedSemaphore(12)
    print('BRIIFF local: http://127.0.0.1:8765/ai.html',flush=True)
    print(service.error or 'Firebase de testes configurado.',flush=True)
    server.serve_forever()

if __name__ == '__main__': main()
