import { PageShell } from "@/components/page-shell";

const QUESTIONS = [
  {
    q: "Como escolho meu assento?",
    a: "Na página do filme, clique em \"Comprar ingresso\" e escolha um lugar disponível no mapa de assentos. Lugares ocupados aparecem desabilitados.",
  },
  {
    q: "Alguém pode pegar meu assento enquanto eu pago?",
    a: "Não. Assim que você reserva, o lugar fica travado para você durante o pagamento. Se o pagamento for recusado, ele volta a ficar disponível na hora.",
  },
  {
    q: "O pagamento é de verdade?",
    a: "Não, é uma simulação: você escolhe entre aprovar ou recusar o pagamento para ver os dois caminhos.",
  },
  {
    q: "Como recebo meu ingresso?",
    a: "Depois do pagamento aprovado, o ingresso com QR code aparece em \"Meus ingressos\".",
  },
  {
    q: "Posso compartilhar meu ingresso com outra pessoa?",
    a: "Sim, cada ingresso tem um link de compartilhamento que abre o ingresso sem precisar de login.",
  },
  {
    q: "Como funciona a validação na entrada?",
    a: "A portaria lê o QR code pela câmera ou digita o código manualmente. O sistema responde se o ingresso é válido, já foi usado, é de outro evento ou é inválido.",
  },
];

export default function FaqPage() {
  return (
    <PageShell title="Perguntas frequentes">
      {QUESTIONS.map((item) => (
        <div key={item.q} className="flex flex-col gap-1">
          <h2 className="text-text">{item.q}</h2>
          <p>{item.a}</p>
        </div>
      ))}
    </PageShell>
  );
}
