/* ============================================================
   Tipografia — Cinema clássico
   Par ativo: 1 · Marquise (Fraunces · Hanken Grotesk · Space Mono)
   Papéis: display = títulos de filme e números grandes
           sans    = corpo e toda a UI
           mono    = códigos de ingresso, labels técnicos
   Combina com tokens-cinema-classico.css.
   ============================================================ */

/* --- Carregamento das fontes (Par 1 ativo) ----------------- */
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Hanken+Grotesk:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');

/* Par 2 · Marquee clássico — descomente para trocar
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=DM+Sans:wght@400;500&family=DM+Mono&display=swap');
*/

/* Par 3 · Editorial moderno — descomente para trocar
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600&family=Hanken+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
*/

:root {
  /* --- Famílias (Par 1 ativo) ------------------------------ */
  --font-display: 'Fraunces', Georgia, 'Times New Roman', serif;
  --font-sans:    'Hanken Grotesk', system-ui, -apple-system, sans-serif;
  --font-mono:    'Space Mono', 'SF Mono', ui-monospace, monospace;

  /* Par 2 — troque as três linhas acima por estas:
  --font-display: 'Instrument Serif', Georgia, serif;
  --font-sans:    'DM Sans', system-ui, sans-serif;
  --font-mono:    'DM Mono', ui-monospace, monospace;
  */

  /* Par 3 — ou por estas:
  --font-display: 'Bricolage Grotesque', system-ui, sans-serif;
  --font-sans:    'Hanken Grotesk', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', ui-monospace, monospace;
  */

  /* --- Pesos (dois pesos de UI + display) ------------------ */
  --weight-regular:  400;
  --weight-medium:   500;
  --weight-display:  600;  /* só em títulos de filme */

  /* --- Escala de tamanhos / entrelinha --------------------- */
  --text-display:  2rem;      /* 32px · título de filme (herói)  */
  --leading-display: 1.1;
  --text-h1:      1.5rem;     /* 24px */
  --text-h2:      1.1875rem;  /* 19px */
  --text-h3:      1rem;       /* 16px */
  --leading-heading: 1.2;
  --text-body:    0.9375rem;  /* 15px · corpo e UI */
  --leading-body: 1.6;
  --text-label:   0.8125rem;  /* 13px · labels, metadados */
  --text-caption: 0.6875rem;  /* 11px · legendas, hints */
  --text-mono:    0.8125rem;  /* 13px · códigos */
}

/* ============================================================
   Aplicação sugerida (usa também tokens-cinema-classico.css)
   ============================================================ */

body {
  font-family: var(--font-sans);
  font-size: var(--text-body);
  line-height: var(--leading-body);
  font-weight: var(--weight-regular);
  color: var(--color-text);
  background: var(--color-bg);
}

/* Título de filme — o momento display do sistema */
.movie-title {
  font-family: var(--font-display);
  font-weight: var(--weight-display);
  font-size: var(--text-display);
  line-height: var(--leading-display);
  color: var(--color-text);
}

h1 { font-family: var(--font-sans); font-weight: var(--weight-medium); font-size: var(--text-h1); line-height: var(--leading-heading); }
h2 { font-family: var(--font-sans); font-weight: var(--weight-medium); font-size: var(--text-h2); line-height: var(--leading-heading); }
h3 { font-family: var(--font-sans); font-weight: var(--weight-medium); font-size: var(--text-h3); line-height: var(--leading-heading); }

/* Código do ingresso / labels técnicos */
.code, .ticket-code {
  font-family: var(--font-mono);
  font-size: var(--text-mono);
  letter-spacing: 0.04em;
  color: var(--color-accent);
}

.label   { font-size: var(--text-label);   color: var(--color-text-secondary); }
.caption { font-size: var(--text-caption); color: var(--color-text-muted); }

/* ============================================================
   Next.js — alternativa recomendada ao @import (mais rápido,
   sem flash). Em app/layout.tsx:

     import { Fraunces, Hanken_Grotesk, Space_Mono } from 'next/font/google';
     const display = Fraunces({ subsets:['latin'], variable:'--font-display' });
     const sans = Hanken_Grotesk({ subsets:['latin'], variable:'--font-sans' });
     const mono = Space_Mono({ subsets:['latin'], weight:['400','700'], variable:'--font-mono' });
     // <body className={`${display.variable} ${sans.variable} ${mono.variable}`}>
   Assim as variáveis --font-* já ficam disponíveis e este arquivo
   só precisa da escala de tamanhos e da aplicação (remova o @import).

   Tailwind v3 — em theme.extend.fontFamily:
     display: ['var(--font-display)'], sans: ['var(--font-sans)'], mono: ['var(--font-mono)']
   ============================================================ */