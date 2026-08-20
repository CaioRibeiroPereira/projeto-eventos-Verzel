# Decisões do projeto (rascunho)

Log cru de decisões tomadas ao longo do desenvolvimento, para virar a seção de
decisões do README na Fase 6. Uma entrada por decisão, com data e porquê.

## 2026-08-15 — Quem pode se autocadastrar (revisado em 19/08, ver entrada abaixo)

Registro público permite **Cliente** e **Organizador**, via um código de
crachá pré-cadastrado (`ORG-001` etc). **Portaria** não tem autocadastro —
é sempre provisionada via seed.

O PDF do desafio não especifica como cada papel é provisionado, só que os 3
papéis existem e que o seed precisa ter 1 organizador, 2 clientes e 1 usuário
de portaria.

**Superado em 19/08**: o esquema de crachá tinha um furo — o código era
público/compartilhável, então qualquer pessoa que soubesse um código virava
organizador de verdade, sem nenhum vínculo com quem realmente era o dono
daquela credencial. Ver a entrada de 19/08 com o modelo que substituiu isso.

## 2026-08-17 — Nome da plataforma

O cinema/plataforma se chama **Cine Verzel**. Usado na logo, no header e no
rodapé.

## 2026-08-17 — Escopo fica só em cinema por enquanto

Cogitamos expandir para teatro, dança e concertos via Ticketmaster
Discovery API (o PDF permite isso). Decidimos adiar: o prazo é curto
(entrega 21/08).
Fica como possível próximo passo, não como parte do escopo atual.

## 2026-08-17 — Reserva de múltiplos assentos, limite de 2 por pessoa

Uma reserva agora pode incluir de 1 a 2 assentos numa compra só, em vez de
sempre um por vez. A Reservation continua sendo uma linha só, mas gera um
Ticket por assento (cada um com seu próprio QR). O requisito crítico de não
vender o mesmo lugar duas vezes se estende ao lote inteiro: todos os
assentos são inseridos na mesma transação, então se qualquer um do lote já
estiver ocupado, a reserva inteira falha — nunca fica parcialmente
reservada.

## 2026-08-17 — Checkout com 4 formas de pagamento simuladas

O pagamento simulado tinha só dois botões crus ("aprovar"/"recusar"), pouco profissional. Trocado por uma tela de checkout com
seleção entre cartão de crédito, PIX, boleto e "pagar na hora do filme" —
cada um com a interface que teria de verdade (formulário de cartão com
máscara, QR code de PIX, código de barras de boleto). Continua 100%
simulado, sem gateway de pagamento real (exigência do PDF do desafio):
cartão/PIX/boleto guardam um link discreto "simular recusado" pra cobrir o
caminho de recusa; "pagar na hora" só confirma, já que não há pagamento
para recusar nesse caminho.

## 2026-08-17 — Fluxo de compra em duas etapas

A página do evento vira uma página "sobre o filme" (sinopse, gênero,
duração, pôster, backdrop) pública, sem mapa de assentos. Só depois que o
cliente clica em comprar — e está logado como cliente — é que o mapa de
assentos aparece, numa rota separada (`/eventos/[id]/reservar`). Antes, o
mapa aparecia direto na página do filme, mesmo para visitantes deslogados,
o que não fazia sentido: primeiro se decide pelo filme, depois se loga,
depois se escolhe o lugar.

## 2026-08-19 — Pagamento continua 100% simulado, sem gateway real

O PDF permite opcionalmente usar o ambiente de testes de um provedor de
pagamento de verdade (ex: Stripe test mode). Cogitamos trocar o checkout
simulado por isso, mas decidimos manter como está: o requisito já é
atendido pelo checkout simulado com confirmação e recusa (ver decisão
acima), e integrar um gateway real consumiria tempo.

## 2026-08-19 — Código curto separado pro fallback manual da portaria

A portaria já tinha câmera + digitação manual, mas o ingresso só mostrava
o QR — não havia nenhum código pra digitar. O payload assinado do QR
(`id:assinatura-hmac-sha256`, ~68 caracteres) garante que não pode ser
forjado, mas é longo demais pra digitar olhando o celular. Cada ingresso
ganhou um `manual_code` próprio: 8 caracteres, alfabeto sem 0/O/1/I/L
pra evitar confusão visual, gerado e persistido junto com o QR/link de
compartilhamento. A portaria aceita os dois formatos (QR completo pela
câmera, código curto digitado) e ambos passam pela mesma checagem
atômica de uso único — o código curto é só uma chave de busca alternativa,
não substitui a assinatura HMAC como garantia de autenticidade do QR.

## 2026-08-19 — Organizador vira seed-only, portaria é cadastrada pelo organizador

O esquema antigo de crachá (`ORG-001`, `GATE-001`) tinha um furo real: o
código era só um texto compartilhável, sem nenhuma checagem de quem era o
dono de fato. Qualquer pessoa com o código virava organizador de verdade.

Novo modelo:
- **Organizador**: não tem mais autocadastro. Só existe via seed/banco —
  removi `/organizador/cadastro` e o endpoint `/auth/register/organizador`.
  O seed agora cria **2 organizadores** pra deixar claro que o sistema
  suporta vários.
- **Portaria**: também perde o autocadastro por código. Em vez disso, o
  painel do organizador ganhou uma tela ("Equipe da portaria") onde ele
  digita nome/email/senha e a conta é criada na hora, sem fluxo de convite
  por e-mail (fora de escopo do desafio). O `User` ganhou um campo
  `organizer_id` (só usado por contas `gate`) registrando quem cadastrou
  aquele porteiro.
- A tabela `StaffCredential` inteira foi removida (modelo, repositório,
  migration de drop, schemas, endpoints) — não tinha mais uso depois dessa
  mudança.
- **Escopo de validação**: um porteiro continua podendo validar ingressos
  de qualquer evento publicado, não só dos eventos de quem o cadastrou —
  o `organizer_id` é só pra saber quem é responsável pela conta, não pra
  restringir o que ela pode validar. Decisão explícita pra manter o
  comportamento atual da tela de portaria (lista todos os eventos
  publicados), evitando escopo extra de "portaria só vê seu organizador"
  que o desafio não pediu.

## 2026-08-19 — Cancelamento de ingresso (opcional, fora de ordem de propósito)

Implementado fora da ordem de execução que eu mesmo tinha definido

- Cancelamento é por **reserva** (não por ingresso individual): uma
  reserva com 2 assentos cancela os 2 juntos, batendo com o modelo de
  dados (`status` vive na Reservation).
- Só cancela reserva `paid`, e só se nenhum ticket do lote já foi
  validado na portaria (`status == used`) — não dá pra devolver um lugar
  que a pessoa já usou pra entrar.
- Mesma garantia de "não vender o lugar 2x" reaproveitada: marcar o
  ticket como `cancelled` já libera o assento, porque o
  `UNIQUE(event_id, seat_id)` ignora linhas `cancelled`. Não precisei de
  lógica nova pra "devolver ao estoque" — só reusar o filtro que já
  existia pro caminho de pagamento recusado/expirado.
- `list_for_customer` (tela "Meus ingressos") mudou de filtrar por
  `status != cancelled` para filtrar por `qr_signature is not null`:
  precisava diferenciar "reserva recusada, nunca virou ingresso de
  verdade" (continua escondida) de "ingresso que o cliente cancelou
  depois de já ter sido emitido" (agora aparece, com badge "Cancelado").

## 2026-08-19 — Limite de 2 assentos por pessoa passa a ser acumulado

Bug: um cliente conseguia furar o limite de 2 assentos por evento criando
uma reserva nova depois de já ter comprado 2 — a checagem só olhava a
reserva atual, não o total já em posse da pessoa naquele evento. Corrigido
somando tickets ativos (`paid`/`pending`/`awaiting_door_payment` não
vencido) do cliente naquele evento antes de aceitar uma nova reserva.

## 2026-08-19 — Portaria cobre várias sessões ao mesmo tempo, com desfazer

Um porteiro real costuma cobrir mais de uma sala/sessão no mesmo turno, não
uma só. A tela de portaria virou: primeiro escolhe (com checkbox) quais
sessões está cobrindo — com filtro por data, mostrando só as de hoje por
padrão — e só depois entra no modo de validar, aceitando o código de
qualquer uma das sessões marcadas. Também ganhou "desfazer": se o porteiro
validar o ingresso errado, um botão reverte `used` → `valid` logo em
seguida (mesma checagem atômica do `try_mark_used`, só que invertida).

## 2026-08-19 — Organizador e portaria não podem apagar a própria conta

Diferente do cliente (que pode desativar/anonimizar a própria conta),
organizador e portaria ficam de fora do DELETE em `/me`: apagar um
organizador apagaria em cascata os eventos e o histórico de vendas dele, e
apagar um porteiro no meio do próprio turno não faz sentido. Gerenciamento
de equipe de portaria continua existindo, mas como uma ação que só o
organizador faz *para* o porteiro no painel dele — nunca autoatendimento.

## 2026-08-19 — Equipe da portaria vira compartilhada entre todos os organizadores

Revisão do modelo descrito na entrada anterior ("organizador vira
seed-only"): lá, o campo `organizer_id` do porteiro também limitava o que
ele enxergava. Na prática isso nunca fez sentido pro desafio — a tela de
portaria já lista todos os eventos publicados, de qualquer organizador — e
também atrapalhava a gestão: com 2 organizadores no seed, cada porteiro só
podia ser gerenciado por quem o criou. Agora `list`/`create`/`delete` de
portaria funcionam iguais pra qualquer organizador, sem filtrar por quem
cadastrou. `organizer_id` continua na tabela, mas só como metadado
informativo ("criado por"), sem efeito em permissão nenhuma.

## 2026-08-19 — Painel do organizador ganha dashboard separado

Testei primeiro uma versão mais simples (métricas embutidas no topo da
lista de eventos), mas resolvi desenvolver com mais dado e
gráfico — não misturada com a tela de criar/gerenciar evento. Virou
`/organizador/dashboard`: KPIs (receita, ingressos vendidos, ocupação
média) e gráficos com `recharts` (vendas por evento, ocupação, eventos com
baixa procura). Pra dar cara real aos gráficos, o seed passou a simular
vendas variadas entre os eventos publicados (~40 clientes sintéticos, taxas
de ocupação diferentes por evento) em vez de eventos vazios.

## 2026-08-19 — Criação de evento: data/hora separadas, publicar direto, busca e ordenação

(1) o formulário trocou o único campo
datetime-local por dois campos (data e hora) separados; (2) ganhou um
checkbox "publicar agora" pra não obrigar rascunho → publicar como dois
passos; (3) a lista do organizador ganhou busca por nome e ordenação por
data de criação ou de exibição da sessão. O item 3 expôs dois problemas
que não eram de UI: a coluna `created_at` não existia no `Event` (migração
manual pra adicionar, com `server_default=now()`) e, nos eventos antigos
do seed, todos herdaram o mesmo instante no backfill — corrigido
espalhando os timestamps manualmente pra a ordenação fazer sentido nos
dados de exemplo.

Durante o item 1 também encontrei um
bug de fuso: o formulário convertia a data/hora local pro UTC via
`.toISOString()` antes de enviar, mas nada mais no app (exibição, banco)
esperava ou revertia essa conversão — todo evento novo aparecia 3h depois
do horário digitado. O app inteiro trata datetime como local/naive, sem
conversão de fuso em lugar nenhum; a correção foi parar de converter.

## 2026-08-19 — Cancelamento de evento até 24h antes + trava de sala/horário

Opcional de cancelamento de evento (diferente do cancelamento de reserva
individual, que já existia): o organizador cancela um evento inteiro até
24h antes da sessão, o que cancela em cascata as reservas pagas e as
aguardando pagamento na portaria, liberando os assentos. Depois de
cancelado, o evento não pode ser republicado. Junto, criar um evento passou
a checar sobreposição de sala/horário (duração do filme via TMDb + 20min de
troca de sala, com 120min de fallback quando o TMDb não informa duração) —
sem isso seria possível publicar duas sessões na mesma sala no mesmo
horário. A mensagem de "não dá pra cancelar" também precisou diferenciar
"evento já aconteceu" de "faltam menos de 24h", que é um erro distinto.

## 2026-08-19 — Consolidação de organizadores órfãos

O notei que os dados de um filme (Friends: The Reunion)
apareciam diferentes entre cliente, organizador e portaria. Não era bug de
sincronização: eram 9 contas de organizador remanescentes de antes da
mudança pra "organizador é seed-only" (criadas quando ainda existia
autocadastro por crachá), e 4 delas tinham eventos publicados de verdade,
com vendas reais. Como o painel do organizador só mostra os eventos dele
mesmo, mas cliente/portaria veem os de todos, o mesmo evento "existia" de
um jeito pra quem o criou e sumia pra outros organizadores olharem. Os 4
eventos com dado foram reatribuídos pro organizador oficial do seed
(preservando as vendas) e as 9 contas órfãs, apagadas. Isso revelou mais 2
conflitos de sala/horário entre eventos que nunca tinham sido comparados
entre si — resolvidos com o mesmo critério de manter o mais vendido.

## 2026-08-19 — Pagamento na hora do filme

Pedido do usuário: a portaria precisa de um jeito de cobrar quando o
cliente escolhe pagar só na entrada, em vez de sempre exigir pagamento
antecipado. Duas perguntas de produto resolvidas antes de
implementar: o ingresso é emitido com QR na hora que a pessoa escolhe
"pagar na hora" (aparece em "Meus ingressos" já, com aviso de pendente) e a
portaria cobra e libera a entrada numa ação só, não em duas etapas. A
reserva ganhou um status novo, `awaiting_door_payment` — segura o assento
até o horário da sessão (não os 10min normais do checkout) — e escanear um
desses ingressos na portaria devolve `payment_due` com o valor, em vez de
liberar a entrada. "Cobrar e liberar entrada" muda a reserva pra `paid` e
o(s) ticket(s) pra `used` numa transação só.

Testando esse fluxo achei um bug real, sem relação direta com o pedido:
uma reserva `pending` que expira sem o cliente confirmar nem recusar o
pagamento trava o assento pra sempre — o `UNIQUE(event_id, seat_id)` do
Ticket só olha o status do ticket, não o `expires_at` da reserva, e esse
ticket nunca era marcado como cancelado depois de vencer. O mapa de
assentos já ignorava reservas vencidas corretamente (mostrava o lugar como
livre), mas tentar reservar aquele lugar sempre falhava — um assento
"fantasma" preso por uma sessão de checkout abandonada. Corrigido: antes de
criar uma reserva nova, o repositório libera (marca como `failed`/
`cancelled`) qualquer hold vencido nos assentos pedidos, na mesma
transação do insert — a garantia de concorrência continua sendo o índice
único, não essa limpeza.

## 2026-08-19 — Responsividade mobile/tablet

Passagem completa de responsividade: sidebar da área admin vira menu
colapsável em telas pequenas, mapa de assentos e header se adaptam. Achado
no caminho um bug de CSS real (não relacionado a responsividade em si): um
elemento decorativo do fundo com `z-index` negativo escapava pra trás do
`<body>` inteiro em vez de ficar atrás só do container esperado, porque o
pai só tinha `position: relative` sem `isolation: isolate` — sem isso, o
navegador não cria um novo contexto de empilhamento e o filho de z-index
negativo escapa pro ancestral mais próximo que criar um de verdade.

## 2026-08-19 — DECISIONS.md volta a ser versionado, CLAUDE.md fica de fora

Os dois tinham sido tirados do repo (via `.gitignore`) pra ficar só
locais. Ao revisar o enunciado de novo antes da entrega, ficou claro que
isso ia contra um pedido explícito do desafio: "se você produziu
artefatos no caminho, como specs... versione junto no repositório" —
exatamente o que este arquivo é. O `DECISIONS.md` volta a ser rastreado
(atualizado com tudo que faltava). O `CLAUDE.md` fica de fora: é o brief
completo do desafio junto com instruções internas de como devo trabalhar
nesse repositório — conteúdo operacional, não uma decisão de produto pra
reportar. O que precisa ser mostrado — o que foi entregue de cada
requisito do PDF — virou um arquivo novo, `CHECKLIST.md`.

## 2026-08-19 — Testes da lógica crítica, contra Postgres de verdade

Opcional item 9: assinatura do QR, unicidade do assento, validação única
na portaria e cancelamento com devolução ao estoque. Sem perseguir
cobertura — só provar as quatro garantias.

Decisão de infraestrutura: os testes de banco rodam contra um Postgres de
teste de verdade (`eventos_test`, mesmo servidor do `docker-compose.yml`),
não SQLite nem mocks. O motivo é que a garantia de "não vender o mesmo
lugar duas vezes" é um índice único **parcial** do Postgres
(`UNIQUE(event_id, seat_id) WHERE status != 'cancelled'`) — testar contra
SQLite validaria só um índice único comum, sem o filtro por status, o que
provaria menos do que a garantia real exige. Cada teste roda numa
transação isolada (savepoint), desfeita no final, então não suja o banco
de teste entre execuções.

Testando a unicidade do assento, escrevi de propósito um teste pro bug do
"hold expirado" que corrigi mais cedo hoje (reserva pendente vencida
travando o assento pra sempre) — e um teste contrário, provando que um
hold ainda dentro do prazo continua bloqueando normalmente. A ideia é que
um teste sozinho provando "o bug sumiu" não é suficiente; precisa também
provar que a trava de concorrência não foi enfraquecida no processo.

## 2026-08-19 — Docker Compose completo

Opcional item 7. O `docker-compose.yml` só subia o Postgres; agora sobe a
aplicação inteira com um comando. Duas decisões técnicas que valem
registrar:

- O backend roda `alembic upgrade head` e o seed (idempotente) como parte
  do próprio `CMD` da imagem, antes do uvicorn — assim `docker compose up`
  já deixa tudo pronto pra avaliar, sem passo manual de migration/seed
  depois. `DATABASE_URL` precisa ser sobrescrita no serviço (aponta pro
  hostname `db` da rede do compose, não `localhost` — o `.env` local usa
  `localhost` porque é pensado pra rodar fora do Docker).
- O frontend ganhou Dockerfile multi-stage com `output: "standalone"` do
  Next.js. `NEXT_PUBLIC_API_URL` entra como build arg, não só variável de
  ambiente do container: o Next.js inlina variáveis `NEXT_PUBLIC_*` no
  bundle do cliente já na hora do `next build`, então setar isso só em
  runtime não teria efeito nenhum no código que já rodou no browser.

Testado de ponta a ponta antes de considerar pronto: build das duas
imagens, subida dos 3 serviços, login e listagem de eventos direto pela
API containerizada, e o bundle do front realmente com a URL certa da API
embutida (não só "buildou sem erro").

## 2026-08-20 — Mapa de assentos em tempo real

Opcional item 10, deixado por último de propósito por ser o mais
arriscado. WebSocket em `/ws/events/{id}/seats`: quando um assento muda de
ocupação (reserva criada, cancelada, recusada, ou evento cancelado em
cascata), o backend avisa quem está com aquele mapa aberto; o cliente
busca o mapa atualizado de novo (o socket só carrega "algo mudou", não o
estado inteiro — mais simples e sempre consistente com o banco). Se o
assento que a própria pessoa tinha escolhido acabou de ser levado por
outra, ele sai da seleção dela sozinho, com aviso, e pisca no mapa por um
instante.

Duas decisões técnicas:
- As sessões do banco (SQLModel/psycopg2) são síncronas, mas o WebSocket é
  assíncrono. A ponte é `asyncio.run_coroutine_threadsafe`: os services
  continuam chamando uma função síncrona normal depois do commit, que
  agenda o broadcast de volta na event loop principal (capturada uma vez
  no `lifespan` de startup do FastAPI).
- Conexões ficam em memória, agrupadas por evento — funciona bem com um
  processo de backend só (o caso do desafio). Múltiplas instâncias em
  produção precisariam de um pub/sub compartilhado (Redis, por exemplo);
  registro pra não esquecer se algum dia isso for além do desafio.

Não fiz reconexão automática se o socket cair (ex: backend reinicia no
meio da sessão do cliente) — mantém o escopo enxuto; sem o socket, o mapa
volta a funcionar do jeito antigo (só atualiza ao recarregar a página),
não quebra nada.

Testado o backend de ponta a ponta com um cliente WebSocket real: conecta,
outra "pessoa" reserva um assento, o primeiro recebe o aviso com o id do
assento certo; mesma coisa pro caminho de liberação (pagamento recusado).

## 2026-08-20 — Cliente pode cancelar uma reserva `pending` abandonada

Bug encontrado: comprar 1 assento e pagar, depois tentar comprar outro na
mesma sessão, dava "você já tem 2 assentos" mesmo tendo pago só 1. Não era
contagem errada — era efeito colateral confuso de uma decisão de alguns
dias atrás (reserva `pending` conta pro limite de 2 por pessoa, proposital,
pra ninguém furar o limite abrindo várias reservas sem nunca pagar
nenhuma). O problema real: um checkout aberto e abandonado (foi até a tela
de pagamento e saiu sem confirmar nem recusar) fica `pending`, segurando o
assento e contando pro limite por até 10 minutos — e não existia nenhum
jeito do cliente ver ou cancelar essa reserva presa, só esperar expirar.

Duas peças novas:
- `GET /events/{id}/reservations/pending` — lista as reservas `pending`
  (não vencidas) do próprio cliente naquele evento.
- `cancel_reservation` (que já existia pra reserva paga) passou a aceitar
  `pending` também — marca como `cancelled` (ação explícita do cliente),
  não `failed` (que já é usado pra "recusou o pagamento" ou "expirou
  sozinha", distinção que vale manter no histórico).

Na tela de reserva, se o cliente tem uma reserva `pending` parada nesse
evento, aparece um aviso acima do mapa de assentos: "Continuar pagamento"
(retoma de onde parou) ou "Cancelar e liberar" (devolve o assento na hora).

Reproduzi o bug relatado de ponta a ponta contra o backend de verdade
(comprar 1 + pagar, abrir um segundo checkout e abandonar, confirmar que a
terceira tentativa bloqueia, cancelar a reserva presa pelo endpoint novo,
confirmar que a compra seguinte funciona) antes de considerar corrigido.

## 2026-08-20 — Removido o trailer de co-autoria da IA dos commits

Por algum motivo, ao longo da semana, boa parte dos commits acabou saindo
com um trailer `Co-Authored-By: Claude Sonnet 5` no final da mensagem —
provavelmente ficou ali de quando estava mexendo mais a fundo caçando bug,
sem eu prestar atenção nisso depois. Removido: reescrevi a
mensagem de todos os commits (110 no total) tirando só essa linha — datas,
ordem e conteúdo de cada commit continuam exatamente iguais, só o hash
muda — e forcei o push pra atualizar o histórico já publicado no GitHub
também, já que boa parte desses commits já tinha ido pra lá antes da
remoção.

## 2026-08-19 — Por que `frontend/AGENTS.md` e `frontend/CLAUDE.md` existem

Não foram arquivos que eu criei de propósito. O Next.js 16 (a versão usada
aqui) tem um mecanismo próprio: quando `next dev` roda e detecta um agente
de IA em uso, ele gera e mantém sozinho um `AGENTS.md`/`CLAUDE.md` na pasta
do front-end, avisando que essa versão tem mudanças que quebram convenções
antigas e mandando ler a documentação local
(`node_modules/next/dist/docs/`) antes de escrever código —
`generate-agent-files.js`, dentro do próprio pacote `next`. `CLAUDE.md`
só tem `@AGENTS.md` (um include).

Estão rastreados desde o primeiro commit do projeto ("Fase 1: esqueleto"),
porque apareceram sozinhos assim que `next dev` rodou pela primeira vez. Se
forem removidos do repo, o `next dev` recria na próxima execução — por
isso ficam versionados, senão viram um "arquivo sujo" toda hora. Não são
lixo nem acidente: são infraestrutura do próprio framework.

## 2026-08-20 — Deploy: Vercel + Render, sem Neon

Duas contas em vez de três: front no Vercel, back e banco os dois no
Render (não usei Neon pro Postgres). O Postgres grátis do Render se apaga
sozinho 30 dias depois de criado — normalmente um problema sério pra
produção, mas o prazo do desafio é amanhã, então o risco real de a
avaliação demorar mais que um mês é baixo. Trade-off consciente: uma conta
a menos pra criar agora, contra um prazo de validade que quase certamente
não vai importar.

Preparei o código pra funcionar nas duas plataformas sem precisar reescrever
nada depois de já estar no ar:
- `DATABASE_URL` agora aceita o formato que o Render entrega
  (`postgres://...`, sem o driver) — um validator no `Settings` reescreve
  pra `postgresql+psycopg2://...` sozinho, sem precisar montar a URL na
  mão.
- A porta do servidor agora respeita a variável `PORT` que o Render define
  em runtime (`--port ${PORT:-8000}`), com fallback pro 8000 de sempre
  quando ela não existe (dev local, `docker compose`).
- CORS ganhou uma variável nova, `FRONTEND_URL`, pra liberar o domínio do
  Vercel sem precisar mexer em código — em dev local ela fica vazia e o
  comportamento não muda nada.

## 2026-08-20 — Falha no TMDb não pode mais derrubar o deploy inteiro

Bug real encontrado no primeiro deploy no Render: o `seed.py` não tinha
nenhuma proteção contra o TMDb falhar, e como o `Dockerfile` encadeava
migration → seed → servidor com `&&`, uma falha na busca de filme
(nesse caso, chave da API inválida) derrubava o script inteiro — e o
`uvicorn` nunca chegava a subir. O servidor inteiro ficava fora do ar por
causa de um problema que só afetava o catálogo de filmes do seed.

Duas camadas de correção: `seed_events` agora pula só o filme que falhou
e segue pros próximos (os usuários, que já tinham sido criados antes,
não se perdiam mais); e o `Dockerfile` trocou `python -m app.seed &&` por
`(python -m app.seed || true) &&`, então nenhuma falha de seed — essa ou
qualquer outra no futuro — impede o servidor de subir. Migration continua
obrigatória de verdade (sem tabela não tem app), só o seed virou best-effort.

De quebra, o cliente do TMDb (`integrations/tmdb.py`) ganhou um log do
status e corpo reais da resposta quando falha — antes só existia
"Falha ao consultar o TMDb" sem detalhe nenhum, impossível de diagnosticar
remotamente sem acesso ao container. Reproduzi o erro de propósito com uma
chave inválida antes de considerar corrigido: confirma que o formato do
erro bate com o que apareceu no log do Render (401, chave inválida).

## 2026-08-20 — `output: "standalone"` quebrava o build no Vercel

Bug real do primeiro deploy no Vercel: `next.config.ts` tinha
`output: "standalone"` fixo (adicionado antes, só pra imagem Docker). O
Vercel tem o próprio pipeline de bundling e espera a saída padrão do
`.next` — com "standalone" ligado, ele procura um arquivo de rastreamento
(`next-server.js.nft.json`) que o modo standalone não gera do mesmo jeito,
e o build quebra com `ENOENT`.

Corrigido deixando o `output: "standalone"` condicional a uma variável
(`DOCKER_BUILD=true`, setada só dentro do `frontend/Dockerfile`) em vez de
fixo — no Vercel essa variável não existe, então o build usa a saída
padrão normalmente; no Docker (local ou qualquer plataforma que use a
imagem) continua gerando o standalone de sempre. Testei os dois caminhos
antes de considerar corrigido: `npm run build` local sem a variável gera
o `.next` padrão (com o arquivo de rastreamento que faltava), e o
`docker compose build` continua gerando `.next/standalone` normalmente.

## 2026-08-20 — Trailer sem chave em quase todo o seed do deploy

Depois do primeiro seed bem-sucedido no Render, reparei que 19 dos 20
eventos ficaram sem `youtube_key` (nenhum trailer aparecendo), mesmo pra
filmes que localmente têm. Não era bug de código nem do TMDb em geral:
testei na hora, direto na API do TMDb com os mesmos parâmetros que o app
usa, e ela devolveu o trailer certinho pro Matrix — e um dos 20 eventos do
próprio seed (A Odisseia) veio com o trailer correto. Foi uma instabilidade
pontual do TMDb bem na hora daquela leva de ~20 chamadas em sequência
durante o seed, não algo sistemático.

O problema é que `seed_events` só cria evento se o organizador ainda não
tiver nenhum — então um redeploy novo não ia corrigir isso sozinho, só
pular achando que já está seedado. Decisão: apaguei os 20 eventos (e
assentos/reservas/ingressos ligados a eles) direto no banco do Render, sem
mexer nos usuários, pra recriar os filmes na mão pelo painel do
organizador — cada criação chama o TMDb na hora, então sai com o trailer
certo dessa vez. Não copiei o `seed.py` pra rodar de novo automaticamente
porque criar na mão já é rápido pra ~20 filmes e evita depender de uma
chamada em lote instável de novo.

## 2026-08-20 — Apagar evento, mas só depois de cancelado

Painel do organizador ganhou uma lixeira pra apagar o evento de vez —
útil pra limpar teste/engano sem deixar lixo acumulando na lista pra
sempre. Regra: só apaga se o evento já estiver `cancelled`. Em vez de
duplicar a checagem de segurança (nenhuma reserva paga ou aguardando
pagamento pendurada nele), reaproveita a garantia que o cancelamento já
dá — se chegou cancelado, já é seguro apagar, ponto.

`DELETE /events/{id}` limpa tickets/reservations/seats daquele evento e
por fim o evento em si, nessa ordem (por causa das FKs). Testado
end-to-end: tentar apagar um evento publicado dá 409; apagar um cancelado
dá 204 e o evento some de verdade (404 depois).

## 2026-08-20 — Cogitamos editar evento, decidimos não

Cogitei implementar edição de evento (sala, data, preço, formato, idioma),
mas a real necessidade por trás do pedido era só "cometi um engano, quero
recomeçar sem sujeira" — e isso o fluxo que já existe cobre: cancela (dá
pra cancelar mesmo em rascunho, não só publicado) → aparece a lixeira →
apaga → cria de novo do zero. Editar só faria diferença de verdade se o
evento já tivesse venda de ingresso (aí cancelar devolveria dinheiro de
gente que talvez só quisesse corrigir um detalhe) — decisão de produto
mais delicada, não entramos nela agora.

## 2026-08-20 — Bug real: dava pra criar evento no passado

Achado testando a aplicação: o formulário de criar evento deixava marcar
uma sessão numa data/hora que já tinha passado. Não existia nenhuma
checagem no service — só o `min` do input de data no formulário, que é só
uma dica visual do navegador, fácil de burlar (ex: mudar a hora pra antes
de agora no mesmo dia, ou chamar a API direto). Corrigido no
`EventService.create_event`: rejeita com 400 se `starts_at` não for
estritamente no futuro, antes até de consultar o TMDb. Testado end-to-end
contra o backend de verdade antes de considerar corrigido.

