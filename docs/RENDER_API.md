# Backend BRIIFF AI no Render

O site principal continua como **Static Site** e mantém seu endereço. A IA precisa
de um **Web Service separado**, plano **Free**, com Python/Flask/Gunicorn. Não
converta o site existente nem habilite Firebase Blaze, Cloud Run ou banco Render.
O Firestore existente guarda conversas e cotas; não há SQLite ou disco persistente.

## Configuração preparada

- Blueprint separado: `render-api.yaml` (o `render.yaml` do site foi preservado).
- Runtime Python 3.14.10, conforme versão suportada no Render em 05/11/2026.
- Build: `pip install -r requirements-production.txt`.
- Start: `gunicorn -c gunicorn.conf.py 'backend.web:create_app()'`.
- Porta: variável `PORT`; bind em `0.0.0.0`.
- Health check: `/healthz`.
- Plano obrigatório: **Free**. Não escolher Starter ou habilitar faturamento.
- Branch da API durante preparação: `feat/briiff-ai`.

O serviço recusa inicializar sem `BRIIFF_ENV=production`, projeto `briif-site`,
credencial de conta de serviço desse mesmo projeto, chave Gemini e origens HTTPS
explícitas. Nunca utiliza a sessão pessoal do Firebase CLI na hospedagem.

## Segredos

`FIREBASE_ADMIN_JSON`: JSON privado da conta de serviço dedicada, com permissões
para acessar Firestore e consultar usuários Firebase. Não usar credencial do
projeto de testes, nem dar papel Owner/Editor ao serviço.

`GEMINI_API_KEY`: chave restrita a `generativelanguage.googleapis.com`, com projeto
Google sem faturamento e cotas gratuitas verificadas. É independente do projeto
Firebase que autentica alunos.

Ambos devem ser configurados diretamente no ambiente protegido do Web Service.
Alternativamente, Render Secret Files monta `firebase-admin.json` e `gemini.key`
em `/etc/secrets`; use `FIREBASE_ADMIN_JSON_FILE` e `GEMINI_API_KEY_FILE` para
referenciar esses arquivos sem incluir segredos nos argumentos do terminal.
Não colocar em arquivos públicos, commits, variáveis do Static Site, screenshots
ou logs. Configurações não secretas estão em `docs/render-api.env.example`.

## Integração com o site principal

Após criar e validar a API, preencher `apiBase` em `assets/js/ai-config.js` com o
endereço HTTPS real do Web Service. Esse endereço é público; não é uma chave.
O frontend confere se o projectId informado pela API coincide com seu Firebase.
A chave pública Firebase original e as contas existentes são preservadas.

O servidor local injeta `apiBase: ''`, de forma que testes locais continuem
isolados do backend principal. O serviço público só permite origens listadas em
`BRIIFF_ALLOWED_ORIGINS` e exige ID token Firebase em todas as rotas privadas.
Headers de preflight permitem Authorization, Content-Type e X-Firebase-AppCheck.
Não usa cookies de sessão ou CORS curinga.

A API repete os limites/validações já existentes e compartilha as mesmas
transações Firestore: 20 mensagens/UID e 200 globais no dia de Brasília, além dos
orçamentos de requisições/tokens e da cota do provedor. Conta precisa ter e-mail
verificado. Erros externos não expõem detalhes ou segredos e não estornam reservas.
App Check é ativado se `FIREBASE_APP_CHECK_SITE_KEY` estiver configurado.

## Limitações gratuitas e validação

Render Free pausa após 15 minutos sem tráfego; voltar pode levar cerca de um
minuto. As horas gratuitas são compartilhadas no workspace. Filesystem é efêmero;
por isso todos os dados e locks são persistidos no Firestore. O plano Free pode
ficar suspenso se cotas de hospedagem forem atingidas. Não há garantia de
continuidade ou de cota permanente do Gemini.

Fontes: [Render Free](https://render.com/docs/free),
[Web Services](https://render.com/docs/web-services),
[Python](https://render.com/docs/python-version).

Testes de runtime/WSGI cobrem configuração explícita, rejeição de credencial/projeto
incompatível, limites conservadores, CORS, token obrigatório, UID derivado do token,
validação antes de reservar, conclusão após erro 429, proteção de arquivos, tamanho
de corpo, limite de leitura e tratamento de erro sem vazamento. Esses testes usam
service mock e não comprovam deploy ou acesso aos segredos da hospedagem.

A publicação só está concluída após a URL real responder health/status e o fluxo
com uma conta autorizada confirmar autenticação, geração e histórico. A existência
do código ou uma main atualizada não comprovam que o backend está hospedado.

## Implantação validada em 05/11/2026

API: **https://briiff-ai-api.onrender.com**; plano confirmado **Free**.
Serviço `briiff-ai-api`, região Oregon, com arquivos secretos montados em
`/etc/secrets/firebase-admin.json` e `/etc/secrets/gemini.key`. A conta de serviço
dedicada usa Datastore User e Firebase Auth Viewer; não tem papel Owner/Editor.
Firebase principal `briif-site` permanece sem faturamento habilitado.

Testes na URL pública passaram: health/status, CORS para o site principal,
HTTP 401 sem token, HTTP 403 para conta não verificada, resposta real Gemini,
histórico persistido, contador reduzido, isolamento entre duas contas e exclusão
sem zerar a cota. As duas contas fictícias de implantação e seus dados foram
removidos; nenhum aluno existente foi alterado. Reservas de cota foram mantidas.

O frontend usa o endereço público acima; a configuração Firebase Web original
foi preservada para usar as contas já existentes. O despertar do serviço gratuito
é tratado com tentativas limitadas apenas de status, sem repetir envios à IA.

As cotas gratuitas de Gemini são compartilhadas com o ambiente de desenvolvimento.
O backend público reserva até 400 requisições/dia, 10/min e 200.000 tokens/min;
o ambiente local será limitado a 40/dia, 2/min e 40.000 tokens/min, para manter
o total abaixo das cotas verificadas de 500/dia, 15/min e 250.000 tokens/min.
Esses orçamentos não substituem os limites BRIIFF de 20 por aluno/200 globais
no dia de Brasília. Outras chamadas externas à mesma chave podem consumir a cota.

Render Free compartilha 750 horas mensais entre os Web Services do workspace.
Nenhum outro serviço foi alterado. O serviço pode pausar por inatividade ou
esgotamento da cota; não foi configurado upgrade automático nem serviço pago.
