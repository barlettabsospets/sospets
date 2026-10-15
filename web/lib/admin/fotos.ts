import { z } from "zod";
import { type Bucket, nomeDaFoto, TAMANHO_MAXIMO, tipoDaImagem } from "@/lib/dominio/fotos";
import type { criarClienteServidor } from "@/lib/supabase/server";

// Envio e remoção de fotos, usados pelas Server Actions (campanhas e pets).
// O cliente é o do administrador logado: o RLS do Storage barra quem não é admin.

type Cliente = Awaited<ReturnType<typeof criarClienteServidor>>;

// foto no formulário: ausente = manter a atual; null = remover; Blob = trocar pela nova
export const FotoDoFormulario = z.instanceof(Blob).nullable().optional();

export const MSG_FOTO = "Não foi possível enviar a foto. Tente de novo ou escolha outra.";

// Grava a foto (já reduzida no navegador) com um nome novo e devolve o caminho no bucket.
export async function enviarFoto(supabase: Cliente, bucket: Bucket, foto: Blob): Promise<string | null> {
  if (foto.size === 0 || foto.size > TAMANHO_MAXIMO) return null;
  const bytes = new Uint8Array(await foto.arrayBuffer());
  const tipo = tipoDaImagem(bytes);
  if (!tipo) return null;
  const caminho = nomeDaFoto(crypto.randomUUID(), tipo);
  // o nome nunca se repete, então o navegador pode guardar a foto por um ano
  const { error } = await supabase.storage.from(bucket).upload(caminho, bytes, { contentType: tipo, cacheControl: "31536000" });
  return error ? null : caminho;
}

// Apaga uma foto que deixou de ser usada. Se falhar, só sobra um arquivo sem uso.
export async function apagarFoto(supabase: Cliente, bucket: Bucket, caminho: string | null | undefined) {
  if (caminho) await supabase.storage.from(bucket).remove([caminho]);
}
