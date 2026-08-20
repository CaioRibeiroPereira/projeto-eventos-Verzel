import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" só faz sentido pra imagem Docker (self-host); no Vercel
  // quebra o build (ele já tem o próprio pipeline de bundling e espera a
  // saída padrão do .next, não a standalone) — por isso é condicional,
  // ligado só quando o Dockerfile builda com DOCKER_BUILD=true.
  output: process.env.DOCKER_BUILD ? "standalone" : undefined,
};

export default nextConfig;
