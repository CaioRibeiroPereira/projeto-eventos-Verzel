export function PageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-14">
      <h1 className="movie-title !text-2xl">{title}</h1>
      <div className="flex flex-col gap-4 leading-relaxed text-text-secondary">{children}</div>
    </main>
  );
}
