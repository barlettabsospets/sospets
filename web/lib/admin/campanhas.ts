"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { ETIQUETA_PUBLICO } from "@/lib/dados/publico";
import { apagarFoto, enviarFoto, FocoDaFoto, FotoDoFormulario, MSG_FOTO } from "./fotos";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Resultado } from "./membros";

// Server Actions da tela Campanhas. As campanhas aparecem no site (Pets e Prestação de contas).

const MSG_ERRO = "Não foi possível salvar agora. Confira a conexão e tente de novo.";
const Situacao = z.enum(["em_andamento", "encerrada"]);

function salvou() {
  updateTag(ETIQUETA_PUBLICO);
  refresh();
}

const DadosDaCampanha = z.object({
  id: z.uuid().optional(),
  nome: z.string().trim().min(1).max(120),
  // vazio = sem descrição
  descricao: z.string().trim().max(300).transform((d) => d || null),
  meta: z.number().positive().max(9_999_999).transform((v) => Math.round(v * 100) / 100).nullable(),
  inicio: z.iso.date(),
  situacao: Situacao,
  foto: FotoDoFormulario,
  foco: FocoDaFoto,
});

// Cria (sem id) ou altera uma campanha, com a foto (ausente = mantém; null = tira).
export async function salvarCampanha(entrada: z.input<typeof DadosDaCampanha>): Promise<Resultado> {
  const lido = DadosDaCampanha.safeParse(entrada);
  if (!lido.success) return { ok: false, erro: "Confira o nome, a meta e a data de início." };
  const { id, foto, foco, ...resto } = lido.data;
  const campos = { ...resto, foto_foco_x: foco.x, foto_foco_y: foco.y };

  const supabase = await criarClienteServidor();
  // foto que sai: a atual, quando for trocada ou tirada
  let antiga: string | null = null;
  if (id && foto !== undefined) {
    const { data, error } = await supabase.from("campanhas").select("foto_path").eq("id", id).single();
    if (error) return { ok: false, erro: MSG_ERRO };
    antiga = data.foto_path;
  }
  let nova: string | null = null;
  if (foto) {
    nova = await enviarFoto(supabase, "campanhas", foto);
    if (!nova) return { ok: false, erro: MSG_FOTO };
  }

  const linha = foto === undefined ? campos : { ...campos, foto_path: nova };
  const { error } = id
    ? await supabase.from("campanhas").update(linha).eq("id", id)
    : await supabase.from("campanhas").insert(linha);
  if (error) {
    await apagarFoto(supabase, "campanhas", nova);
    return { ok: false, erro: MSG_ERRO };
  }
  await apagarFoto(supabase, "campanhas", antiga);

  salvou();
  return { ok: true, dados: null };
}

// "Encerrar campanha" / "Reabrir campanha" (e o "Desfazer").
export async function mudarSituacao(entrada: { id: string; situacao: z.input<typeof Situacao> }): Promise<Resultado> {
  const lido = z.object({ id: z.uuid(), situacao: Situacao }).safeParse(entrada);
  if (!lido.success) return { ok: false, erro: MSG_ERRO };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("campanhas").update({ situacao: lido.data.situacao }).eq("id", lido.data.id);
  if (error) return { ok: false, erro: MSG_ERRO };

  salvou();
  return { ok: true, dados: null };
}
