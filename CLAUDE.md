# Plataforma de Eventos e Ingressos — Contexto do Projeto

## O que é

Desafio técnico: uma Plataforma de Eventos e Ingressos. Um **organizador** publica
eventos a partir de um catálogo externo; um **cliente** compra ingressos com QR; a
**portaria** valida o ingresso na entrada.

## Importante
sempre lê o arquivo: reference/docs/Desafio-Elite-Dev-2026.pdf


## Critério de avaliação (leia isto antes de qualquer decisão)

O desafio é avaliado por **profundidade e decisões visíveis**, não por volume. O
enunciado avisa explicitamente contra "AI slop": interface genérica que ninguém
escolheu. Prefira o **fluxo inteiro completo e polido** a features ambiciosas pela
metade. Regra de ouro: nunca corte o fluxo completo nem os três requisitos críticos
abaixo; corte profundidade de telas secundárias se faltar tempo.

## Stack (travada — não sugira alternativas)

- **Back-end:** Python + FastAPI, SQLModel (SQLAlchemy por baixo), Alembic p/ migrations
- **Banco:** PostgreSQL
- **Front-end:** React + Next.js (App Router), TypeScript, TailwindCSS
- **Auth:** JWT carregando o `role`; dependencies do FastAPI como guards por papel
- **API externa:** TMDb (filmes) — cliente isolado em `integrations/`
- **Deploy:** front na Vercel, API no Render/Railway, Postgres no Neon/Supabase

## Forma do produto (travada)

Sessões de cinema. O organizador escolhe um **filme do catálogo TMDb**, define data,
sala, preço e o **layout de assentos**. O cliente reserva escolhendo o **lugar num
mapa de assentos**. O mapa de assentos é o componente-herói do projeto — é onde a UI
impressiona e onde vive a regra de "não vender o mesmo lugar duas vezes".

Pista/quantidade (Ticketmaster) fica FORA de escopo salvo instrução explícita.

## Modelo de dados

- **User** — id, nome, email, senha (hash), `role` (organizer | customer | gate)
- **Event** — id, organizer_id, `tmdb_movie_id`, título/pôster cacheados, local,
  `starts_at`, preço, `status` (draft | published)
- **Seat** — id, event_id, `label` (ex: "A12"). Gerados na criação do evento a partir
  do layout. Assento é LINHA no banco (não JSON) — é isso que habilita a constraint.
- **Reservation** — id, customer_id, event_id, `status` (pending | paid | failed |
  cancelled), total, `expires_at` (segura o lugar durante o pagamento)
- **Ticket** — id, reservation_id, event_id, seat_id, `qr_signature`, `share_token`,
  `status` (valid | used | cancelled), used_at, validated_by

## Os três requisitos críticos (o coração do desafio)

Implemente as garantias no BANCO, não em `if` de aplicação:

1. **Não vender o mesmo lugar 2x** → `UNIQUE(event_id, seat_id)` no Ticket, dentro de
   uma transação. O banco recusa o segundo insert.
2. **QR infalsificável** → `qr_signature = HMAC(ticket_id, SECRET)`. O QR carrega isso;
   a portaria recalcula e compara. Sem o segredo, ninguém forja. (`hmac`/`itsdangerous`)
3. **Não validar 2x** → `UPDATE ticket SET status='used', used_at=now() WHERE id=? AND
   status='valid' RETURNING *`. Voltou linha = validou agora; não voltou = já usado.
   Atômico, sem corrida.

Retornos da portaria, claros e distintos: **válido / inválido / já utilizado / evento
errado** (compare `ticket.event_id` com o evento sendo escaneado).

Compartilhar ingresso → `share_token` abre uma rota pública que renderiza o ingresso.

## Arquitetura (camadas — regra de negócio não vaza)

```
app/
  api/routers/     # HTTP apenas: orquestra, não decide
  services/        # regras de negócio (os 3 requisitos críticos vivem aqui)
  repositories/    # acesso a dados
  models/          # tabelas SQLModel
  schemas/         # contratos Pydantic (entrada/saída)
  core/            # auth, config, segurança do QR (HMAC)
  integrations/    # cliente TMDb isolado
```

O router só orquestra. O service decide. O repository persiste. Cliente TMDb sempre
isolado em `integrations/` para não acoplar o resto ao formato da API externa.

## Matriz de papéis

| Ação                          | organizer | customer | gate |
|-------------------------------|:---------:|:--------:|:----:|
| Criar/gerenciar eventos       |     ✓     |          |      |
| Listar/buscar eventos públicos|     ✓     |    ✓     |  ✓   |
| Reservar / pagar / ver ingresso|          |    ✓     |      |
| Validar ingresso na portaria  |           |          |  ✓   |

## Dados de seed (obrigatórios — o avaliador percorre o fluxo sem montar do zero)

- 1 organizador, 2 clientes, 1 usuário de portaria (credenciais no README)
- Ao menos 1 evento **publicado** com assentos disponíveis
- Documente todas as credenciais de teste no README

## Como quero que você trabalhe

- **Trabalhe em fases, não one-shot.** Antes de codar cada fase, me mostre um plano
  curto e espere meu ok.
- **Commits descritivos e frequentes**, um por passo lógico. O histórico é avaliado.
- **Pergunte antes de decidir qualquer coisa de produto ou visual.** Se uma escolha de
  UX, cópia ou identidade aparecer, PARE e me pergunte — não escolha por mim.

## Ordem de execução (siga à risca)

**Regra que domina tudo:** só inicie uma fase com a anterior TERMINADA. Nunca comece um
opcional antes do fluxo obrigatório (fases 1–6) estar rodando ponta a ponta. Se o tempo
apertar, corte de trás pra frente — os últimos itens são os de maior custo e menor
obrigatoriedade, então o corte nunca dói no que importa.

### Fluxo obrigatório (fluxo primeiro, profundidade depois)

1. Esqueleto + auth (3 papéis) + `docker-compose` com Postgres local + deploy vazio no ar
2. Organizador cria evento a partir do TMDb + listagem pública **com busca e filtro**
   *(busca/filtro e painel do organizador já são requisitos — cobrem 2 opcionais de brinde)*
3. Reserva + mapa de assentos + pagamento simulado (com o caminho de RECUSA também)
4. Ingresso + QR + "meus ingressos" + compartilhamento por link
5. Portaria (câmera + digitação manual, os 4 retornos) + as garantias de concorrência
6. Seed + README + polish da UI

### Opcionais (só depois da fase 6, cada um TERMINADO antes do próximo)

7. **Docker Compose completo** — estender o compose da fase 1 para subir a app inteira
   (front + API + banco) com um comando. Feito cedo porque facilita todo o resto.
8. **Cancelamento com devolução ao estoque** — muda status da reserva e libera o assento
   numa transação. Completa o ciclo de vida do ingresso.
9. **Testes** da lógica crítica: assinatura do QR, unicidade do assento, validação única
   na portaria, e cancelamento devolvendo ao estoque. Não perseguir cobertura — provar as
   garantias. (Depois do item 8, para já cobrir o cancelamento.)
10. **Mapa de assentos em tempo real** (websockets): propagar "assento ocupado" ao vivo
    para todos na tela. É o mais impressionante e o de maior risco — isolado por último de
    propósito. Mesmo sem ele, deixe o feedback de "assento acabou de ser ocupado" desenhado.
11. **Aplicação publicada** — fecho final, com tudo pronto pra plugar (ver deploy adiado).

### Não fazer (da lista do PDF)

Nota fiscal, revenda entre usuários, app nativo, recuperação de senha, envio por e-mail.
Não toque em nenhum — não pontuam e tiram foco do que pontua.

## O que é MEU (não decida por mim)

- Identidade visual (paleta, tipografia, tom) — vem do brief de UI separado
- Textos/cópia da interface
- O README de decisões (o que escolhi, o que descartei, e por quê)

## Definition of Done (checklist dos requisitos funcionais)

- [ ] Navegação + busca de eventos publicados (data, local, preço)
- [ ] Organizador cria/gerencia eventos a partir do catálogo TMDb
- [ ] Reserva com seleção de lugar no mapa de assentos
- [ ] Pagamento simulado: confirmação E recusa
- [ ] "Meus ingressos" com QR
- [ ] Portaria: válido / inválido / já utilizado / evento errado
- [ ] Leitura do QR por câmera + digitação manual como alternativa
- [ ] 3 papéis com auth
- [ ] Persistência de eventos, reservas e ingressos
- [ ] Mesmo lugar não vendido 2x
- [ ] QR não forjável
- [ ] Compartilhamento por link
- [ ] Mesmo ingresso não validado 2x
- [ ] Seed completo + README detalhado + seção de uso de IA

### Opcionais (todos planejados — ver ordem de execução)

- [ ] Busca e filtro de eventos *(já coberto pelo obrigatório)*
- [ ] Painel do organizador *(já coberto pelo obrigatório)*
- [ ] Docker Compose subindo a app inteira
- [ ] Cancelamento com devolução ao estoque
- [ ] Testes da lógica crítica
- [ ] Mapa de assentos em tempo real
- [ ] Aplicação publicada
