import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  experimental: {
    // 404 global: o app tem um layout raiz por área (público, admin, login)
    globalNotFound: true,
    // a foto vai junto com o formulário (até 1 MB, o limite do bucket), mais os outros campos
    serverActions: { bodySizeLimit: "2mb" },
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
