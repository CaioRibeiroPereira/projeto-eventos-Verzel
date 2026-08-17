import Link from "next/link";
import { BuildingIcon, GridIcon } from "@/components/icons";

export default function ParaEmpresasPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
      <div className="flex flex-col gap-3">
        <span className="label text-accent">Organizadores</span>
        <h1 className="movie-title !text-3xl">Para empresas</h1>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex gap-4 rounded-xl border border-border bg-surface-1 p-6">
          <BuildingIcon className="h-8 w-8 shrink-0 text-accent" />
          <p className="leading-relaxed text-text-secondary">
            Salas e produtoras de cinema podem usar o Cine Verzel para publicar sessões,
            montar o layout de assentos de cada sala e vender ingressos online, sem
            depender de planilha ou balcão físico para controlar lugares.
          </p>
        </div>

        <div className="flex gap-4 rounded-xl border border-border bg-surface-1 p-6">
          <GridIcon className="h-8 w-8 shrink-0 text-accent" />
          <p className="leading-relaxed text-text-secondary">
            Cada evento nasce a partir de um filme do catálogo, com o mapa de assentos
            gerado automaticamente a partir do layout que você desenhar — corredores
            incluídos.
          </p>
        </div>
      </div>

      <Link
        href="/registro"
        className="w-fit rounded-lg bg-accent px-6 py-3 font-medium text-on-accent hover:bg-accent-hover"
      >
        Criar uma conta de organizador
      </Link>
    </main>
  );
}
