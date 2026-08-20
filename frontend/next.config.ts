import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera um build standalone (.next/standalone) com só os arquivos e
  // dependências necessários pra rodar — usado pela imagem Docker.
  output: "standalone",
};

export default nextConfig;
