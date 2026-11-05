import json,unittest
from unittest.mock import patch
from backend.local_credentials import firebase_cli_credential

class LocalCredentialsTests(unittest.TestCase):
    def test_cli_uses_registered_scope_only(self):
        with patch('backend.local_credentials.Path.read_text',side_effect=[json.dumps({'tokens':{'refresh_token':'test-placeholder'}}),json.dumps({'client_id':'test-native-client','client_secret':'test-public-native-secret'})]):
            credential=firebase_cli_credential('briiff-ai-fernando-test').get_credential()
        self.assertEqual(credential.scopes,['https://www.googleapis.com/auth/cloud-platform'])
        self.assertEqual(credential.quota_project_id,'briiff-ai-fernando-test')
    def test_production_not_allowed(self):
        with self.assertRaises(ValueError):firebase_cli_credential('briif-site')
