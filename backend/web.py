"""Render WSGI API: no local files, developer credentials, or Firebase test config."""
import os, threading, time
from flask import Flask, request, jsonify
from werkzeug.exceptions import HTTPException
from werkzeug.middleware.proxy_fix import ProxyFix
from .core import APIError, validate, identifier
from .runtime_config import runtime_config
from .server import Service


def create_app(service=None, config=None):
    cfg = config if config is not None else runtime_config(os.environ)
    service = service if service is not None else Service(cfg)
    if not service.store:
        raise RuntimeError('Não foi possível inicializar o backend Firebase.')
    app = Flask(__name__, static_folder=None)
    app.config.update(MAX_CONTENT_LENGTH=12000)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)
    slots, lock, rates = threading.BoundedSemaphore(12), threading.Lock(), {}
    origins = set(cfg['allowedOrigins'])

    @app.before_request
    def protect():
        origin = request.headers.get('Origin')
        if origin and origin not in origins:
            raise APIError(403, 'Origem não permitida.')
        if request.method == 'OPTIONS':
            if request.headers.get('Access-Control-Request-Method') not in ('GET','POST','DELETE'):
                raise APIError(405, 'Método não permitido.')
            return ('', 204)
        if request.path in ('/healthz', '/api/status'):
            return None
        if not slots.acquire(blocking=False):
            raise APIError(429, 'Servidor ocupado. Tente novamente em instantes.')
        request.briiff_slot = True
        token = request.headers.get('Authorization', '')
        if not token.startswith('Bearer ') or len(token) > 8192:
            raise APIError(401, 'Entre na sua conta para continuar.')
        minute = int(time.time()//60)
        # Bound invalid-token requests too; Render is the only trusted proxy.
        ip = request.remote_addr or 'unknown'
        with lock:
            if len(rates) >= 4096:
                for old in [k for k,v in rates.items() if v[1] < minute]: rates.pop(old, None)
                if len(rates) >= 4096 and 'ip:'+ip not in rates:
                    raise APIError(429, 'Servidor ocupado. Aguarde um minuto.')
            count, stamp = rates.get('ip:'+ip, (0, minute))
            count = count if stamp == minute else 0
            if count >= 90:
                raise APIError(429, 'Muitas requisições. Aguarde um minuto.')
            rates['ip:'+ip] = (count+1, minute)
        uid = service.user(token[7:], request.headers.get('X-Firebase-AppCheck', ''))
        with lock:
            count, stamp = rates.get('uid:'+uid, (0, minute))
            count = count if stamp == minute else 0
            if count >= 30:
                raise APIError(429, 'Muitas requisições. Aguarde um minuto.')
            rates['uid:'+uid] = (count+1, minute)
            if len(rates)>2000:
                expired = [key for key,value in rates.items() if value[1]<minute]
                for key in expired: rates.pop(key, None)
        request.briiff_uid = uid

    @app.teardown_request
    def release(error=None):
        if getattr(request, 'briiff_slot', False):
            slots.release()
            request.briiff_slot = False

    @app.after_request
    def headers(response):
        origin = request.headers.get('Origin')
        if origin in origins:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, X-Firebase-AppCheck'
            response.headers['Access-Control-Max-Age'] = '600'
            response.headers.add('Vary','Origin')
        response.headers['Cache-Control'] = 'no-store'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        return response

    @app.errorhandler(APIError)
    def policy_error(error):
        return jsonify(error=error.message), error.status

    @app.errorhandler(Exception)
    def safe_error(error):
        if isinstance(error, HTTPException):
            return jsonify(error='Requisição inválida.'), error.code
        # Do not log auth tokens, user prompts, or provider payloads.
        app.logger.error('BRIIFF API failure: %s', type(error).__name__)
        return jsonify(error='Serviço temporariamente indisponível. Tente novamente mais tarde.'), 503

    @app.get('/healthz')
    def health():
        return jsonify(ok=True)

    @app.get('/api/status')
    def status():
        return jsonify(ready=service.ready(), firebase=True, testEnvironment=False,
                       projectId=cfg['firebase']['projectId'], message='')

    @app.get('/api/usage')
    def usage():
        return jsonify(service.store.usage(request.briiff_uid))

    @app.route('/api/conversations', methods=['GET', 'DELETE'])
    def conversations():
        if request.method == 'GET':
            return jsonify(service.store.list(request.briiff_uid))
        return jsonify(deleted=service.store.delete(request.briiff_uid))

    @app.route('/api/conversations/<cid>', methods=['GET', 'DELETE'])
    def conversation(cid):
        identifier(cid)
        if request.method == 'GET':
            return jsonify(service.store.get(request.briiff_uid, cid))
        return jsonify(deleted=service.store.delete(request.briiff_uid, cid))

    @app.post('/api/messages')
    def messages():
        if not service.ready():
            raise APIError(503, 'O assistente está temporariamente indisponível.')
        body = request.get_json(silent=True)
        if not isinstance(body, dict):
            raise APIError(400, 'Mensagem inválida.')
        text, cid, rid, level = validate(body)
        uid = request.briiff_uid
        c, contents, uref, pref = service.store.reserve(uid, cid, rid, text)
        answer, blocked = None, False
        try:
            answer = service.generate(contents, level)
        except APIError as error:
            blocked = error.status == 429
            raise
        finally:
            service.store.finish(uid, cid, c, text, answer, uref, pref, blocked)
        return jsonify(answer=answer, conversationId=cid, usage=service.store.usage(uid))

    return app
