// Fotos dos pets e das campanhas (Storage). Regras puras, sem navegador nem Supabase.

export type Bucket = "pets" | "campanhas";
export type TipoDeFoto = "image/webp" | "image/jpeg";

// Lado maior da foto guardada. A maior foto da tela tem uns 300 px de largura
// (cartão do catálogo); 1000 px cobre telas de densidade 3 sem pesar no 4G.
export const LADO_MAXIMO = 1000;
// O mesmo limite do bucket (migration 20261015130000_fotos.sql).
export const TAMANHO_MAXIMO = 1024 * 1024;

// Medidas da foto reduzida: o lado maior vira no máximo `maximo`, sem ampliar foto pequena.
export function medidasReduzidas(largura: number, altura: number, maximo = LADO_MAXIMO) {
  const escala = Math.min(1, maximo / Math.max(largura, altura));
  return { largura: Math.max(1, Math.round(largura * escala)), altura: Math.max(1, Math.round(altura * escala)) };
}

// Tipo da imagem pelos primeiros bytes (não confia no nome nem no tipo que o navegador diz).
export function tipoDaImagem(bytes: Uint8Array): TipoDeFoto | null {
  const texto = (inicio: number, fim: number) => String.fromCharCode(...bytes.subarray(inicio, fim));
  if (bytes.length >= 12 && texto(0, 4) === "RIFF" && texto(8, 12) === "WEBP") return "image/webp";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  return null;
}

// Nome do arquivo no bucket: um id novo a cada envio, então o endereço nunca muda de conteúdo.
export function nomeDaFoto(id: string, tipo: TipoDeFoto) {
  return `${id}.${tipo === "image/webp" ? "webp" : "jpg"}`;
}

// Endereço público da foto. `base` = NEXT_PUBLIC_SUPABASE_URL.
export function urlDaFoto(base: string, bucket: Bucket, caminho: string) {
  return `${base.replace(/\/+$/, "")}/storage/v1/object/public/${bucket}/${encodeURIComponent(caminho)}`;
}

// Ponto principal da foto: o que não pode ficar de fora quando o quadro corta a foto.
// Em porcentagem da largura (x) e da altura (y); 50/50 = centro (o padrão do banco).
export type Foco = { x: number; y: number };
export const FOCO_CENTRO: Foco = { x: 50, y: 50 };

const entre0e100 = (v: number) => Math.min(100, Math.max(0, Math.round(v)));

// Toque ou clique na foto mostrada inteira: posição em pixels → porcentagem.
export function focoDoToque(px: number, py: number, largura: number, altura: number): Foco {
  if (largura <= 0 || altura <= 0) return FOCO_CENTRO;
  return { x: entre0e100((px / largura) * 100), y: entre0e100((py / altura) * 100) };
}

// CSS object-position: com "x% y%", o ponto x%/y% da foto cai no mesmo x%/y% do quadro,
// então ele sempre fica dentro do quadro, qualquer que seja o formato.
export function posicaoDoFoco(foco: Foco) {
  return `${entre0e100(foco.x)}% ${entre0e100(foco.y)}%`;
}
