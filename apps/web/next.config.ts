import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Standalone só para Docker/Coolify; na Vercel o output é gerenciado pela plataforma.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
};

export default withNextIntl(nextConfig);
