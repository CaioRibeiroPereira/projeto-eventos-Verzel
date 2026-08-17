import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-6 py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-3 text-center sm:items-start sm:text-left">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>
      </div>
    </footer>
  );
}
