// Gera os ícones de atalho (tela inicial do celular) e o favicon a partir do logo.
// Uso (dentro de web/): node scripts/gerar-icones.mjs
// Rode de novo se o logo mudar.

import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const web = join(import.meta.dirname, "..");
const logo = join(web, "public/assets/logo-ilustracao.png");
// mesmo creme do themeColor dos layouts
const fundo = "#FFF4E3";

// ícone quadrado com fundo creme; o logo ocupa `ocupa` do lado
async function icone(destino, lado, ocupa) {
  const miolo = Math.round(lado * ocupa);
  const desenho = await sharp(logo).resize(miolo, miolo, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  await sharp({ create: { width: lado, height: lado, channels: 4, background: fundo } })
    .composite([{ input: desenho, gravity: "center" }])
    .flatten({ background: fundo })
    .png()
    .toFile(join(web, destino));
  console.log(destino);
}

mkdirSync(join(web, "public/icones"), { recursive: true });
// favicon e iPhone (o iPhone arredonda os cantos sozinho)
await icone("app/icon.png", 192, 0.84);
await icone("app/apple-icon.png", 180, 0.8);
// Android: normal e "maskable" (o sistema recorta em círculo ou gota; o logo fica na zona segura)
await icone("public/icones/icone-192.png", 192, 0.84);
await icone("public/icones/icone-512.png", 512, 0.84);
await icone("public/icones/icone-maskable-512.png", 512, 0.62);
