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
