import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export default function ContatoPage() {
  return (
    <PageShell title="Contato">
      <p>
        Dúvidas, sugestões ou problemas com um ingresso? Escreva para{" "}
        <span className="ticket-code">contato@cineverzel.com.br</span>.
      </p>
      <p>
        Para questões de parceria ou sessões corporativas, veja a página de{" "}
        <Link href="/para-empresas" className="text-accent hover:underline">
          para empresas
        </Link>
        .
      </p>
    </PageShell>
  );
}
