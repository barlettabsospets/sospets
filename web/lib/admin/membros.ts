"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/server";

// Server Actions da tela Membros. Os membros não aparecem no site público,
// então não há cache público para renovar: refresh() basta para a tela.

export type Resultado<T = null> = { ok: true; dados: T } | { ok: false; erro: string };

const MSG_ERRO = "Não foi possível salvar agora. Confira a conexão e tente de novo.";

// reais com até 2 casas
const Reais = z.number().positive().max(99_999).transform((v) => Math.round(v * 100) / 100);

const DadosDoMembro = z.object({
  id: z.uuid().optional(),
  nome: z.string().trim().min(1).max(120),
  valorMensal: Reais.nullable(),
});

// Cria (sem id) ou altera um membro. Também usado pelo "Desfazer" da edição.
export async function salvarMembro(entrada: z.input<typeof DadosDoMembro>): Promise<Resultado> {
  const lido = DadosDoMembro.safeParse(entrada);
  if (!lido.success) return { ok: false, erro: "Confira o nome e o valor." };
  const { id, nome, valorMensal } = lido.data;

  const supabase = await criarClienteServidor();
  const { error } = id
    ? await supabase.from("membros").update({ nome, valor_mensal: valorMensal }).eq("id", id)
    : await supabase.from("membros").insert({ nome, valor_mensal: valorMensal });
  if (error) return { ok: false, erro: MSG_ERRO };

  refresh();
  return { ok: true, dados: null };
}

// Inativar ou reativar. O histórico do membro fica guardado.
export async function mudarAtivo(entrada: { id: string; ativo: boolean }): Promise<Resultado> {
  const lido = z.object({ id: z.uuid(), ativo: z.boolean() }).safeParse(entrada);
  if (!lido.success) return { ok: false, erro: MSG_ERRO };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("membros").update({ ativo: lido.data.ativo }).eq("id", lido.data.id);
  if (error) return { ok: false, erro: MSG_ERRO };

  refresh();
  return { ok: true, dados: null };
}

const NovoPadrao = z.object({
  valor: Reais,
  // true = quem segue o padrão hoje fica com o valor antigo
  fixar: z.boolean(),
  // "Desfazer": quem volta a seguir o padrão
  liberar: z.array(z.uuid()).default([]),
});

// Altera o valor padrão do grupo. Devolve quem ganhou valor próprio, para o "Desfazer".
export async function alterarValorPadrao(entrada: z.input<typeof NovoPadrao>): Promise<Resultado<string[]>> {
  const lido = NovoPadrao.safeParse(entrada);
  if (!lido.success) return { ok: false, erro: "Confira o valor." };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("alterar_valor_padrao", {
    p_valor: lido.data.valor,
    p_fixar: lido.data.fixar,
    p_liberar: lido.data.liberar,
  });
  if (error) return { ok: false, erro: MSG_ERRO };

  refresh();
  return { ok: true, dados: data ?? [] };
}
