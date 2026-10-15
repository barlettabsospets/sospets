"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { ETIQUETA_PUBLICO } from "@/lib/dados/publico";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Resultado } from "./membros";

// Server Actions da tela Contribuições. Mudam os totais do site público:
// updateTag renova o cache das páginas públicas na hora.

const MSG_ERRO = "Não foi possível salvar agora. Confira a conexão e tente de novo.";
const Mes = z.string().regex(/^\d{4}-\d{2}$/);
const Reais = z.number().positive().max(99_999).transform((v) => Math.round(v * 100) / 100);

function salvou() {
  updateTag(ETIQUETA_PUBLICO);
  refresh();
}

// "Contribuiu": uma contribuição do membro no mês. Devolve o id, para o "Desfazer".
export async function registrarContribuicao(entrada: { membroId: string; mes: string; valor: number }): Promise<Resultado<string>> {
  const lido = z.object({ membroId: z.uuid(), mes: Mes, valor: Reais }).safeParse(entrada);
  if (!lido.success) return { ok: false, erro: "Confira o valor." };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("contribuicoes")
    .insert({ membro_id: lido.data.membroId, competencia: `${lido.data.mes}-01`, valor: lido.data.valor })
    .select("id")
    .single();
  // índice único: o membro já tem contribuição neste mês (ex.: outra pessoa marcou ao mesmo tempo)
  if (error?.code === "23505") return { ok: false, erro: "Essa contribuição já estava registrada. Atualize a página." };
  if (error) return { ok: false, erro: MSG_ERRO };

  salvou();
  return { ok: true, dados: data.id };
}

// "Desfazer": nada é apagado; a contribuição é cancelada com o motivo.
export async function desfazerContribuicao(entrada: { id: string }): Promise<Resultado> {
  const lido = z.object({ id: z.uuid() }).safeParse(entrada);
  if (!lido.success) return { ok: false, erro: MSG_ERRO };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("contribuicoes")
    .update({ cancelada_em: new Date().toISOString(), motivo_cancelamento: "Desfeita na tela de Contribuições" })
    .eq("id", lido.data.id)
    .is("cancelada_em", null);
  if (error) return { ok: false, erro: MSG_ERRO };

  salvou();
  return { ok: true, dados: null };
}

const Avulsa = z.object({
  mes: Mes,
  valor: Reais,
  // vazio = "Anônimo"
  nome: z.string().trim().max(120).transform((n) => n || null),
  campanhaId: z.uuid().nullable(),
});

// Doação avulsa: quem não é membro, ou quem prefere não ser identificado.
export async function registrarAvulsa(entrada: z.input<typeof Avulsa>): Promise<Resultado> {
  const lido = Avulsa.safeParse(entrada);
  if (!lido.success) return { ok: false, erro: "Confira o valor." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("contribuicoes").insert({
    competencia: `${lido.data.mes}-01`,
    valor: lido.data.valor,
    nome_avulso: lido.data.nome,
    campanha_id: lido.data.campanhaId,
  });
  if (error) return { ok: false, erro: MSG_ERRO };

  salvou();
  return { ok: true, dados: null };
}
