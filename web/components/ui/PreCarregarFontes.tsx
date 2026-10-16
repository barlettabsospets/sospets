import { preload } from "react-dom";

// Fontes do primeiro desenho da página (títulos e texto), para não piscar a troca de fonte.
const FONTES = [
  "/assets/fonts/nunito-latin-600-normal.woff2",
  "/assets/fonts/nunito-latin-800-normal.woff2",
  "/assets/fonts/fraunces-latin-700-normal.woff2",
];

export function PreCarregarFontes() {
  for (const href of FONTES) preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return null;
}
