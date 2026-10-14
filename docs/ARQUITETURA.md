# Briiff — arquitetura do site (síntese do código)

Site **estático** (HTML + CSS + JavaScript puro, sem build). Toda a lógica roda no navegador;
a nuvem (Firebase) só guarda conta e progresso. Hospedagem: Render (Static Site).

## Números
| Item | Valor |
|---|---|
| Páginas HTML | 10 (`index`, `login`, `onboarding`, `trilhas`, `licao`, `boss`, `laboratorio`, `ranking`, `loja`, `perfil`) |
| JavaScript | 17 arquivos, ~4.200 linhas sem o `data.js` |
| Conteúdo (`data.js`) | 5 trilhas (Álgebra, Geometria, Funções, Estatística, ENEM) · 37 fases · 111 exercícios · 37 aulas (validado: ids únicos, resposta dentro das opções, sem opções repetidas) |
| CSS | `style.css` (base, componentes, noturno, pixel) + `suave.css` (tema suave, sobrescreve cores/fontes) |
| Fontes | locais (`assets/fonts`): Inter (pesos 400–800) |

## Camadas
```
HTML (casca: <header id="site-header">, <main>, <footer id="site-footer">)
  └─ tema.js / som.js        carregados no <head> (aplicam tema/cores antes de pintar; sons sintetizados)
  └─ firebase-config.js      chaves públicas do projeto Firebase
  └─ data.js                 window.BRIIF_DATA = { trilhas, aulas }
  └─ app.js                  núcleo: window.Briif (auth, progresso, sync, ranking, loja, boss, header)
  └─ <página>.js             tela específica; todas começam com B.iniciar('<aba ativa>')
```

### `app.js` — o núcleo (`window.Briif`)
| Bloco | O que faz |
|---|---|
| Utilidades | `esc` (escapa HTML), `rich` (texto das lições → HTML seguro), `fmt`, datas |
| Sessão/Auth | Google, e-mail/senha, convidado (anônimo) e modo demonstração (sem Firebase). Carrega o SDK do Firebase sob demanda |
| Trilha personalizada | o aluno escolhe ≥ 2 matérias e o site monta até 10 fases de 5 questões misturando as questões |
| Progresso | XP, nível (xpProx × 1,25), MathCoins, bloqueios, ofensiva, fases e bosses concluídos |
| Ofensiva | conta 1 dia ao concluir fase/boss; se faltar dias, usa **bloqueios** automaticamente (1 por dia). Quando um bloqueio é usado, guarda um aviso para a animação |
| Loja | bloqueio (100 MathCoins), 4 avatares (100 cada), código promocional |
| Sincronização | `mesclar` junta navegador + nuvem sem perder nada; `sincronizar` lê/mescla/grava `usuarios/{uid}` e publica `ranking/{uid}` |
| Ranking | publica só dados públicos (nome abreviado, avatar, nível, XP, acertos, recorde, ofensiva); convidados não entram; opt-out por `rankingOculto` |
| Header/Footer | navegação, chips (ofensiva, bloqueios, MathCoins), menu ⋮ (cores, noturno, pixel, som) |
| Abertura | 1ª abertura do dia: animação de boas-vindas; se um bloqueio foi usado: animação do bloqueio |

### Páginas e scripts
| Página | Script | Função |
|---|---|---|
| `index` | `home.js` | apresentação, trilhas, demo de equação, equipe |
| `login` | `login.js` | login (valida o `next` por regex), convidado |
| `onboarding` | `onboarding.js` | tutorial + quiz de boas-vindas para contas novas |
| `trilhas` | `trilhas.js` | caminho em zigue-zague, painel de progresso, trilha personalizada |
| `licao` | `licao.js` | Aprender → Praticar → Resultado (+ `rascunho.js`) |
| `boss` | `boss.js` | batalha com o Mago Roxo: 3 vidas, 6 golpes, tempo por pergunta |
| `laboratorio` | `lab.js` | calculadoras com passo a passo (1º grau, Bhaskara, Pitágoras, estatística) |
| `ranking` | `ranking.js` | classificação por XP, aproveitamento e ofensiva |
| `loja` | `loja.js` | compras e código promocional |
| `perfil` | `perfil.js` | estatísticas e calendário de estudo |
| (todas) | `celebracao.js` | animações em tela cheia: ofensiva, **bloqueio usado**, **boas-vindas** |

## Dados
### localStorage (navegador)
| Chave | Conteúdo |
|---|---|
| `briif:session` | sessão atual (uid, nome, tipo, modo) |
| `briif:progress:<uid>` | progresso completo |
| `briif:personalizada:<uid>` | matérias da trilha personalizada |
| `briif:rankoculto:<uid>` | preferência de sair do ranking |
| `briif:aviso-bloqueio:<uid>` | aviso pendente "bloqueio usado" (some após a animação) |
| `briif:boasvindas:<uid>` | data da última animação de boas-vindas |
| `briif:sync-gravado:<uid>` | horário da última gravação na nuvem |
| tema, cor, pixel, som | preferências visuais e de áudio (`tema.js`, `som.js`) |

### Firestore
- `usuarios/{uid}` — privado (só o dono): `nome, email, foto, tipo, rankingOculto, ultimoAcesso, criadoEm, progresso{…}`
- `ranking/{uid}` — público para logados; só o dono escreve, com validação: `nome, avatarId, nivel, xpTotal, acertos, total, recorde, streak, atualizadoEm`

### Progresso (`progresso`)
`xp, nivel, xpProx, moedas, bloqueios, fases[], bosses[], streak, recorde, ultimoDia, dias[], protegidos[], porTrilha{}, ultimo, boasVindasDadas, avatares[], avatarAtivo, avatarAtivoTs`

## Fluxos principais
1. **Abrir uma página**: `B.iniciar` → monta header/footer → `lerProgresso` (aplica bloqueios se faltou) → animações de abertura → sincronização leve com a nuvem.
2. **Concluir fase**: `completarFase` → XP/MathCoins só na 1ª vez → nível (+1 bloqueio) → ofensiva → salva local → `agendarEnvio` (400 ms) → Firestore.
3. **Faltou um dia**: ao abrir, `lerProgresso` consome 1 bloqueio por dia perdido, move `ultimoDia` e registra o aviso → animação do bloqueio. Sem bloqueio, a ofensiva zera.

## Segurança (resumo)
- Regras do Firestore: dono-apenas em `usuarios`; `ranking` com campos permitidos e limites.
- `esc()` em todo texto dinâmico; `next` do login validado; sem `eval`.
- Chaves do Firebase são públicas por natureza (quem protege são as regras).
- Limitação conhecida: a pontuação é calculada no navegador, então um usuário técnico pode alterar os próprios números. Para um ranking competitivo seria preciso validar no servidor (Cloud Functions).
