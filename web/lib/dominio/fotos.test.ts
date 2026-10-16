import { describe, expect, it } from "vitest";
import { FOCO_CENTRO, focoDoToque, medidasReduzidas, nomeDaFoto, posicaoDoFoco, tipoDaImagem, urlDaFoto } from "./fotos";

const bytes = (...partes: (string | number[])[]) =>
  new Uint8Array(partes.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)));

describe("medidasReduzidas", () => {
  it("reduz pelo lado maior, mantendo a proporção", () => {
    expect(medidasReduzidas(4032, 3024)).toEqual({ largura: 1000, altura: 750 });
    expect(medidasReduzidas(3024, 4032)).toEqual({ largura: 750, altura: 1000 });
    expect(medidasReduzidas(2000, 2000, 500)).toEqual({ largura: 500, altura: 500 });
  });
  it("não amplia foto pequena", () => {
    expect(medidasReduzidas(640, 480)).toEqual({ largura: 640, altura: 480 });
  });
  it("nunca chega a zero numa foto muito estreita", () => {
    expect(medidasReduzidas(5000, 2)).toEqual({ largura: 1000, altura: 1 });
  });
});

describe("tipoDaImagem", () => {
  it("reconhece WebP e JPEG pelos primeiros bytes", () => {
    expect(tipoDaImagem(bytes("RIFF", [1, 2, 3, 4], "WEBPVP8 "))).toBe("image/webp");
    expect(tipoDaImagem(bytes([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
  });
  it("recusa o resto", () => {
    expect(tipoDaImagem(bytes([0x89], "PNG", [13, 10, 26, 10]))).toBeNull();
    expect(tipoDaImagem(bytes("<svg>"))).toBeNull();
    expect(tipoDaImagem(bytes("RIFF", [1, 2, 3, 4], "WAVE"))).toBeNull();
    expect(tipoDaImagem(new Uint8Array())).toBeNull();
  });
});

describe("nomeDaFoto e urlDaFoto", () => {
  it("monta o nome pela extensão do tipo", () => {
    expect(nomeDaFoto("abc", "image/webp")).toBe("abc.webp");
    expect(nomeDaFoto("abc", "image/jpeg")).toBe("abc.jpg");
  });
  it("monta o endereço público do Storage", () => {
    expect(urlDaFoto("https://exemplo.supabase.co/", "pets", "abc.webp")).toBe(
      "https://exemplo.supabase.co/storage/v1/object/public/pets/abc.webp",
    );
  });
});

describe("ponto principal", () => {
  it("converte o toque em porcentagem da foto, sem passar das bordas", () => {
    expect(focoDoToque(150, 50, 300, 200)).toEqual({ x: 50, y: 25 });
    expect(focoDoToque(-10, 260, 300, 200)).toEqual({ x: 0, y: 100 });
    expect(focoDoToque(10, 10, 0, 0)).toEqual(FOCO_CENTRO);
  });
  it("vira object-position", () => {
    expect(posicaoDoFoco({ x: 30, y: 12.4 })).toBe("30% 12%");
    expect(posicaoDoFoco(FOCO_CENTRO)).toBe("50% 50%");
  });
});
