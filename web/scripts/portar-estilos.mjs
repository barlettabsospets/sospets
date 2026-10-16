// Copia os CSS do protótipo para app/estilos/, sem mudar as regras.
// Uso: node scripts/portar-estilos.mjs
//
// - tokens.css do protótipo NÃO é copiado: as variáveis (com as trocas do tema v4 e do publico.css)
//   ficam em app/estilos/tokens.css, no @theme do Tailwind.
// - Os blocos :root e @font-face saem dos arquivos copiados (já estão em tokens.css).
// - url(assets/...) vira url(/assets/...), servido de public/assets.
// - Ajustes do app vão em app/estilos/ajustes.css, nunca nos arquivos gerados.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const prototipo = join(raiz, "..", "sospets-design", "sospets-kit", "design");
const destino = join(raiz, "app", "estilos");

// arquivo do protótipo → arquivo no app, na ordem em que o protótipo carrega
const ARQUIVOS = [
  ["styles.css", "base.css"],
  ["theme4.css", "tema.css"],
  ["publico.css", "publico.css"],
  ["transparencia.css", "transparencia.css"],
  ["animais.css", "animais.css"],
  ["despesas.css", "despesas.css"],
  ["admin.css", "admin.css"],
];

// remove blocos ":root { ... }" de primeiro nível (sem chaves aninhadas)
const semRoot = (css) => css.replace(/^:root\s*\{[^{}]*\}\s*\n?/gm, "");

const variaveisUsadas = new Set();
const variaveisDefinidas = new Set();

for (const [origem, alvo] of ARQUIVOS) {
  let css = readFileSync(join(prototipo, origem), "utf8");
  css = css.replace(/^@font-face\s*\{[^}]*\}\s*\n?/gm, "");
  css = semRoot(css);
  css = css.replace(/url\(\s*(['"]?)assets\//g, "url($1/assets/");
  if (/^:root/m.test(css)) throw new Error(`${origem}: sobrou um :root que o script não removeu`);

  for (const m of css.matchAll(/var\(\s*(--[\w-]+)/g)) variaveisUsadas.add(m[1]);
  for (const m of css.matchAll(/(--[\w-]+)\s*:/g)) variaveisDefinidas.add(m[1]);

  const cabecalho = `/* Gerado por scripts/portar-estilos.mjs a partir de sospets-design/sospets-kit/design/${origem}.\n   Não edite: ajustes do app vão em ajustes.css. */\n`;
  writeFileSync(join(destino, alvo), cabecalho + css);
}

// toda variável usada precisa existir em tokens.css ou no próprio CSS
const tokens = readFileSync(join(destino, "tokens.css"), "utf8");
for (const m of tokens.matchAll(/(--[\w-]+)\s*:/g)) variaveisDefinidas.add(m[1]);
const faltando = [...variaveisUsadas].filter((v) => !variaveisDefinidas.has(v));
if (faltando.length) throw new Error(`Variáveis sem definição em tokens.css: ${faltando.join(", ")}`);

console.log(`${ARQUIVOS.length} arquivos copiados para app/estilos/; ${variaveisUsadas.size} variáveis conferidas.`);
