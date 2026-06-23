import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Imagem Docker de produção usa output standalone (menor e mais rápida).
  output: "standalone",
};

export default nextConfig;
