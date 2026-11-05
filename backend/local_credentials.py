"""Local developer credentials from Firebase CLI; no service account key generated."""
import json
from pathlib import Path
from firebase_admin import credentials
from google.oauth2.credentials import Credentials

# Public OAuth client identifiers shipped by Firebase CLI (native installed app).

def firebase_cli_credential(project):
    if not project.endswith(('-test','-dev','-sandbox')) or project=='briif-site':
        raise ValueError('Credencial local permitida somente no projeto de testes.')
    path=Path.home()/'.config/configstore/firebase-tools.json'
    info=json.loads(path.read_text())
    refresh=info.get('tokens',{}).get('refresh_token')
    if not refresh:
        raise ValueError('Conecte o Firebase CLI primeiro.')
    client_path = Path(__file__).resolve().parent.parent / '.local/firebase-cli-oauth-client.json'
    client = json.loads(client_path.read_text())
    google_credential = Credentials.from_authorized_user_info(
        {'type':'authorized_user','client_id':client['client_id'],'client_secret':client['client_secret'],
         'refresh_token':refresh,'quota_project_id':project},
        scopes=['https://www.googleapis.com/auth/cloud-platform'])
    class LocalCredential(credentials.Base):
        def get_credential(self):
            return google_credential
    return LocalCredential()
