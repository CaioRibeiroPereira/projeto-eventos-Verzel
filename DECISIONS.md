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
