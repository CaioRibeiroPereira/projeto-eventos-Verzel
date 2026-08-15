/* ============================================================
   Paleta A — Cinema clássico
   Escuro e quente, sensação de sala de cinema.
   Base: fundo #12100E · superfície #1C1815 · texto #F4ECDE
         âmbar #EAB14C · vermelho #C1442F
   Tema escuro. Cole em :root e use as variáveis --color-*.
   ============================================================ */

:root {
  /* --- Escala: noite (neutros quentes) --------------------- */
  --noite-50:  #F4ECDE;  /* texto / creme */
  --noite-100: #E7DCC8;
  --noite-200: #D2C4A9;
  --noite-300: #B4A588;  /* texto secundário */
  --noite-400: #93866B;
  --noite-500: #726550;  /* texto muted */
  --noite-600: #574B39;
  --noite-700: #3E3529;  /* borda forte */
  --noite-800: #2C251C;  /* borda / superfície elevada */
  --noite-850: #221D16;
  --noite-900: #1C1815;  /* superfície */
  --noite-950: #12100E;  /* fundo */

  /* --- Escala: âmbar (marquise / acento primário) ---------- */
  --ambar-50:  #FBF4E1;
  --ambar-100: #F7E7BD;
  --ambar-200: #F2D392;
  --ambar-300: #EEC468;  /* hover no escuro */
  --ambar-400: #EAB14C;  /* base — acento */
  --ambar-500: #D69A34;
  --ambar-600: #B27C22;
  --ambar-700: #8C6018;
  --ambar-800: #664511;
  --ambar-900: #422C0A;

  /* --- Escala: vermelho (poltrona / acento 2 + erro) ------- */
  --vermelho-50:  #F8E6E1;
  --vermelho-100: #EFC3B7;
  --vermelho-200: #E29B8A;
  --vermelho-300: #D2705B;
  --vermelho-400: #CB5741;  /* hover no escuro */
  --vermelho-500: #C1442F;  /* base */
  --vermelho-600: #A2371F;
  --vermelho-700: #7D2A17;
  --vermelho-800: #591F10;
  --vermelho-900: #3A140A;

  /* --- Escala: verde-tela (sucesso, quente p/ combinar) ---- */
  --verde-100: #C3DEA3;
  --verde-200: #9BC96A;  /* texto de sucesso no escuro */
  --verde-400: #6FA043;  /* fill */
  --verde-600: #4C7029;
  --verde-900: #1B2713;  /* bg-success */

  /* ============================================================
     Tokens de propósito (é isto que a UI consome)
     ============================================================ */

  /* Superfícies */
  --color-bg:          var(--noite-950);
  --color-surface-1:   var(--noite-900);
  --color-surface-2:   var(--noite-850);
  --color-surface-3:   var(--noite-800);

  /* Bordas */
  --color-border:        var(--noite-800);
  --color-border-strong: var(--noite-700);

  /* Texto */
  --color-text:           var(--noite-50);
  --color-text-secondary: var(--noite-300);
  --color-text-muted:     var(--noite-500);

  /* Acento primário (âmbar) */
  --color-accent:       var(--ambar-400);
  --color-accent-hover: var(--ambar-300);
  --color-on-accent:    var(--noite-950);  /* texto sobre âmbar: escuro */

  /* Acento secundário (vermelho) */
  --color-red:       var(--vermelho-500);
  --color-red-hover: var(--vermelho-400);
  --color-on-red:    var(--noite-50);

  /* Semânticos */
  --color-bg-success:     var(--verde-900);
  --color-text-success:   var(--verde-200);
  --color-border-success: var(--verde-600);

  --color-bg-warning:     #2A200E;
  --color-text-warning:   var(--ambar-200);
  --color-border-warning: var(--ambar-700);

  --color-bg-danger:      #2C130D;
  --color-text-danger:    var(--vermelho-200);
  --color-border-danger:  var(--vermelho-700);

  /* ============================================================
     Mapa de assentos (componente-herói) — estados
     ============================================================ */
  --seat-available-bg:     transparent;
  --seat-available-border: var(--noite-600);
  --seat-available-text:   var(--noite-300);

  --seat-selected-bg:      var(--ambar-400);
  --seat-selected-text:    var(--noite-950);

  --seat-occupied-bg:      var(--noite-850);
  --seat-occupied-text:    var(--noite-600);  /* baixo contraste = indisponível */

  --seat-just-taken-bg:    var(--vermelho-500);  /* flash "acabou de ocupar" */
  --seat-just-taken-text:  var(--noite-50);
}

/* ============================================================
   Como usar
   ------------------------------------------------------------
   Direto no CSS:
     background: var(--color-bg);
     color: var(--color-text);
     .btn-primary { background: var(--color-accent); color: var(--color-on-accent); }

   Tailwind v4 — importe este arquivo e mapeie em @theme:
     @theme {
       --color-bg:        var(--color-bg);
       --color-accent:    var(--color-accent);
       ...
     }
     depois use: class="bg-bg text-accent"

   Tailwind v3 — em tailwind.config.js, theme.extend.colors:
     noite:    { 50:'#F4ECDE', 100:'#E7DCC8', ... 950:'#12100E' }
     ambar:    { 50:'#FBF4E1', ... 900:'#422C0A' }
     vermelho: { 50:'#F8E6E1', ... 900:'#3A140A' }
   ============================================================ */