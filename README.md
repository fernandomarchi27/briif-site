# Briiff (site)

Site estático (HTML, CSS e JavaScript puro) com a mesma estética do app Flutter.
Não precisa de build nem de Node: basta publicar a pasta.

## Páginas
- `index.html`: o que é o Briiff (texto editável), trilhas, como funciona, equipe
- `trilhas.html`: caminho em zigue-zague por matéria, com XP, nível e ofensiva
- `licao.html?f=algebra_1`: aprender (passo a passo + exemplos), praticar e resultado
- `laboratorio.html`: calculadoras que mostram a conta (1º grau, Bhaskara, Pitágoras, estatística)
- `login.html`: Google, e-mail/senha e convidado

## Rodar local
    python3 -m http.server 8000     # abra http://localhost:8000

## Onde editar
- Texto da home: `index.html`, seção `#sobre`. Equipe: seção `#equipe`.
- Conteúdo das lições e exercícios: `assets/js/data.js` (gerado a partir do `trilhas_mock.dart`).
- Cores: variáveis no topo de `assets/css/style.css`.

## Publicar no Render (Static Site, grátis)
1. Crie um repositório no GitHub e envie esta pasta (o `index.html` deve ficar na raiz do repositório):
       git init
       git add .
       git commit -m "Site Briiff"
       git branch -M main
       git remote add origin https://github.com/SEU_USUARIO/briif-site.git
       git push -u origin main
2. Em https://dashboard.render.com: **New +** → **Static Site** → conecte o repositório.
3. Preencha: **Build Command** vazio (ou `echo ok`) e **Publish Directory** `.`
4. **Create Static Site**. Cada `git push` republica sozinho.

## Login com Google e banco de dados (Firebase do SITE, separado do app)
1. Acesse https://console.firebase.google.com → **Adicionar projeto** → nome `briif-site` (pode desativar o Google Analytics).
2. **Authentication** → Começar → aba **Método de login** → ative **Google** (escolha um e-mail de suporte), **E-mail/senha** e **Anônimo**.
3. Ainda em Authentication → **Configurações** → **Domínios autorizados** → adicione `SEU-SITE.onrender.com`.
4. **Firestore Database** → Criar banco de dados → modo produção → região `southamerica-east1` (São Paulo).
5. Firestore → aba **Regras** → cole o conteúdo do arquivo `firestore.rules` → Publicar.
6. Engrenagem → **Configurações do projeto** → **Seus apps** → ícone Web `</>` → registrar app → copie o objeto `firebaseConfig`
   e cole os valores em `assets/js/firebase-config.js`.
7. Envie para o GitHub (`git add . && git commit -m "Firebase" && git push`). O Render republica sozinho.

O que é salvo: `usuarios/{uid}` com nome, e-mail, foto, tipo de login, datas e o progresso (fases, XP, nível, moedas, ofensiva).
O progresso é mesclado entre o navegador e a nuvem, então continua igual em outro aparelho.

## Rascunho
Em cada exercício há um quadro para fazer as contas (pincel, borracha, cores, espessura, desfazer, limpar e tela cheia com o enunciado ao lado).
Código em `assets/js/rascunho.js`; estilo no final de `assets/css/style.css`.

## Modo noturno
Botão de lua/sol no header (`assets/js/app.js` desenha o botão, `assets/js/tema.js` guarda a escolha, cores em `assets/css/style.css`, bloco `MODO NOTURNO`).
Toda página precisa desta linha no `<head>`, logo abaixo do `theme-color`:
    <script src="assets/js/tema.js"></script>

## Texto no rascunho
Botão **Texto** na barra do rascunho: abre uma caixa para digitar (teclado do computador ou do celular).
Toque/clique em outro ponto do quadro para escrever em outro lugar. O texto pode ser desfeito e apagado com a borracha.

## Cores do site (botão de paleta, ao lado da lua)
Duas opções: **Padrão** (azul `#4A3AE3` e laranja `#FF6B4A`) e **Personalizada** (a pessoa escolhe a cor principal e a de destaque, ou usa uma sugestão).
Funciona nos temas claro e noturno; o contraste é ajustado automaticamente e a escolha fica salva no navegador.
- Lógica: `assets/js/tema.js` (cores) e `assets/js/app.js` (botão e painel).
- Estilo: variáveis `--indigo` e `--coral` em `assets/css/style.css`. Tudo que era azul/laranja usa essas variáveis.

## Trilha ENEM
Cinco fases com as 15 questões do simulado (3 por fase), cada uma com aula, exemplos resolvidos e explicação de cada resposta.
O conteúdo fica em `assets/js/data.js`, na trilha de id `enem` (fases `enem_1` a `enem_5`).

## Modo pixel art
Botão de controle de videogame no header, ao lado do botão de cores. Liga um visual retrô: fonte pixel (Pixelify Sans / Silkscreen, carregadas só quando o modo é ligado), bordas grossas com cantos "quebrados", ícones em pixel, favicon do π em pixel, e o logo "√Briiff" vira a marca em pixel BRIIFF (baseada na imagem enviada), com a animação de entrada π → BRIIFF na tela de login.
Funciona junto com o tema noturno e com as cores personalizadas.
- Lógica: `assets/js/tema.js` (liga/desliga e troca o favicon) e `assets/js/app.js` (ícones, logo e botão).
- Estilo: bloco `MODO PIXEL ART` no final de `assets/css/style.css`.
- Rascunho: no modo pixel, o pincel e a borracha desenham em blocos alinhados a uma grade, em vez de traço livre (`assets/js/rascunho.js`).

## Trilha Personalizada
Na tela de Trilhas, o aluno escolhe pelo menos 2 matérias (entre Álgebra, Geometria, Funções, Estatística e ENEM) e o site monta 5 fases misturando as questões dessas matérias entre si (cada fase mistura, não separa por matéria). É possível trocar as matérias depois, em "Editar matérias" — isso reinicia só o progresso dessa trilha.
Cada questão mostra uma etiqueta com a matéria de origem. Como a fase mistura assuntos, a aba "Aprender" não traz uma aula nova, só uma orientação.
Lógica em `assets/js/app.js` (busque por `Trilha Personalizada`); interface em `assets/js/trilhas.js`.

## Página de perfil
Acessível pelo menu do usuário (avatar → "Meu perfil") ou pelo link "Ver estatísticas completas" na tela de Trilhas.
Mostra nível, XP, moedas, ofensiva atual e recorde, o desempenho (fases concluídas e % de acerto) em cada trilha, e um calendário mensal com os dias em que a pessoa estudou.
Funciona também sem login (mostra o progresso salvo no navegador). Arquivos: `perfil.html` e `assets/js/perfil.js`.

## Cor da marca e nome "Briiff"
O azul da marca (`--indigo`) foi padronizado para `#4C3CAD`, a mesma cor de fundo do ícone π e da tela de abertura enviados como referência (antes o site usava um azul mais vivo, `#4A3AE3`). O nome do produto é **Briiff** (com dois F), em todo o site — inclusive no logo em pixel art, que reproduz "BRIIFF" a partir do spritesheet de referência.

## Fonte do modo pixel art
O modo pixel usa só a fonte **Pixelify Sans** (para títulos e para os textos de botões/rótulos). A fonte Silkscreen (pontilhada, mais difícil de ler em telas pequenas) foi removida — deixava o texto cansativo de ler.

## Sons
`assets/js/som.js` sintetiza todos os sons na hora (Web Audio, sem arquivos). Botão de alto-falante no header liga/desliga (guardado em `briif:som`).
Uso: `BriifSom.tocar('acerto')`. Sons: `acerto`, `erro`, `avancar`, `passo`, `concluir`, `perfeito`, `nivel`, `moeda`, `compra`, `negado`, `ofensivaInicio`, `ofensivaAtualiza`, `ligar`, `tema`, `calcular`.
Onde tocam: lição e quiz do onboarding (acerto/erro/avançar/resultado), exemplos (passo), loja (compra/sem saldo/código), laboratório (calcular), trilhas (fase bloqueada), troca de tema e modo pixel.

## Celebração da ofensiva
`assets/js/celebracao.js` + bloco "Celebração da ofensiva" no fim do `style.css`. Ao concluir a primeira fase do dia (ofensiva começa ou aumenta), aparece uma tela cheia com a chama animada, faíscas, contador e a semana; o botão "Continuar" libera após ~2,7 s e o resultado aparece por baixo.

## Ranking
Página `ranking.html` (`assets/js/ranking.js`). Três categorias: **XP** (total acumulado), **Acertos** (% de acertos em todas as questões; só entra quem respondeu ao menos 10) e **Ofensiva** (maior ofensiva já feita).
Os dados ficam na coleção `ranking/{uid}` do Firestore, gravada automaticamente a cada sincronização (`publicarRanking` em `app.js`). Só vai o que é público: nome abreviado ("Maria S."), avatar da loja, nível, XP, acertos e ofensiva. E-mail e foto do Google não vão. Convidados não entram.
**Importante:** depois de atualizar o site, republique o `firestore.rules` no Firebase (aba Regras), senão o ranking dá erro de permissão.
Contas antigas aparecem no ranking assim que abrirem o site uma vez (a gravação acontece ao sincronizar).
Cada pessoa pode sair/voltar ao ranking pelo link no fim da página (a escolha vale em todos os aparelhos).

## Ícones de marca e loja
Moeda, fogo e cadeado do bloqueio de ofensiva vêm de `assets/img/moeda.png`, `fogo.png` e `bloqueio.png` (fundo transparente, 256px). Em `app.js`: `ICONS.coin`, `ICONS.flame` e `ICONS.bloqueio` (o cadeado simples `ICONS.lock` continua nas fases bloqueadas). No modo pixel art entram versões pixel tingidas com as mesmas cores.
A loja (`loja.js` + bloco "Loja (redesenhada)" no `style.css`) tem carteira no topo, produto em destaque e vitrine de avatares. Para trocar uma imagem, substitua o PNG mantendo o nome.
