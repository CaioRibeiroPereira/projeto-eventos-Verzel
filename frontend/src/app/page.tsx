import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="movie-title">Esqueleto do projeto</h1>
      <p className="label max-w-md">
        Frontend Next.js conectado à paleta e tipografia de{" "}
        <code className="code">reference/design/</code>. Telas reais entram
        nas próximas fases.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover"
        >
          Entrar
        </Link>
        <Link
          href="/registro"
          className="rounded border border-border px-4 py-2 text-text-secondary hover:border-accent hover:text-accent"
        >
          Criar conta
        </Link>
      </div>
    </main>
  );
}
