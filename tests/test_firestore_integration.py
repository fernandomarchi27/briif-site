"""Real Firestore emulator tests. Never contacts a cloud project."""
import os, unittest, uuid, time
from concurrent.futures import ThreadPoolExecutor
from backend.store import Store
from backend.core import APIError

@unittest.skipUnless(os.environ.get('FIRESTORE_EMULATOR_HOST')=='127.0.0.1:8781','Local emulator is not running')
class FirestoreIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from google.cloud.firestore import Client
        from google.auth.credentials import AnonymousCredentials
        cls.db=Client(project='demo-briiff-ai-'+uuid.uuid4().hex[:8],credentials=AnonymousCredentials())
        cls.store=Store(cls.db,{'rpd':200,'rpm':100,'tpm':10000000,'tpd':10000000})
    def send(self,uid,cid='chat'):
        c,contents,u,p=self.store.reserve(uid,cid,uuid.uuid4().hex,'Como resolver x+1=2?')
        self.store.finish(uid,cid,c,'Como resolver x+1=2?','Subtraia 1 dos dois lados.',u,p)
    def test_01_history_and_isolation(self):
        self.send('alice')
        self.assertEqual(len(self.store.get('alice','chat')['messages']),2)
        self.assertEqual(self.store.list('alice')[0]['id'],'chat')
        with self.assertRaises(APIError):self.store.get('bob','chat')
        self.assertEqual(self.store.delete('alice'),1)
        self.assertEqual(self.store.usage('alice')['individual'],19)
    def test_02_individual_limit(self):
        self.store.refs('limited',time.time())[0].set({'count':20})
        with self.assertRaises(APIError):self.send('limited')
    def test_03_concurrent_global_limit(self):
        ref=self.store.refs('any',time.time())[1];ref.set({'count':199})
        def send(i):
            try:self.send('parallel'+str(i));return True
            except APIError:return False
        with ThreadPoolExecutor(max_workers=8) as pool:results=list(pool.map(send,range(8)))
        self.assertEqual(sum(results),1)
        self.assertEqual(ref.get().to_dict()['count'],200)
