import { PageShell } from "@/components/page-shell";

export default function AcessibilidadePage() {
  return (
    <PageShell title="Acessibilidade">
      <p>
        A interface usa um tema escuro de alto contraste e formulários navegáveis por
        teclado. Na portaria, a leitura do ingresso por câmera sempre tem a digitação
        manual do código como alternativa, para quem não pode ou não quer usar a
        câmera.
      </p>
      <p>
        Se você encontrar uma barreira de acessibilidade em alguma tela, escreva para{" "}
        <span className="ticket-code">contato@cineverzel.com.br</span>.
      </p>
    </PageShell>
  );
}
