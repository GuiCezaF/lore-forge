import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Imagem Docker de produção usa output standalone (menor e mais rápida).
  output: "standalone",
};

export default withNextIntl(nextConfig);
