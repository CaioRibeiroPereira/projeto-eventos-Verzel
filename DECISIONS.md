# Decisões do projeto (rascunho)

Log cru de decisões tomadas ao longo do desenvolvimento, para virar a seção de
decisões do README na Fase 6. Uma entrada por decisão, com data e porquê.

## 2026-08-15 — Quem pode se autocadastrar

Registro público permite **Cliente** e **Organizador**. **Portaria** não tem
autocadastro — é sempre provisionada via seed (conta de equipe interna, não
faria sentido alguém se autopromover a validador de ingresso).

O PDF do desafio não especifica como cada papel é provisionado, só que os 3
papéis existem e que o seed precisa ter 1 organizador, 2 clientes e 1 usuário
de portaria.

## 2026-08-17 — Nome da plataforma

O cinema/plataforma se chama **Cine Verzel**. Usado na logo, no header e no
rodapé.

## 2026-08-17 — Escopo fica só em cinema por enquanto

Cogitamos expandir para teatro, dança e concertos via Ticketmaster
Discovery API (o PDF permite isso). Decidimos adiar: o prazo é curto
(entrega 21/08) e ainda faltava fechar a Fase 6 (seed, README, deploy).
Fica como possível próximo passo, não como parte do escopo atual.

## 2026-08-17 — Fluxo de compra em duas etapas

A página do evento vira uma página "sobre o filme" (sinopse, gênero,
duração, pôster, backdrop) pública, sem mapa de assentos. Só depois que o
cliente clica em comprar — e está logado como cliente — é que o mapa de
assentos aparece, numa rota separada (`/eventos/[id]/reservar`). Antes, o
mapa aparecia direto na página do filme, mesmo para visitantes deslogados,
o que não fazia sentido: primeiro se decide pelo filme, depois se loga,
depois se escolhe o lugar.
