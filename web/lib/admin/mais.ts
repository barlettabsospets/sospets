"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { ETIQUETA_PUBLICO } from "@/lib/dados/publico";
import { semAcento } from "@/lib/dominio/formatacao";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Resultado } from "./membros";

// Server Actions da tela Mais (categorias e configurações).
// As duas aparecem no site público (cores das categorias, "Dados registrados desde").

const MSG_ERRO = "Não foi possível salvar agora. Confira a conexão e tente de novo.";

function salvou() {
  updateTag(ETIQUETA_PUBLICO);
  refresh();
}

// Nova categoria: entra no fim da lista, com a cor padrão (#CFC3B4, da tabela).
export async function criarCategoria(entrada: { nome: string }): Promise<Resultado> {
  const lido = z.object({ nome: z.string().trim().min(1).max(60) }).safeParse(entrada);
  if (!lido.success) return { ok: false, erro: "Escreva o nome da categoria." };

  const supabase = await criarClienteServidor();
  const { data: todas, error: erroAoLer } = await supabase.from("categorias").select("nome, ordem, ativa");
  if (erroAoLer) return { ok: false, erro: MSG_ERRO };
  // "racao" e "Ração" são a mesma categoria (o índice único do banco só pega a grafia exata)
  const igual = todas.find((c) => semAcento(c.nome.trim()) === semAcento(lido.data.nome));
  if (igual) {
    return { ok: false, erro: igual.ativa ? `Já existe uma categoria "${igual.nome}".` : `A categoria "${igual.nome}" existe, mas está desativada.` };
  }
  const ordem = Math.max(0, ...todas.map((c) => c.ordem)) + 1;
  const { error } = await supabase.from("categorias").insert({ nome: lido.data.nome, ordem });
  if (error) return { ok: false, erro: MSG_ERRO };

  salvou();
  return { ok: true, dados: null };
}

const Configuracoes = z.object({
  dadosDesde: z.iso.date(),
  avisoMeses: z.union([z.literal(2), z.literal(3), z.literal(6)]),
});

export async function salvarConfiguracoes(entrada: z.input<typeof Configuracoes>): Promise<Resultado> {
  const lido = Configuracoes.safeParse(entrada);
  if (!lido.success) return { ok: false, erro: "Confira a data." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("configuracoes")
    .update({ dados_desde: lido.data.dadosDesde, aviso_meses: lido.data.avisoMeses })
    .eq("unica", true);
  if (error) return { ok: false, erro: MSG_ERRO };

  salvou();
  return { ok: true, dados: null };
}
