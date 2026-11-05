> **BRIIFF AI:** implementação web com backend seguro local, Firebase de testes,
> Gemini, histórico e cotas compartilhadas. Veja [configuração e testes](docs/BRIIFF_AI.md).
> A IA exige backend; apenas publicar estes arquivos em hospedagem estática não
> disponibiliza o chatbot. Credenciais e chaves não estão neste repositório.

# Briiff (site)

Site estático (HTML, CSS e JavaScript puro). Será a referência de telas e regras para o futuro app em Flutter.
Não precisa de build nem de Node: basta publicar a pasta.

## Páginas
- `index.html`: o que é o Briiff, trilhas, como funciona, equipe
- `login.html`: Google, e-mail/senha e convidado · `onboarding.html`: tutorial + quiz para contas novas
- `trilhas.html`: caminho em zigue-zague por matéria (4 matérias + ENEM + Personalizada)
- `licao.html?f=algebra_1`: aprender (passo a passo + exemplos), praticar e resultado
- `boss.html?t=algebra`: batalha final contra o Mago Roxo (libera ao concluir todas as fases da trilha)
- `laboratorio.html`: calculadoras que mostram a conta
- `ranking.html`, `loja.html`, `perfil.html`

Veja `docs/ARQUITETURA.md` para a visão geral do código, dos dados e dos fluxos.

## Animações de abertura (v26)
- **Boas-vindas**: na 1ª abertura de cada dia (conta logada), com saudação e ofensiva/bloqueios/MathCoins. Fecha sozinha em ~3 s ou ao tocar.
- **Bloqueio de ofensiva usado**: se a pessoa faltou e um bloqueio salvou a ofensiva, a chama esfria, o cadeado cai e ela volta a brilhar, com som e a semana mostrando o dia protegido.
- Código em `assets/js/celebracao.js` (`BriifCelebracao.boasVindas` / `.bloqueio`), sons em `som.js`, estilos no fim da seção "Animações de abertura" de `style.css`.

## Rodar local
    python3 -m http.server 8000     # abra http://localhost:8000

## Onde editar
- Texto da home: `index.html`, seção `#sobre`. Equipe: seção `#equipe` (4 integrantes). Instalar o app: seção `#app` (os botões abrem um aviso "em desenvolvimento", lógica no fim de `assets/js/home.js`; quando o app sair, troque o `href` dos botões `data-instalar` pelos links reais).
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

## Modo pixel art (descontinuado na v27)
> Desde a v27 não existe mais o botão de modo pixel/cores: o visual pixel art é permanente (`data-pixel` sempre ligado em `tema.js`) e só o claro/escuro alterna. Veja "Identidade medieval (v27)" abaixo. O texto a seguir fica como histórico.

Botão de controle de videogame no header, ao lado do botão de cores. Liga um visual retrô: fonte pixel (Pixelify Sans / Silkscreen, carregadas só quando o modo é ligado), bordas grossas com cantos "quebrados", ícones em pixel, favicon do π em pixel, e o logo "√Briiff" vira a marca em pixel BRIIFF (baseada na imagem enviada), com a animação de entrada π → BRIIFF na tela de login.
Funciona junto com o tema noturno e com as cores personalizadas.
- Lógica: `assets/js/tema.js` (liga/desliga e troca o favicon) e `assets/js/app.js` (ícones, logo e botão).
- Estilo: bloco `MODO PIXEL ART` no final de `assets/css/style.css`.
- Rascunho: no modo pixel, o pincel e a borracha desenham em blocos alinhados a uma grade, em vez de traço livre (`assets/js/rascunho.js`).

## Trilha Personalizada
Na tela de Trilhas, o aluno escolhe pelo menos 2 matérias (entre Álgebra, Geometria, Funções, Estatística e ENEM) e o site monta até 10 fases de 5 questões misturando as questões dessas matérias entre si (cada fase mistura, não separa por matéria). É possível trocar as matérias depois, em "Editar matérias" — isso reinicia só o progresso dessa trilha.
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
Moeda, fogo e cadeado do bloqueio de ofensiva vêm de `assets/img/moeda.svg`, `fogo.svg` e `bloqueio.svg` (vetores). Em `app.js`: `ICONS.coin`, `ICONS.flame` e `ICONS.bloqueio` (o cadeado simples `ICONS.lock` continua nas fases bloqueadas). No modo pixel art entram versões pixel tingidas com as mesmas cores.
A loja (`loja.js` + bloco "Loja (redesenhada)" no `style.css`) tem carteira no topo, produto em destaque e vitrine de avatares. Para trocar uma imagem, substitua o PNG mantendo o nome.

## Visual suave, logo e menu do celular
`assets/css/suave.css` (depois do `style.css`) deixa o site tecnológico porém acolhedor: tons quentes, cantos redondos, sombras suaves, todo o texto em Inter (`assets/fonts/`, licença OFL). Não vale para o modo pixel art.
Voltar ao visual anterior: apague a linha `<link rel="stylesheet" href="assets/css/suave.css">` dos `.html` (pacote anterior: `briiff-site-v20.zip`).
Logo nova (selo com π + "briiff"): `wordmark()` em `app.js`, `index.html`, `login.html` e `favicon.svg`; o modo pixel mantém o logo pixel.
No celular (até 760px) os botões de cor, noturno, pixel e som ficam no menu de 3 pontinhos; ofensiva e MathCoins ficam em destaque no header e "Meu perfil" vai para o menu ☰.

## Batalha final (boss)
Depois da última fase de cada trilha (incluindo ENEM e Personalizada) aparece a **Batalha final** contra o Mago Roxo (`boss.html`, `assets/js/boss.js`).
- Libera quando todas as fases da trilha estão concluídas.
- 3 vidas; errar ou estourar o tempo (30/40/50 s por pergunta, conforme a dificuldade) custa uma vida; 6 acertos derrotam o boss.
- As perguntas vêm de todas as fases da trilha.
- Na tela cheia do rascunho, o boss e o cronômetro ficam no topo junto da pergunta.
- 1ª vitória: +60 XP, +50 MathCoins e +1 bloqueio de ofensiva. Revanches não dão recompensa, mas contam como dia de estudo.
- Ajustes em `BOSS` no `assets/js/app.js`. As vitórias ficam em `bosses` no progresso (sincronizado na nuvem).

## Regras do Firestore (v26)
O `firestore.rules` foi endurecido (campos permitidos no ranking, `atualizadoEm == request.time`, limites em `usuarios`).
Depois de publicar, teste: entrar, concluir uma fase e abrir o Ranking. Se algo falhar, o site continua funcionando (o erro só aparece no console) e dá para voltar às regras anteriores no console do Firebase.

## Regras das fases

- Cada fase tem **5 exercícios** do mesmo tema (ENEM também, com 8 fases como as outras trilhas).
- Para concluir a fase é preciso **acertar pelo menos 3**. Com 0 a 2 acertos a fase não é concluída, não dá XP nem MathCoins e **não conta a ofensiva do dia**: o aluno tenta de novo.
- No fim da fase (passando ou não) há uma **revisão opcional** dos exercícios errados, com explicação detalhada (campo `detalhe` de cada exercício em `assets/js/data.js`). A revisão não altera XP nem ofensiva.

## Avatar personalizável e perfil público

- `avatar.html` é o editor: pele, cabelo (estilo e cor), olhos, sobrancelhas, boca, detalhes, barba, roupa, óculos, chapéus e fundo. Peças com preço `> 0` custam MathCoins e são compradas ao salvar; as que a pessoa já comprou ficam dela.
- O catálogo é gerado por `build/avatar_gen.py` (fora deste repositório) e vive em `assets/js/avatar.js`; o app Flutter usa o mesmo catálogo em `assets/data/avatar_pecas.json`.
- No Firestore, `usuarios/{uid}.progresso` guarda `avatarCfg`, `avatarCfgTs` e `avatarPecas`. O personagem ativo também vai em `ranking/{uid}.avatarCfg` para os outros o verem.
- **Importante:** republique o `firestore.rules` no console do Firebase (campo novo `avatarCfg` no ranking). Sem isso o ranking continua funcionando, mas sem mostrar o personagem montado.
- Clicar numa linha do ranking abre `perfil.html?u=<uid>` com os dados públicos daquela pessoa.


## Identidade medieval (v27)
Um único visual de jogo medieval/fantasia (pixel art discreto) com dois temas, **escuro (padrão)** e **claro (pergaminho)**.
- **Cores e fundo**: `assets/css/dungeon.css` (carregado depois de `suave.css`). Variáveis dos dois temas no topo; fundo de tijolos em CSS (SVG inline, sem imagem pesada) e brilho arcano. Escuro: `#171329` / painéis `#211B38` / elevado `#2B2347` / lilás `#C5B8FF`.
- **Tema**: `tema.js` liga o pixel art sempre e alterna só claro/escuro (padrão escuro; cores personalizadas desativadas). O botão de tema fica no menu ⋮.
- **Fórmulas flutuantes**: `assets/js/fundo.js` (6–16 símbolos, só `transform`, pausa com a aba oculta, parado com "reduzir movimento"). Carregado por `tema.js` junto com `menu.js`.
- **Logo π**: `assets/img/pi.png` (branco) e `pi-roxo.png` (transparentes, reconstruídos pixel a pixel da logo `pi_1020.png`, sem fundo), `pi.svg` e `favicon.svg`. Classe `.pi-logo`.
- **Menu lateral**: `assets/js/menu.js` + bloco "Menu lateral" do `dungeon.css`. Ícones 12×12 pixelados (vazado → preenchido no hover/foco/ativo); o nome é uma etiqueta flutuante (nada se desloca). No celular vira barra inferior com nomes sempre visíveis.
- **Grimório**: `assets/js/grimorio.js` (livro por cima do site). Monta os capítulos com o conteúdo que já existe em `data.js` (lição + aula: passo a passo, exemplos resolvidos, erro comum, dica ENEM) e liga cada capítulo à prática da fase. Carregado só ao abrir.
- **Moedas e Combustível**: o texto "MathCoins" virou **Moedas** e "bloqueio de ofensiva" virou **Combustível** (só rótulos; os campos `moedas`, `bloqueios`, `bloqueiosGanhos`… e as regras continuam iguais). Ícones pixel: moeda sem letra, carvão (`PX.carvao`), fogo aceso/apagado (`PX.flame` / `PX.fogoApagado`).

## Batalha final integrada (v27)
`boss.html` agora usa a arena do protótipo: `assets/js/bossfight.js` (canvas: mago, chefe "Os Desenvolvedores", bola de magia, dano em branco, explosão de carne, placa de vitória) + `assets/css/bossfight.css` + `assets/boss/` (spritesheets e `intro.mp4`).
Regras, perguntas, rascunho, XP/Moedas/Combustível e ofensiva continuam sendo os do `app.js` (`Briif.boss`). A vitória só é registrada uma vez por batalha (`finalizado`) e a recompensa só na 1ª vitória da trilha (`bosses`). O vídeo aparece 1× por sessão, tem botão "Pular introdução" e, se não puder tocar, a batalha segue sem ele.


## Correções e avatares de mago (v28)
- **Menus**: o painel do menu ⋮ (celular) agora tem o próprio canto quebrado do pixel art e as opções ficam por dentro (antes o item aparecia como um quadrado separado no canto). Botões de tema/som: ícone centrado (grade) e sem `transform` no clique; os ícones pixel têm `viewBox` justo ao desenho (`pxArt` em `app.js`).
- **Login/cadastro**: o palco (`.auth`) deixou de ter fundo próprio e o rodapé encosta nele (`main.auth + .site-footer`), sem faixa de fundo entre os dois.
- **Onboarding**: removidos os slides "Modo game" e "Cores personalizadas" do array `TUTORIAL` (os indicadores e a navegação são calculados pelo tamanho do array).
- **Trilha personalizada**: `.pers-op` usava `white` fixo no estado marcado; agora usa as variáveis do tema (`dungeon.css`).
- **Fim de fase**: `resultado.css` + overrides em `dungeon.css` (lajes de pedra, número em fonte pixel, faíscas no lugar do confete). Celebrações de ofensiva/combustível em roxo.
- **Mago em pixel art**: `Briif.mago('vitoria'|'derrota')` (sprites da batalha, `assets/img/mago-vitoria.png` e `mago-derrota.png`). Usado no fim de fase e nas telas finais da batalha. O mago/ilustrações antigas (`mago-feliz.svg`, `mago-triste.svg`) foram removidos.
- **Chefe**: silhueta preta (`assets/boss/chefe-silhueta.png`, gerada do `chefe.png`, que permanece intacto) na introdução e no mapa da trilha; a arena continua usando o chefe colorido.
- **Vitória da batalha**: o "tijolinho" de pedra (`tijolo()` em `bossfight.js`) substitui a placa; o callback de conclusão e as recompensas não mudaram.
- **Avatares (magos de RPG)**: catálogo gerado por `python3 build/avatar/build.py` (peças em `build/avatar/pecas.py`) → `assets/js/avatar.js`. Grade 32×50, 20 categorias (limite de 20 chaves do `avatarCfg` nas regras do Firestore, por isso **as regras não foram alteradas**). Itens grátis: manto de aprendiz, cajado básico (o do mago da batalha), cabelos/barbas básicos, todas as cores e acessórios básicos. O editor (`editor-avatar.js` + `avatar.css`) mostra miniaturas sem texto, com os estados equipado / disponível / comprado / bloqueado. Compras continuam em `Briif.avatares.salvarPersonalizado` (valida saldo, desconta uma vez, grava `avatarPecas`).


## Ajustes da v29 (menus, ícones, intro, fotos, ranking, modo desenvolvedor)
- **Junção dos menus**: com o menu lateral, o `body` ganha 64 px de margem e o cabeçalho (fundo + borda) ficava só no miolo, deixando um "buraco" no canto. Em telas ≥ 861 px o `.site-header` agora se estende por baixo da margem (`dungeon.css`).
- **Botão fantasma**: era o botão "⋮" (`.more-btn`, só do celular), reativado no desktop por uma regra minha de `.theme-btn`. Agora `.theme-btn.more-btn` só aparece em ≤ 760 px.
- **Ícones** (`assets/img/ico/`, gerados por `build/icons/make_icons.py` a partir de `icones-menu/`; os originais não foram alterados): `ICONS.flame/coin/bloqueio/moon/sun` em `app.js` são a única definição. Fogo = faixa de 3 quadros animada em CSS (`.ic-fogo`), apagado = mesmo desenho cinza e parado (`fogo-apagado.png`), usado fora de `.chip.fire.on`, no ranking sem ofensiva e na tela de fim de fase. Moeda e carvão = imagem (`.ic-moeda`, `.ic-carvao`). Sol e lua = máscara pintada com `currentColor` (`.ic-mask`), então as cores de cada tema e os estados de hover/foco não mudaram.
- **Animação da tela inicial**: `build/intro/make_intro.py` recorta do spritesheet original (28 quadros de 840×1491) só os quadros 0–22 (os 23–27 trazem os botões do login) e só a área do logo; saída `assets/img/intro-briiff.png` (grade 6×4, 32 KB, máscara branca). `animarIntro()` em `app.js` toca num canvas (12 quadros/s, uma vez, fica no último) pintando com a cor do tema; com "reduzir movimento" mostra direto o quadro final.
- **Fotos de perfil**: 10 imagens em `assets/img/perfil/` (`build/perfil/make_perfil.py`), ids `foto-*`, 100 Moedas cada, sem nome nem descrição. As fotos antigas (`mago-roxo`, `bubu`, `riri`, `fefe`) saíram do catálogo; quem as tinha volta à inicial. Compra/seleção continuam em `Briif.avatares.comprar/selecionar` (valida saldo, não cobra duas vezes, grava em `avatares`/`avatarAtivo`, sincroniza como antes).
- **Ranking**: o link que cobre a linha (`.rk-link`) não tinha CSS e virava uma célula vazia da grade, empurrando cada coluna e amontoando as estatísticas. Agora é `position:absolute; inset:0` (`style.css`).
- **Modo desenvolvedor** (só teste local): `assets/js/ambiente.js` (`modoDesenvolvedor: false` por padrão). O link "Entrar como desenvolvedor" só é criado em `localhost/127.0.0.1` ou se a flag for ligada num ambiente de testes; em produção nem existe no HTML. A sessão é `{modo:'dev', uid:'dev-local'}`: nunca usa Firebase, não cria conta, não entra no ranking e guarda o progresso só em `briif:progress:dev-local`, recomeçando de um estado de teste a cada entrada. Todas as trilhas, fases, extras e batalhas ficam liberadas (`faseDisponivel`/`bossDisponivel`/`trilhas.js`), sem concluir nada. O painel **DEV** (`assets/js/dev.js`) cria estados: Moedas (+100/+500/ficar com 50/zerar), combustível, ofensiva (ativa/inativa/perder 1 ou 3 dias), XP, concluir fases de uma trilha, chefe vencido/pendente, zerar compras de avatar e recomeçar. Uma sessão "dev" forjada à mão num ambiente que não permite é descartada.

- **Sol, lua e moeda (ajuste)**: sol e lua agora vêm da pasta `icones/` enviada (sol 20×20, lua 18×18; os pixels meio-transparentes do sol são descartados e a cor continua a do botão, via máscara). A moeda estava torta porque o gerador media o "pixel de arte" só pela silhueta (7×7) e perdia o detalhe interno; ela é 14×14 e agora a medida é por cor (`build/icons/make_icons.py`). Os ícones são exibidos em múltiplos da própria grade (final de `dungeon.css`).
- **Sol e lua (correção)**: passaram a ser imagens comuns com as cores exatas dos arquivos enviados (sol lilás, lua preta). A versão anterior usava máscara CSS, que o navegador bloqueia quando o site é aberto direto do disco (`file://`), e o ícone sumia; testado agora abrindo por `file://` e por servidor.

## Perfis, nome, números e batalha (v30)
- **Nome BRIIFF do cabeçalho**: agora é o mesmo desenho do quadro final da animação de entrada (grade 104×30 extraída do spritesheet original); antes os "I" eram mais grossos (`palavraSvg` em `app.js`).
- **Números em pixel art**: fonte própria só para dígitos e símbolos de conta (`assets/fonts/briiff-numeros.woff`, gerada por `build/fonte/make_fonte.py`; grade 5×7, quadrada). `--px` usa ela primeiro (via `unicode-range`) e cai na Pixelify Sans para as letras.
- **Perfil pessoal** (`perfil.js` + final de `dungeon.css`): avatar de corpo inteiro ao lado do nome, da foto de perfil, das ações, dos números e da barra de XP.
- **Perfil público** (ao clicar no ranking): mesmo layout do pessoal, com o avatar de corpo inteiro, a foto de perfil e os dados públicos que já existiam (nível, XP total, acertos, ofensiva, recorde). O personagem agora é sempre publicado no ranking (`avatarCfg`), independente da foto escolhida; perfis publicados antes só mostram o avatar depois da próxima sincronização da pessoa (senão aparece uma silhueta).
- **Foto de perfil**: nova aba "Foto de perfil" em `avatar.html` (`editor-avatar.js`): o avatar (busto), as fotos que a pessoa já tem e a inicial do nome. A escolha fica em `avatarAtivo` (`custom`, `foto-*` ou vazio); salvar o avatar não troca mais a foto escolhida (só na primeira vez).
- **Batalha final lado a lado** (≥ 900 px, `bossfight.css`): luta à esquerda e questões à direita, cabendo na tela em 1366×768 e 1920×1080; rascunho e o resto embaixo. Em telas estreitas continua empilhado.
