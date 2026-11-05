"""Explicit production configuration. Local server keeps its strict test-only guard."""
import json
from pathlib import Path
from urllib.parse import urlsplit


def runtime_config(env):
    if env.get('BRIIFF_ENV') != 'production':
        raise ValueError('Defina BRIIFF_ENV=production somente na hospedagem autorizada.')
    project = env.get('FIREBASE_PROJECT_ID', '')
    if project != 'briif-site':
        raise ValueError('O backend principal deve usar o Firebase briif-site.')
    raw = env.get('FIREBASE_ADMIN_JSON', '')
    if not raw and env.get('FIREBASE_ADMIN_JSON_FILE'):
        raw = Path(env['FIREBASE_ADMIN_JSON_FILE']).read_text()
    credential = json.loads(raw)
    if credential.get('type') != 'service_account' or credential.get('project_id') != project:
        raise ValueError('A credencial deve pertencer ao projeto principal.')
    keyfile = env.get('GEMINI_API_KEY_FILE')
    if not env.get('GEMINI_API_KEY') and not (keyfile and Path(keyfile).read_text().strip()):
        raise ValueError('Falta a chave Gemini na configuração protegida do servidor.')
    origins = [o.strip().rstrip('/') for o in env.get('BRIIFF_ALLOWED_ORIGINS', '').split(',') if o.strip()]
    if not origins:
        raise ValueError('Configure os endereços HTTPS autorizados do site principal.')
    for origin in origins:
        parts = urlsplit(origin)
        if parts.scheme != 'https' or not parts.netloc or parts.path or parts.query or parts.fragment or parts.username:
            raise ValueError('Origem inválida: use somente https://dominio.')
    model = env.get('GEMINI_MODEL', 'gemini-3.1-flash-lite')
    if model != 'gemini-3.1-flash-lite':
        raise ValueError('Modelo de produção não corresponde à cota gratuita verificada.')
    # These ceilings stay below the verified free limits for the selected model.
    ceilings = {'rpd':400, 'rpm':10, 'tpm':200000, 'tpd':4000000}
    limits = {}
    for name, ceiling in ceilings.items():
        value = int(env.get('BRIIFF_' + name.upper(), ceiling))
        if value < 1 or value > ceiling:
            raise ValueError('Orçamento inválido: ' + name)
        limits[name] = value
    return {'environment':'production', 'firebase':{'projectId':project, 'authDomain':project+'.firebaseapp.com'},
            'adminCredential':credential, 'geminiKeyFile':keyfile, 'allowedOrigins':origins, 'limits':limits,
            'geminiModel':model, 'geminiThinkingLevel':'minimal',
            'appCheckSiteKey':env.get('FIREBASE_APP_CHECK_SITE_KEY') or None}
