import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export default function ParceriasPage() {
  return (
    <PageShell title="Parcerias">
      <p>
        Buscamos parcerias com salas de cinema, distribuidoras e provedores de
        catálogo de filmes para ampliar a variedade de sessões disponíveis na
        plataforma.
      </p>
      <p>
        Se você representa uma sala, uma rede de cinemas ou tem interesse em integrar
        seu catálogo, fale com a gente pela página de{" "}
        <Link href="/contato" className="text-accent hover:underline">
          contato
        </Link>
        .
      </p>
    </PageShell>
  );
}
