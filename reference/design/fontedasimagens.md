# Imagens — fontes livres e uso com IA (Claude Code)

## Contexto: onde cada imagem vem

A maior parte da imagem do app **já vem do TMDb** — pôster e backdrop de cada filme
(`https://image.tmdb.org/t/p/{tamanho}{caminho}`). Stock/genérica entra só para preencher
o resto:

| Necessidade                     | Fonte recomendada        | Por quê |
|---------------------------------|--------------------------|---------|
| Pôster / backdrop de filme      | **TMDb**                 | Já é a fonte oficial do catálogo |
| Avatar dos usuários (seed)      | **DiceBear**             | Determinístico por seed, sem chave, MIT |
| Placeholder em dev / seed       | **Lorem Picsum**         | Sem chave, determinístico por seed |
| Fundo de hero / imagem real     | **Unsplash** ou **Pexels** | Curadas, alta qualidade (precisa chave) |
| Ilustração de estado vazio      | **unDraw**               | SVG recolorável para o âmbar da paleta |

## As fontes

| Fonte        | Bom para                     | Chave? | Atribuição | Base |
|--------------|------------------------------|--------|-----------|------|
| DiceBear     | Avatares determinísticos     | Não    | API é MIT (ver nota) | `api.dicebear.com/10.x/{estilo}/svg?seed={seed}` |
| Lorem Picsum | Placeholders de dev          | Não    | Não        | `picsum.photos/seed/{seed}/{w}/{h}` |
| Unsplash     | Fotos reais curadas          | Sim    | **Exigida** (fotógrafo + Unsplash) | `api.unsplash.com/search/photos` |
| Pexels       | Fotos reais                  | Sim    | Não (apreciada) | `api.pexels.com/v1/search` |
| Pixabay      | Fotos + vetores              | Sim    | Não        | `pixabay.com/api/` |
| unDraw       | Ilustrações (estados vazios) | Não    | Não        | `undraw.co` (baixar SVG) |
| Openverse    | Agregador CC / domínio público | Não  | Varia por item | `api.openverse.org` |

Notas de licença (para o README poder afirmar a origem livre):
- **Unsplash** — uso comercial livre, mas as guidelines da API exigem creditar o
  fotógrafo e o Unsplash, e disparar o endpoint de "download". Bom para buscar/baixar
  no build, não para chamar ao vivo (limite de 50 req/h no modo demo).
- **Pexels / Pixabay / Lorem Picsum** — uso livre sem atribuição obrigatória.
- **DiceBear** — a API é MIT, mas *alguns estilos individuais* são CC BY 4.0 (pedem
  crédito ao artista). Escolha um estilo MIT/CC0 ou credite o artista no README.
- **Lorem Picsum** — as imagens vêm do Unsplash; use só como placeholder de
  desenvolvimento, não como arte final.
- **Openverse / Wikimedia** — licença varia por item; sempre checar antes de usar.

## URLs sem chave (usáveis já, sem configurar nada)

Avatar determinístico por usuário (seed = email ou id):
```
https://api.dicebear.com/10.x/thumbs/svg?seed=cliente1@email.com
https://api.dicebear.com/10.x/shapes/svg?seed=organizador@email.com
```
(estilos sugeridos, neutros e sem rosto: `thumbs`, `shapes`, `identicon`, `glass`)

Placeholder determinístico (mesma seed = mesma imagem):
```
https://picsum.photos/seed/evento-42/800/1200      # pôster fake em dev
https://picsum.photos/seed/local-3/1200/400        # foto de local fake
```

## Como o Claude Code deve ESCOLHER imagem sob demanda

Quando eu pedir uma imagem ("põe um fundo de hero de cinema", "uma foto de sala de
cinema para o card X"), siga este protocolo:

1. **Prefira sem chave quando for placeholder/avatar** → use DiceBear ou Lorem Picsum
   direto pela URL, sem pedir nada.
2. **Para foto real curada** → use a API do Unsplash (ou Pexels) assim:
   - Busque: `GET https://api.unsplash.com/search/photos?query={termo}&per_page=5`
     com header `Authorization: Client-ID ${UNSPLASH_ACCESS_KEY}`.
   - Escolha o primeiro resultado coerente com a paleta escura/quente (evite fotos
     muito claras ou saturadas que briguem com o tema).
   - Guarde a URL `urls.regular`, **e também** `user.name` + `links.html` para a
     atribuição, e dispare `links.download_location` (exigência do Unsplash).
   - Nunca hardcode a imagem: salve a URL escolhida numa constante/config ou no seed,
     e me mostre qual você pegou para eu aprovar.
3. **Não invente URLs de imagem.** Só use URLs que vieram de uma resposta real da API
   ou os padrões determinísticos acima.
4. **Registre a origem.** Toda imagem real usada entra numa lista de créditos no
   README (fonte, autor, link), para sustentar a afirmação de uso livre.

## Variáveis de ambiente (só se usar as APIs com chave)

```
UNSPLASH_ACCESS_KEY=...     # unsplash.com/developers → New Application
PEXELS_API_KEY=...          # pexels.com/api
PIXABAY_API_KEY=...         # pixabay.com/api/docs
```
Pegue a chave no site de cada uma (grátis, instantâneo). Deixe-as no `.env`, nunca no
código. Se nenhuma chave estiver configurada, caia para Lorem Picsum/DiceBear
automaticamente, para o app nunca ficar sem imagem.

## Sugestão de uso no projeto

- Usuários semeados → DiceBear (determinístico, zero setup, roda offline).
- Enquanto desenvolve → Lorem Picsum nos lugares que ainda não têm imagem real.
- Hero da home e páginas institucionais → uma ou duas fotos do Unsplash, baixadas e
  servidas localmente (evita depender do limite de 50 req/h em produção).
- Estados vazios ("nenhum evento", "carrinho vazio") → ilustração unDraw recolorida
  para o âmbar `#EAB14C` da paleta — detalhe que tira o app do genérico.