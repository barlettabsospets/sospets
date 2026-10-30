import type { MetadataRoute } from "next";

// Atalho na tela inicial do celular ("Adicionar à tela inicial"). Ícones: scripts/gerar-icones.mjs
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SOS Pets DF Águas Claras",
    short_name: "SOS Pets",
    description: "Quanto o SOS Pets DF Águas Claras arrecadou, gastou e quantos pets ajudou, mês a mês.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF4E3",
    theme_color: "#FFF4E3",
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icones/icone-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
