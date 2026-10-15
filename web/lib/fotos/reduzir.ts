import { medidasReduzidas, TAMANHO_MAXIMO } from "@/lib/dominio/fotos";

// Reduz a foto no navegador antes de enviar: lado maior de até 1000 px, em WebP
// (ou JPEG onde o navegador não gera WebP, como o Safari). Redesenhar no canvas
// descarta os dados escondidos da foto, inclusive a localização.
export async function reduzirFoto(arquivo: Blob): Promise<Blob> {
  const imagem = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
  try {
    const { largura, altura } = medidasReduzidas(imagem.width, imagem.height);
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Sem canvas.");
    // fundo branco: no JPEG, a parte transparente de um PNG ficaria preta
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, largura, altura);
    ctx.drawImage(imagem, 0, 0, largura, altura);

    for (const qualidade of [0.82, 0.7, 0.55]) {
      const webp = await gerar(canvas, "image/webp", qualidade);
      const foto = webp?.type === "image/webp" ? webp : await gerar(canvas, "image/jpeg", qualidade);
      if (foto && foto.size <= TAMANHO_MAXIMO) return foto;
    }
    throw new Error("Foto grande demais.");
  } finally {
    imagem.close();
  }
}

const gerar = (canvas: HTMLCanvasElement, tipo: string, qualidade: number) =>
  new Promise<Blob | null>((ok) => canvas.toBlob(ok, tipo, qualidade));
