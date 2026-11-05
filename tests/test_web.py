import unittest,json
from unittest.mock import Mock
from backend.core import APIError
from backend.web import create_app
from backend.runtime_config import runtime_config

ORIGIN='https://briiff-main.example'
class RuntimeConfigTests(unittest.TestCase):
 def env(self):
  return {'BRIIFF_ENV':'production','FIREBASE_PROJECT_ID':'briif-site',
          'FIREBASE_ADMIN_JSON':json.dumps({'type':'service_account','project_id':'briif-site'}),
          'GEMINI_API_KEY':'test-placeholder','BRIIFF_ALLOWED_ORIGINS':ORIGIN}
 def test_explicit_project_credential_and_limits(self):
  cfg=runtime_config(self.env());self.assertEqual(cfg['firebase']['projectId'],'briif-site')
  self.assertNotIn('useFirebaseCliCredentials',cfg);self.assertEqual(cfg['limits']['rpd'],400)
 def test_reject_bad_config(self):
  for change in [{'BRIIFF_ENV':'local'},{'FIREBASE_PROJECT_ID':'other'},
                 {'FIREBASE_ADMIN_JSON':'{}'},{'GEMINI_API_KEY':''},
                 {'BRIIFF_ALLOWED_ORIGINS':'*'},{'BRIIFF_ALLOWED_ORIGINS':'http://plain.example'},
                 {'BRIIFF_RPD':'501'},{'BRIIFF_TPM':'0'},{'GEMINI_MODEL':'gemini-unverified-model'}]:
   with self.subTest(change=change), self.assertRaises((ValueError,KeyError)):
    runtime_config({**self.env(),**change})

class WebTests(unittest.TestCase):
 def setUp(self):
  self.service=Mock();self.service.user.return_value='signed-uid';self.service.ready.return_value=True
  cfg={'firebase':{'projectId':'briif-site'},'allowedOrigins':[ORIGIN]}
  self.app=create_app(self.service,cfg);self.client=self.app.test_client()
  self.headers={'Authorization':'Bearer TOKEN','Origin':ORIGIN}
 def test_status_and_health_no_auth(self):
  self.assertEqual(self.client.get('/healthz').status_code,200)
  data=self.client.get('/api/status').get_json();self.assertTrue(data['ready']);self.assertFalse(data['testEnvironment'])
  self.assertEqual(data['projectId'],'briif-site');self.service.user.assert_not_called()
 def test_cors_restricts_origin_and_no_credentials(self):
  ok=self.client.options('/api/messages',headers={'Origin':ORIGIN,'Access-Control-Request-Method':'POST'})
  self.assertEqual(ok.status_code,204);self.assertEqual(ok.headers['Access-Control-Allow-Origin'],ORIGIN)
  self.assertNotIn('Access-Control-Allow-Credentials',ok.headers)
  self.assertEqual(self.client.get('/api/status',headers={'Origin':'https://evil.example'}).status_code,403)
 def test_private_routes_require_token(self):
  self.assertEqual(self.client.get('/api/conversations').status_code,401)
  self.service.user.assert_not_called()
 def test_server_uid_not_body_uid(self):
  self.service.store.usage.return_value={'individual':19,'global':199,'provider':399}
  data=self.client.get('/api/usage',headers=self.headers).get_json()
  self.assertEqual(data['individual'],19);self.service.store.usage.assert_called_once_with('signed-uid')
 def test_invalid_body_before_reservation(self):
  for value in [[],{}, {'text':'x'*2001,'conversationId':'a','requestId':'b'}]:
   self.assertEqual(self.client.post('/api/messages',json=value,headers=self.headers).status_code,400)
  self.service.store.reserve.assert_not_called()
 def test_success_and_failure_finish_reservation(self):
  self.service.store.reserve.return_value=({'messages':[]},[], 'uref','pref')
  self.service.generate.return_value='x=4';self.service.store.usage.return_value={'individual':19}
  body={'text':'2x+3=11','conversationId':'chat','requestId':'request','uid':'forged'}
  response=self.client.post('/api/messages',json=body,headers=self.headers)
  self.assertEqual(response.status_code,200);self.assertEqual(response.get_json()['answer'],'x=4')
  self.assertEqual(self.service.store.reserve.call_args.args[0],'signed-uid')
  self.service.generate.side_effect=APIError(429,'quota')
  self.assertEqual(self.client.post('/api/messages',json={**body,'requestId':'second'},headers=self.headers).status_code,429)
  self.assertEqual(self.service.store.finish.call_args.args[-1],True)
 def test_unverified_and_error_sanitization(self):
  self.service.user.side_effect=APIError(403,'Confirme seu e-mail.')
  self.assertEqual(self.client.get('/api/usage',headers=self.headers).status_code,403)
  self.service.user.side_effect=ValueError('SECRET-DO-NOT-LEAK')
  response=self.client.get('/api/usage',headers=self.headers)
  self.assertEqual(response.status_code,503);self.assertNotIn('SECRET',response.get_data(as_text=True))
 def test_no_files_served(self):
  for path in ['/.local/config.json','/backend/server.py','/assets/js/firebase-config.js']:
   self.assertEqual(self.client.get(path,headers=self.headers).status_code,404)
 def test_request_size_and_per_user_read_limit(self):
  response=self.client.post('/api/messages',data='x'*12001,content_type='application/json',headers=self.headers)
  self.assertEqual(response.status_code,413)
  self.service.store.usage.return_value={'individual':20}
  for _ in range(29):self.client.get('/api/usage',headers=self.headers)
  self.assertEqual(self.client.get('/api/usage',headers=self.headers).status_code,429)
