"""Run explicitly against the local server and an isolated configured test project."""
import sys,secrets,time,json
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT))
from backend.server import Service,load_config
from firebase_admin import auth
from playwright.sync_api import sync_playwright
service=Service(load_config());assert service.config['firebase']['projectId'].endswith(('-test','-dev','-sandbox'))
uid='ui-fixes-'+secrets.token_hex(5);email=uid+'@example.invalid';password=secrets.token_urlsafe(20)
created=False
try:
 auth.create_user(uid=uid,email=email,password=password,email_verified=False,display_name='Teste Interface',app=service.app);created=True
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/google-chrome',headless=True,args=['--no-sandbox'])
  context=browser.new_context(viewport={'width':1440,'height':900})
  day=datetime.now(ZoneInfo('America/Sao_Paulo')).date().isoformat()
  context.add_init_script('localStorage.setItem('+json.dumps('briif:boasvindas:'+uid)+','+json.dumps(day)+')')
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:8765/login.html?next=ai.html',wait_until='domcontentloaded')
  page.locator('#email').fill(email);page.locator('#senha').fill(password);page.locator('#submit').click()
  page.wait_for_url('**/verificar-email.html?**',timeout=45000)
  page.locator('#verify-address').wait_for();assert page.locator('#verify-address').inner_text()==email
  page.locator('#verify-check').click();page.wait_for_function("document.querySelector('#verify-status').textContent.includes('ainda não')")
  for target in ['ai.html','trilhas.html']:
   page.goto('http://127.0.0.1:8765/'+target,wait_until='domcontentloaded')
   page.wait_for_url('**/verificar-email.html?**',timeout=45000)
  print('Verificação obrigatória: login, acesso direto ao chat e trilhas bloqueados até confirmar.',flush=True)
  # Only the test fixture is marked verified; no real user's verification is bypassed.
  page.wait_for_function("document.querySelector('#verify-status')?.textContent.includes('ainda não') && !document.querySelector('#verify-check').disabled")
  auth.update_user(uid,email_verified=True,app=service.app)
  page.locator('#verify-check').click();page.wait_for_url('**/trilhas.html',timeout=45000)
  db=service.store.db
  for cid,title in [('keep','Uma conversa com título longo para verificar que o botão da lixeira não desaparece nem invade o título '*2),('delete','Conversa para excluir')]:
   messages=[{'role':'user' if i%2==0 else 'model','text':('Passo de matemática. '*25)+str(i)} for i in range(24)]
   service.store.conversations(uid).document(cid).set({'title':title,'messages':messages,'updatedAt':time.time()})
  db.collection('aiUsers').document(uid).set({'conversationCount':2,'busyUntil':0})
  for width,height in [(1440,900),(800,900),(390,844),(390,500)]:
   page.set_viewport_size({'width':width,'height':height})
   page.goto('http://127.0.0.1:8765/ai.html',wait_until='domcontentloaded')
   page.wait_for_function("document.querySelectorAll('.ai-chat-row').length===2")
   if width<=860:page.locator('#history-toggle').click()
   row=page.locator('.ai-chat-row').filter(has=page.locator('.ai-open-chat[title^="Uma conversa"]'))
   delete=row.locator('.ai-delete-chat');svg=delete.locator('svg');assert svg.is_visible()
   title_rect=row.locator('.ai-open-chat').bounding_box();trash_rect=delete.bounding_box()
   assert trash_rect['width']>=40 and trash_rect['x']>=title_rect['x']+title_rect['width']
   row.locator('.ai-open-chat').click();page.wait_for_function("document.querySelectorAll('.ai-message').length===24")
   before=page.locator('#chat-form').bounding_box()
   page.locator('#messages').evaluate('(e)=>{e.scrollTop=0}')
   page.wait_for_timeout(100)
   page.locator('#messages').evaluate('(e)=>{e.scrollTop=e.scrollHeight}')
   after=page.locator('#chat-form').bounding_box()
   assert abs(before['y']-after['y'])<1
   assert after['y']>0 and after['y']+after['height']<=height
   if width<=860:assert after['y']+after['height']<=page.locator('#rail').bounding_box()['y']
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.screenshot(path=str(ROOT/f'.local/chat-fixes-{width}-{height}.png'))
   print(f'Layout {width}x{height}: lixeira acessível, campo fixo, navegação sem sobreposição.',flush=True)
  # A canceled confirmation must preserve data; then accept to delete only one chat.
  page.set_viewport_size({'width':1440,'height':900})
  page.once('dialog',lambda dialog:dialog.dismiss())
  page.get_by_role('button',name='Excluir conversa Conversa para excluir',exact=True).click()
  assert service.store.conversations(uid).document('delete').get().exists
  page.once('dialog',lambda dialog:dialog.accept())
  page.get_by_role('button',name='Excluir conversa Conversa para excluir',exact=True).click()
  page.wait_for_function("document.querySelectorAll('.ai-chat-row').length===1")
  assert not service.store.conversations(uid).document('delete').get().exists
  assert service.store.conversations(uid).document('keep').get().exists
  assert service.store.usage(uid)['individual']==20
  assert not errors,errors
  browser.close()
  print('Exclusão: exige confirmação, preserva a outra conversa e não altera a cota. Sem erros JS.',flush=True)
finally:
 if created:
  service.store.delete(uid)
  for collection in ['usuarios','ranking','aiUsers']:service.store.db.collection(collection).document(uid).delete()
  auth.delete_user(uid,app=service.app)
  print('Conta e dados temporários removidos.',flush=True)
