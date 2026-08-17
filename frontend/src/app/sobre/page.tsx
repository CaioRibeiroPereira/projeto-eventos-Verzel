import { PageShell } from "@/components/page-shell";

export default function SobrePage() {
  return (
    <PageShell title="Sobre">
      <p>
        O Cine Verzel é uma plataforma de eventos de cinema: o organizador escolhe um
        filme do catálogo, define sala, horário e preço, e monta o mapa de assentos da
        sessão. O cliente navega pelos filmes em cartaz, escolhe o lugar num mapa
        visual e recebe o ingresso com QR code na hora.
      </p>
      <p>
        Na entrada, a portaria valida o ingresso lendo o QR pela câmera ou digitando o
        código manualmente, com retorno claro sobre a validade — evitando filas
        confusas e ingressos duplicados.
      </p>
    </PageShell>
  );
}
