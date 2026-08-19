import { PerfilContent } from "@/components/perfil-content";

export default function PerfilPage() {
  return <PerfilContent fallbackLoginHref="/login?next=/perfil" />;
}
