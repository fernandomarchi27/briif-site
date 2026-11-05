# BRIIFF AI — versão local

## Estado atual

- Cópia local: `/home/fernandom/briiff-ai-local`; branch `feat/briiff-ai`.
- Origem: `fernandomarchi27/briif-site`, main obtida por arquivo HTTPS em 05/11/2026.
  Git inicializado com base local do site original; nenhum remoto configurado.
- Site: **http://127.0.0.1:8765/**; chat: **/ai.html**.
- Balão flutuante nas páginas, acima da navegação móvel; abre o chat.
- Firebase separado: **briiff-ai-fernando-test**, sem faturamento vinculado na
  verificação realizada. O Firebase publicado **briif-site** não foi alterado.
- App Web e Firestore Standard `(default)` em `southamerica-east1`, sem PITR ou
  recursos pagos. Regras aplicadas somente ao projeto de testes.
- Authentication padrão `FIREBASE_AUTH`: e-mail/senha habilitado; localhost e
  127.0.0.1 autorizados. Google aguarda cliente OAuth/ativação no console.
- Gemini configurado com chave restrita a `generativelanguage.googleapis.com` e
  guardada somente em `.local/gemini.key` com permissão 600.
- Modelo selecionado: **gemini-3.1-flash-lite**, raciocínio interno minimal,
  resposta de até 1.024 tokens. Gemini 3.5 Flash-Lite apresentou falhas HTTP 503
  e foi substituído. Também houve timeout em teste: a disponibilidade do serviço
  gratuito não é garantida e erros são exibidos sem respostas inventadas.
- Nenhum push, PR, deploy de site, alteração de dados reais ou busca de Flutter.

`/api/status` indica se o backend está **configurado**, não garante disponibilidade
instantânea do provedor. Google, App Check e entrega real de e-mails possuem
validações pendentes descritas abaixo.

## Iniciar, parar e dependências

```sh
cd /home/fernandom/briiff-ai-local
./start-local.sh
```

Abra http://127.0.0.1:8765/ai.html. Ctrl+C encerra quando iniciado pelo terminal.
O servidor só escuta em loopback. Quando iniciado pelo assistente, o log está em
`.local/server.log`. Não use esse servidor HTTP embutido para exposição pública.

Dependências já instaladas:

- Python virtualenv `.venv`, Firebase Admin SDK 7.7.0 e dependências travadas.
- Firebase CLI standalone 15.35.0 em `.local/tools/firebase`.
- Temurin JRE 21.0.13 em `.local/tools/java21`; Java do sistema foi preservado.
- SDK Firebase compat 10.14.1, KaTeX 0.16.22 e fontes servidos localmente.
- Site estático HTML/CSS/JavaScript, sem etapa de build web.

Para reinstalar Python:

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements.lock.txt
```

Para os testes JavaScript em QuickJS, instale `requirements-dev.txt`. Os testes
reais de navegador usam Playwright com o Chrome já instalado no computador.

## Configuração privada local

`.local/config.json` contém a configuração pública Web do Firebase de testes,
`useFirebaseCliCredentials: true`, caminho da chave Gemini, modelo e orçamentos.
O diretório é ignorado pelo Git. O servidor **não serve** esse diretório, backend,
Git, logs ou credenciais. O SDK Web recebe apenas configuração pública Firebase,
nunca a chave Gemini ou token administrativo.

O backend usa a sessão OAuth salva pelo Firebase CLI e solicita somente o escopo
cloud-platform registrado para esse cliente. Identificadores do cliente OAuth nativo ficam em `.local/firebase-cli-oauth-client.json`, não no código publicado. Não exporta o refresh token nem gera
chave permanente de conta de serviço. Essa opção é exclusiva de desenvolvimento
local e herda os poderes da conta autenticada. `briif-site` é recusado e o ID deve
terminar em `-test`, `-dev` ou `-sandbox`. Tokens Firebase enviados por clientes são
verificados contra o projeto configurado.

Também existe suporte a `credentialFile` de conta de serviço, se necessário no
futuro, validando o project_id antes de inicializar. Não inclua segredos em assets,
não envie pela conversa e não adicione ao Git. `docs/config.example.json` contém
somente exemplo sem segredos.

A configuração original do Firebase publicado está desativada nesta cópia. Ao
servir apenas arquivos estáticos, o site fica em demonstração e a IA não funciona.
Use `start-local.sh` para injetar a configuração de testes com segurança.

## Gratuidade e cotas

Fontes consultadas em 05/11/2026:

- [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing): entrada e saída
  Standard de Gemini 3.1 Flash-Lite têm Free Tier. Não se usa grounding, busca,
  cache pago, imagem, áudio ou ferramenta adicional.
- [Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits): cotas por projeto
  e modelo. RPD renova no horário do Pacífico. Métricas efetivas consultadas via
  Service Usage para este modelo: **500 RPD, 15 RPM, 250.000 tokens de entrada/min**.
- Proteções locais: **400 RPD, 10 RPM, 200.000 TPM**, orçamento próprio de
  **4.000.000 tokens/dia**, além de **20 mensagens por UID e 200 globais/dia**.
  Os dois últimos renovam à meia-noite de Brasília. RPM/TPM usam janela móvel
  compartilhada de 60 segundos. Orçamentos de provedor usam o dia do Pacífico.
- O limite de 400/dia permite margem abaixo da cota 500 quando duas janelas de
  Brasília se sobrepõem ao mesmo dia do Pacífico. O contador do provedor continua
  conservador mesmo se o modelo for trocado.
- [Firestore gratuito](https://firebase.google.com/docs/firestore/pricing): 1 GiB,
  50 mil leituras/dia, 20 mil escritas/dia e 20 mil exclusões/dia, sujeito às
  condições vigentes. Quotas renovam pelo Pacífico, não por Brasília.
- [Firebase plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans):
  Auth e Firestore usados em Spark; não foram implantadas Cloud Functions ou
  Cloud Run. Tentativa de inicializar Identity Platform por API exigiu billing
  e foi interrompida; o usuário ativou Firebase Auth padrão no console gratuito.
- [Termos Gemini](https://ai.google.dev/gemini-api/terms): no Free Tier, conteúdo
  pode ser usado para melhoria dos produtos. A interface avisa para não enviar
  dados pessoais. Avaliar privacidade antes de usar com alunos reais.

Cada envio aceito reserva cotas **antes** de chamar a IA. Falhas e timeouts não
estornam reserva, pois o provedor pode ter consumido a chamada. Não há retry
invisível. IDs de requisição evitam repetir a mesma tentativa no mesmo dia/UID.
Erro 429 suspende o provedor por uma hora. Outras falhas mostram erro seguro.

O orçamento de tokens usa bytes UTF-8 da pergunta/contexto/prompt, margem e teto
de saída: estimativa intencionalmente conservadora. Pergunta tem no máximo 2.000
caracteres; contexto enviado tem até 12 mensagens e 8.000 bytes, mais a pergunta.
Até 30 conversas por conta e 30 respostas por conversa limitam armazenamento.
Contadores antigos não usam TTL pago; monitorar armazenamento e limpar apenas
janelas antigas em manutenção futura, sem apagar contadores ativos.

Não se pode garantir cota se o provedor mudar limites ou outras aplicações usarem
a mesma chave/projeto. Mantenha o projeto sem billing e revise os painéis.

## Arquitetura e segurança

HTML/JS → Firebase Auth ID token → backend Python → Firestore + Gemini.

| Rota | Método | Finalidade |
|---|---|---|
| `/api/status` | GET | Estado de configuração, sem segredo |
| `/api/usage` | GET | Cotas do UID autenticado |
| `/api/conversations` | GET | Até 30 conversas do aluno |
| `/api/conversations/{id}` | GET | Histórico de uma conversa |
| `/api/messages` | POST | `{text, conversationId, requestId, level}` |
| `/api/conversations/{id}` | DELETE | Excluir uma conversa |
| `/api/conversations` | DELETE | Excluir histórico, até 100 por chamada |

Rotas privadas exigem `Authorization: Bearer <Firebase ID token>`. Backend verifica
assinatura, audiência/projeto, revogação, usuário desabilitado e e-mail verificado.
Recusa anônimos, desenvolvedor e demonstração. Nunca aceita UID do corpo.

Coleções: `aiUsers/{uid}/conversations/{id}`, metadados `aiUsers/{uid}` e cotas
`aiUsage/{id}`. Clientes não têm acesso direto a essas coleções. Todas as leituras
e escritas de IA usam backend autenticado; Admin SDK exige isolamento explícito
pelo UID, já aplicado nos caminhos. Regras anteriores de progresso/ranking foram
preservadas em `firestore-ai-test.rules`; arquivo original `firestore.rules` intacto.

Transações fazem reserva de orçamento, gravação de respostas e exclusão. Lock por
UID impede duas gerações simultâneas, inclusive na virada do dia. Exclusão durante
geração é recusada para impedir que uma resposta restaure histórico excluído.
Apagar histórico não zera cotas. Contexto é lido do banco, não aceito do navegador.
Leituras/requisições são limitadas a 30/min por UID/processo e 12 simultâneas; cotas
de mensagem/tokens são compartilhadas por transação entre processos/plataformas.

Conteúdo é inserido como texto. KaTeX usa `trust:false`. Origem/Host são restritos
a localhost. Nenhuma mensagem, e-mail ou token é registrado no log; somente tipo
de falha/status HTTP do provedor para diagnóstico.

App Check permanece opcional no teste local. Para ativar: cadastre o app Web em
Firebase App Check, configure reCAPTCHA/domínios e preencha `appCheckSiteKey` no
JSON local. O cliente enviará `X-Firebase-AppCheck`, e o backend exigirá atestação.
Esse caminho foi testado com mocks; atestação real ainda não foi configurada.

## Login Google e e-mails

E-mail/senha aceita endereços válidos de qualquer provedor. Cadastro envia link
de verificação; a IA exige confirmação. Recuperação de senha está na tela de
login. Link Google usa `linkWithPopup` na conta já autenticada: não existe fusão
automática por endereço de e-mail. Credenciais já vinculadas a outra conta são
recusadas.

Para Google, no console **do projeto de testes**: Authentication → Método de
login → Adicionar provedor → Google → ativar, escolher e-mail de suporte e salvar.
O console precisa provisionar o cliente OAuth. Isso não habilita faturamento.
Depois, validar popup Google com a conta do usuário; o assistente não pode fazer
login no Google em nome dele ou declarar sucesso sem testar.

## Integração futura com Android

A API usa JSON e Firebase ID token, independente de Web/Flutter. O aplicativo
futuro usará o mesmo projeto, contas, endpoints e coleções. Sincronização ocorre
na abertura e ao retornar à aba, sem polling contínuo. Para acessar de Android ou
site público será necessário definir hospedagem HTTPS e autorizar publicação.
Nenhuma parte do aplicativo Android foi criada ou alterada.

## Validação

```sh
.venv/bin/python -m unittest discover -s tests -v
```

30 testes unitários passaram: políticas, limites, concorrência simulada, contexto,
histórico/isolamento/exclusão, replay, tokens, 429, Auth/App Check simulados,
proteção de arquivos/origem, escopo OAuth, sintaxe JS e KaTeX em QuickJS. Três
testes adicionais são ignorados sem emulador e foram executados separadamente
contra Firestore Emulator real: histórico/isolamento/exclusão, limite individual
e concorrência de 8 requisições pela última vaga global (somente uma aceita).

```sh
.local/tools/java21/bin/java -jar .local/firestore-emulator.jar --host 127.0.0.1 --port 8781 --rules firestore-ai-test.rules
FIRESTORE_EMULATOR_HOST=127.0.0.1:8781 .venv/bin/python -m unittest discover -s tests -p test_firestore_integration.py -v
```

Chrome/Playwright reais validaram desktop 1440×1000 e celular 390×844: sem overflow,
sem erro JavaScript, sugestões preenchem campo, fórmulas renderizam no DOM e balão
abre chat sem cobrir a navegação. Capturas em `.local`.

Fluxo real com conta descartável **somente no Firebase de testes**: senha aceitou
login; conta não verificada recebeu 403 no backend; após verificação administrativa
da fixture, interface recebeu resposta Gemini para `2x+3=11`, com solução x=4;
histórico salvo e contador 20→19. Fixtures, progresso, ranking e histórico foram
removidos após os testes. Reservas consumidas foram mantidas nas cotas. Esse teste
não comprova entrega de e-mail ou clique humano de verificação.

Validações pendentes: popup Google, entrega/recuperação de e-mail real, App Check
real, acessibilidade mais ampla, outro dispositivo e estabilidade prolongada do
provedor. Testes de limite do provedor usam orçamento simulado; não se esgotou
intencionalmente toda a cota gratuita. Falhas 503 e timeout reais foram observadas
e tratadas sem resposta inventada ou bypass das reservas.

Conferência final real concluída com Gemini 3.1 Flash-Lite/minimal: histórico e
cota 19/20 foram recuperados em segunda aba autenticada. A tentativa de acessar
aiUsers diretamente pela API Firestore com Firebase ID token foi recusada com
403. Fluxo completo passou; captura `.local/live-ai-authenticated.png`.

## Correções de interface e confirmação obrigatória

O chat ocupa a altura disponível da tela: só a área de mensagens rola, enquanto
o compositor permanece na base. No celular/tablet, o histórico abre pelo botão
Conversas e a navegação inferior não cobre o envio. Lixeira em SVG com alvo de
42×42 px, texto de conversa truncado e rótulo acessível. A exclusão pede confirmação.

Contas Firebase não verificadas agora vão obrigatoriamente para
`verificar-email.html`, inclusive no login e no acesso direto às trilhas/chat.
A tela mostra o endereço, instruções, reenvio com intervalo de 60 segundos,
verificação do estado real no Firebase e opção de sair. Confirmar é necessário
para continuar; botão ou localStorage não alteram emailVerified. Convidados nas
funcionalidades anteriores foram preservados; IA continua exigindo conta verificada.

Chrome real validou login/redirect/bloqueio, liberação após verificar a fixture,
lixeira e campo fixo em 1440×900, 800×900, 390×844 e 390×500. Validou cancelar e
confirmar exclusão, preservação da outra conversa/cota e ausência de erros JS.
O teste não consumiu Gemini. Fixture e dados temporários foram removidos.
Regressão reproduzível (somente com projeto de testes configurado e servidor local):

```sh
.venv/bin/pip install -r requirements-browser.txt
.venv/bin/python tests/browser_chat_fixes.py
```

## Publicação do código

A versão para GitHub é preparada sobre o histórico real de
`fernandomarchi27/briif-site`, em branch separada. A configuração Firebase pública
original é preservada nessa cópia; o servidor local continua injetando o Firebase
de testes. `.local`, credenciais, chave Gemini, logs, caches e ambientes virtuais
não fazem parte do envio. O site institucional continua estático: para disponibilizar
a IA publicamente será necessário hospedar o backend seguro e configurar sua URL.
Enviar a branch não equivale a publicar esse serviço; a main não deve receber
esta integração supondo que o backend local estará disponível na hospedagem estática.
