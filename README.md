# Cine Verzel

Plataforma de eventos e ingressos para sessões de cinema. Um **organizador**
publica sessões a partir do catálogo do TMDb, o **cliente** reserva um lugar
num mapa de assentos, paga (de forma simulada) e recebe um ingresso com QR
que pode compartilhar por link, e a **portaria** valida o ingresso na
entrada — com leitura por câmera ou digitação manual.

Feito para o Desafio Elite Dev 2026.

- **O que foi entregue de cada requisito**: [CHECKLIST.md](CHECKLIST.md)
- **Decisões tomadas, o que foi descartado e por quê**: [DECISIONS.md](DECISIONS.md)
- **Uso de IA no desenvolvimento**: [seção mais abaixo](#uso-de-ia)

## Stack

- **Back-end**: Python 3.13, FastAPI, SQLModel (SQLAlchemy), Alembic
- **Banco**: PostgreSQL
- **Front-end**: Next.js 16 (App Router), TypeScript, TailwindCSS
- **Auth**: JWT com `role` (organizador / cliente / portaria)
- **API externa**: TMDb (catálogo de filmes)
- **Tempo real**: WebSocket nativo (mapa de assentos)

## Como rodar

### Opção A — Docker Compose (mais simples, sobe tudo com um comando)

Pré-requisito: Docker Desktop instalado e rodando.

```bash
cp backend/.env.example backend/.env
# edite backend/.env e preencha TMDB_API_KEY (veja "Chave do TMDb" abaixo)

docker compose up
```

Isso sobe banco, back-end (com migrations e seed já aplicados) e front-end:

- Front-end: http://localhost:3000
- Back-end / docs da API: http://localhost:8000/docs

### Opção B — Rodando local (sem Docker para o app, só para o banco)

Pré-requisitos: Python 3.13+, Node 20.9+, e um Postgres acessível (o mais
simples é subir só o banco via Docker: `docker compose up -d db`, que sobe
na porta `5433`).

**Back-end**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/Mac

pip install -r requirements.txt

cp .env.example .env
# edite .env e preencha TMDB_API_KEY

alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

**Front-end** (em outro terminal)

```bash
cd frontend
npm install
cp .env.local.example .env.local   # já aponta pra localhost:8000, não precisa editar

npm run dev
```

Front-end em http://localhost:3000, back-end em http://localhost:8000.

### Chave do TMDb

O catálogo de filmes usado pelo organizador vem da API do TMDb. Crie uma
conta gratuita em https://www.themoviedb.org/, gere uma chave em
**Configurações → API**, e preencha `TMDB_API_KEY` no `.env` do back-end.
Sem essa chave, a busca de filmes e o seed (que cria os eventos de exemplo
a partir de filmes reais) não funcionam.

### Rodando os testes

```bash
cd backend
pytest
```

Os testes de banco (garantias críticas) rodam contra um Postgres de teste
de verdade (`eventos_test`, criado automaticamente no mesmo servidor do
`docker-compose.yml`) — não SQLite/mock, porque a garantia de assento único
depende de um índice único **parcial**, sintaxe específica do Postgres.
Detalhes em [DECISIONS.md](DECISIONS.md#2026-08-19--testes-da-lógica-crítica-contra-postgres-de-verdade).

## Dados de teste (seed)

O seed roda automaticamente no `docker compose up` e no `python -m app.seed`
manual. Credenciais (senha igual para todos: `senha123`):

| Papel | Email |
|---|---|
| Organizador | `organizador@teste.com` |
| Organizador | `organizador2@teste.com` |
| Cliente | `cliente1@teste.com` |
| Cliente | `cliente2@teste.com` |
| Portaria | `portaria@teste.com` |

Também cria eventos publicados com assentos disponíveis e um histórico de
vendas simulado (ocupação variada entre as sessões), pra dar cara de
cenário real ao painel do organizador.

## Arquitetura

```
backend/app/
  api/routers/     # HTTP: recebe requisição, chama o service, devolve resposta
  services/        # regra de negócio (as garantias críticas vivem aqui)
  repositories/     # acesso ao banco
  models/          # tabelas (SQLModel)
  schemas/         # contratos de entrada/saída (Pydantic)
  core/            # auth, config, assinatura do QR, WebSocket
  integrations/    # cliente do TMDb, isolado do resto do app
```

O router só orquestra; quem decide é o service; quem persiste é o
repository. O cliente TMDb fica isolado em `integrations/` pra não acoplar
o resto do app ao formato da API externa.

## As três garantias críticas

Implementadas no banco, não em `if` de aplicação — ver
[CHECKLIST.md](CHECKLIST.md) e os testes em `backend/tests/`:

1. **Mesmo lugar não é vendido duas vezes**: índice único parcial
   `UNIQUE(event_id, seat_id) WHERE status != 'cancelled'` no Ticket. O
   banco recusa o segundo insert, dentro da mesma transação.
2. **QR não forjável**: assinatura HMAC-SHA256 do id do ingresso com um
   segredo que só o servidor conhece. A portaria recalcula e compara.
3. **Ingresso não validado duas vezes**: `UPDATE ticket SET status='used'
   ... WHERE status='valid' RETURNING *` — atômico. Voltou linha = validou
   agora; não voltou = já tinha sido usado.

## Uso de IA

O projeto foi conduzido por mim ao longo de toda a semana, com o
**Claude Code** (Anthropic) como ferramenta de apoio — não é um projeto
gerado de uma vez a partir do PDF do desafio. As decisões foram minhas; a
IA entrou em pontos específicos do processo:

- **Prospecção de bugs e erros em geral**: usei a IA pra investigar e caçar
  problemas ao longo do desenvolvimento — desde falhas pontuais até casos
  de borda que só apareciam testando o fluxo de verdade, como o [assento
  que ficava travado pra sempre quando uma reserva expirava sem
  pagamento](DECISIONS.md#2026-08-19--pagamento-na-hora-do-filme).
- **Programação da arquitetura**: a arquitetura em camadas (routers,
  services, repositories, models — regra de negócio isolada do resto) foi
  uma definição minha desde o início; a IA implementou o código em cima
  dela.
- **Estrutura e prospecção de testes**: me ajudou a pensar em quais
  garantias valiam a pena testar e como estruturar a suíte, priorizando
  provar as regras críticas do sistema em vez de perseguir cobertura por
  cobertura.
- **Testes unitários**: escreveu a suíte de testes automatizados do
  back-end (assinatura do QR, unicidade de assento, validação na portaria,
  cancelamento), rodando contra um banco de teste de verdade.
- **Apoio em segundo plano**: cuidou de subir e monitorar os servidores
  (back-end e front-end) rodando em background enquanto eu seguia testando
  e ajustando o projeto.
- **Configuração do Docker**: montou o Docker Compose completo (banco,
  back-end e front-end) e os Dockerfiles.
- **Deploy**: ajudou a resolver a configuração e as pendências pra publicar
  a aplicação.
- **Busca de informações**: usei como fonte de consulta rápida durante o
  desenvolvimento.

O [DECISIONS.md](DECISIONS.md) registra o processo com mais detalhe,
decisão por decisão, com data e o porquê.

Vale registrar também: boa parte dos commits saiu com um trailer
`Co-Authored-By: Claude Sonnet 5` no final da mensagem, sem eu ter reparado
nisso na hora. Removido depois — histórico reescrito e republicado sem essa
linha em nenhum commit (detalhe em
[DECISIONS.md](DECISIONS.md#2026-08-20--removido-o-trailer-de-co-autoria-da-ia-dos-commits)).

## Deploy

_(a preencher)_

## Fora de escopo (por decisão do desafio)

Nota fiscal, revenda de ingresso entre usuários, aplicativo nativo,
recuperação de senha e envio de ingresso por e-mail — nenhum desses
pontua no desafio e foram deixados de fora de propósito.

## Limitações conhecidas

- O mapa de assentos em tempo real usa um WebSocket com conexões em
  memória, por processo — funciona bem para esta aplicação (um único
  processo de back-end), mas não escalaria para múltiplas instâncias sem
  um pub/sub compartilhado (Redis, por exemplo). Também não reconecta
  automaticamente se a conexão cair; o mapa continua funcionando do jeito
  tradicional (atualiza ao recarregar a página).
