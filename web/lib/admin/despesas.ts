"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { ETIQUETA_PUBLICO } from "@/lib/dados/publico";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Resultado } from "./membros";

// Server Actions da tela Despesas. Cada despesa aparece no site público na hora.

const MSG_ERRO = "Não foi possível salvar agora. Confira a conexão e tente de novo.";

function salvou() {
  updateTag(ETIQUETA_PUBLICO);
  refresh();
}

const DadosDaDespesa = z.object({
  id: z.uuid().optional(),
  descricao: z.string().trim().min(1).max(200),
  valor: z.number().positive().max(9_999_999).transform((v) => Math.round(v * 100) / 100),
  data: z.iso.date(),
  categoriaId: z.uuid(),
  // null = vários pets
  petId: z.uuid().nullable(),
  campanhaId: z.uuid().nullable(),
});

// Cria (sem id) ou altera uma despesa. Também usado pelo "Desfazer" da edição.
export async function salvarDespesa(entrada: z.input<typeof DadosDaDespesa>): Promise<Resultado> {
  const lido = DadosDaDespesa.safeParse(entrada);
  if (!lido.success) return { ok: false, erro: "Confira a descrição, o valor e a data." };
  const { id, descricao, valor, data, categoriaId, petId, campanhaId } = lido.data;
  const campos = { descricao, valor, data, categoria_id: categoriaId, pet_id: petId, campanha_id: campanhaId };

  const supabase = await criarClienteServidor();
  const { error } = id
    ? await supabase.from("despesas").update(campos).eq("id", id)
    : await supabase.from("despesas").insert(campos);
  if (error) return { ok: false, erro: MSG_ERRO };

  salvou();
  return { ok: true, dados: null };
}

// "Cancelar despesa": nada é apagado; fica marcada como cancelada, com o motivo, e sai do total.
// motivo null = desfaz o cancelamento (o "Desfazer" do aviso).
export async function cancelarDespesa(entrada: { id: string; motivo: string | null }): Promise<Resultado> {
  const lido = z.object({ id: z.uuid(), motivo: z.string().trim().min(1).max(200).nullable() }).safeParse(entrada);
  if (!lido.success) return { ok: false, erro: "Escreva o motivo do cancelamento." };
  const { id, motivo } = lido.data;

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("despesas")
    .update(motivo ? { cancelada_em: new Date().toISOString(), motivo_cancelamento: motivo } : { cancelada_em: null, motivo_cancelamento: null })
    .eq("id", id);
  if (error) return { ok: false, erro: MSG_ERRO };

  salvou();
  return { ok: true, dados: null };
}
