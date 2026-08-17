import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export default function ParaEmpresasPage() {
  return (
    <PageShell title="Para empresas">
      <p>
        Salas e produtoras de cinema podem usar o Cine Verzel para publicar sessões,
        montar o layout de assentos de cada sala e vender ingressos online, sem
        depender de planilha ou balcão físico para controlar lugares.
      </p>
      <p>
        Cada evento nasce a partir de um filme do catálogo, com o mapa de assentos
        gerado automaticamente a partir do layout que você desenhar — corredores
        incluídos.
      </p>
      <p>
        <Link href="/registro" className="text-accent hover:underline">
          Criar uma conta de organizador
        </Link>
      </p>
    </PageShell>
  );
}
