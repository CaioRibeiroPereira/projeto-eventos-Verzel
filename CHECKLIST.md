# Checklist do desafio

Status do que foi pedido no PDF do desafio, marcado conforme o que está
implementado e testado. O porquê de cada decisão está no [DECISIONS.md](DECISIONS.md).

## Requisitos funcionais

- [x] Navegação e busca pelos eventos publicados, com data, local e preço
- [x] Criação e gerenciamento dos eventos pelo organizador, a partir do catálogo TMDb
- [x] Reserva com seleção de lugar num mapa de assentos (cinema)
- [x] Pagamento simulado, com confirmação e recusa
- [x] "Meus ingressos", com o ingresso e o código em QR
- [x] Portaria: válido / inválido / já utilizado / evento errado
- [x] Leitura do QR pela câmera, com digitação manual como alternativa
- [x] Autenticação com os três papéis: organizador, cliente e portaria
- [x] Armazenamento de eventos, reservas e ingressos
- [x] Garantia de que o mesmo lugar não é vendido duas vezes (constraint no banco)
- [x] QR com código que não pode ser forjado (assinatura HMAC)
- [x] Compartilhamento de ingresso por link
- [x] Garantia de que o mesmo ingresso não é validado duas vezes (update atômico)
- [x] Cobrança simulada, sem transação financeira real
- [x] Dados de teste semeados: 2 organizadores, clientes, portaria e eventos publicados com ingressos disponíveis
- [ ] README detalhado com passo a passo e seção de uso de IA

## Opcionais

- [x] Busca e filtro de eventos
- [x] Painel do organizador (com dashboard: métricas e gráficos de ocupação/vendas)
- [x] Cancelamento com devolução ao estoque — de reserva individual e de evento inteiro
- [x] Docker Compose subindo a aplicação inteira (front + API + banco)
- [x] Testes automatizados da lógica crítica
- [x] Mapa de assentos em tempo real (websockets)
- [ ] Aplicação publicada

## Além do pedido

- Pagamento na hora do filme: cliente escolhe pagar na entrada, o ingresso já
  sai com QR, e a portaria cobra e libera a entrada numa ação só
- Portaria cobre várias sessões ao mesmo tempo, com filtro por data e desfazer
  de validação errada
- Dois organizadores no seed, deixando claro que o sistema suporta vários
