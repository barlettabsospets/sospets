"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { ETIQUETA_PUBLICO } from "@/lib/dados/publico";
import { mesAtual } from "@/lib/dominio/meses";
import { dataDaCastracao, datasDaSituacao } from "@/lib/dominio/pets";
import { criarClienteServidor } from "@/lib/supabase/server";
import { apagarFoto, enviarFoto, FocoDaFoto, FotoDoFormulario, MSG_FOTO } from "./fotos";
import type { Resultado } from "./membros";

// Server Actions da tela Pets. Os pets aparecem no site (menos o local e os ocultos).

const MSG_ERRO = "Não foi possível salvar agora. Confira a conexão e tente de novo.";
const MSG_TEM_DESPESA =
  "Este pet tem despesas ligadas a ele e não pode ser apagado. Para tirá-lo do site, desmarque “Mostrar no site público”.";

function salvou() {
  updateTag(ETIQUETA_PUBLICO);
  refresh();
}

const Mes = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
// vazio = null
const TextoOpcional = (max: number) => z.string().trim().max(max).transform((t) => t || null);

const DadosDoPet = z.object({
  id: z.uuid().optional(),
  nome: z.string().trim().min(1).max(80),
  especie: z.enum(["cachorro", "gato"]),
  sexo: z.enum(["f", "m"]),
  faixaIdade: z.enum(["filhote", "adulto"]),
  situacao: z.enum(["rua", "lar", "adotado", "falecido"]),
  // meses "AAAA-MM" dos campos type="month"; desde = mês do passo atual (lar, adoção ou óbito)
  entrou: Mes,
  desde: Mes.nullable(),
  precisaLar: z.boolean(),
  necessidade: TextoOpcional(120),
  castrado: z.enum(["sim", "nao", "nao_sei"]),
  vacinado: z.boolean(),
  vermifugado: z.boolean(),
  fivFelv: z.boolean(),
  local: TextoOpcional(200),
  noSite: z.boolean(),
  foto: FotoDoFormulario,
  foco: FocoDaFoto,
  // contato de quem adotou (opcional; só fica gravado com o pet adotado)
  adotanteNome: TextoOpcional(120),
  adotanteTelefone: TextoOpcional(30),
  adotanteEndereco: TextoOpcional(200),
});

// Cria (sem id) ou altera um pet. A foto antiga não é apagada ao trocar, para o "Desfazer" poder voltar a ela.
export async function salvarPet(entrada: z.input<typeof DadosDoPet>): Promise<Resultado> {
  const lido = DadosDoPet.safeParse(entrada);
  if (!lido.success) return { ok: false, erro: "Confira o nome e as datas." };
  const d = lido.data;
  const hoje = mesAtual();
  if (d.situacao !== "rua" && !d.desde) return { ok: false, erro: "Confira as datas." };
  if (d.entrou > hoje || (d.desde && (d.desde > hoje || d.desde < d.entrou))) {
    return { ok: false, erro: "Confira as datas: nenhuma pode ser antes da chegada nem depois do mês atual." };
  }

  const supabase = await criarClienteServidor();
  // o que já está gravado: datas que a situação mantém e a data da castração
  let atual = { lar_em: null as string | null, adotado_em: null as string | null, obito_em: null as string | null, castrado: "nao_sei", castrado_em: null as string | null };
  if (d.id) {
    const { data, error } = await supabase.from("pets").select("lar_em, adotado_em, obito_em, castrado, castrado_em").eq("id", d.id).single();
    if (error) return { ok: false, erro: MSG_ERRO };
    atual = data;
  }
  let foto_path: string | null | undefined = d.foto === undefined ? undefined : null;
  if (d.foto) {
    foto_path = await enviarFoto(supabase, "pets", d.foto);
    if (!foto_path) return { ok: false, erro: MSG_FOTO };
  }

  const linha = {
    nome: d.nome,
    especie: d.especie,
    sexo: d.sexo,
    faixa_idade: d.faixaIdade,
    entrou_em: `${d.entrou}-01`,
    ...datasDaSituacao(d.situacao, `${d.desde ?? d.entrou}-01`, atual),
    precisa_lar: d.situacao === "rua" && d.precisaLar,
    necessidade: d.necessidade,
    castrado: d.castrado,
    castrado_em: dataDaCastracao(d.castrado, atual.castrado_em, atual.castrado === "sim", hoje),
    vacinado: d.vacinado,
    vermifugado: d.vermifugado,
    fiv_felv_testado: d.especie === "gato" && d.fivFelv,
    local: d.local,
    oculto: !d.noSite,
    // se o pet deixar de estar adotado, o contato do adotante é apagado junto
    adotante_nome: d.situacao === "adotado" ? d.adotanteNome : null,
    adotante_telefone: d.situacao === "adotado" ? d.adotanteTelefone : null,
    adotante_endereco: d.situacao === "adotado" ? d.adotanteEndereco : null,
    foto_foco_x: d.foco.x,
    foto_foco_y: d.foco.y,
    ...(foto_path === undefined ? {} : { foto_path }),
  };
  const { error } = d.id
    ? await supabase.from("pets").update(linha).eq("id", d.id)
    : await supabase.from("pets").insert(linha);
  if (error) return { ok: false, erro: MSG_ERRO };

  salvou();
  return { ok: true, dados: null };
}

const Data = z.iso.date().nullable();
// a versão anterior do pet, como a tela recebeu (lerPetsDoAdmin)
const PetAnterior = z.object({
  id: z.uuid(),
  nome: z.string().trim().min(1).max(80),
  especie: z.enum(["cachorro", "gato"]),
  sexo: z.enum(["f", "m"]),
  faixa_idade: z.enum(["filhote", "adulto"]),
  entrou_em: z.iso.date(),
  lar_em: Data,
  adotado_em: Data,
  obito_em: Data,
  castrado: z.enum(["sim", "nao", "nao_sei"]),
  castrado_em: Data,
  vacinado: z.boolean(),
  vermifugado: z.boolean(),
  fiv_felv_testado: z.boolean(),
  precisa_lar: z.boolean(),
  necessidade: z.string().max(120).nullable(),
  local: z.string().max(200).nullable(),
  oculto: z.boolean(),
  // só um arquivo do bucket pets (nome gerado por enviarFoto)
  foto_path: z.string().regex(/^[\w-]+\.(webp|jpg)$/).nullable(),
  foto_foco: FocoDaFoto,
  adotante_nome: z.string().max(120).nullable(),
  adotante_telefone: z.string().max(30).nullable(),
  adotante_endereco: z.string().max(200).nullable(),
});

// "Desfazer" da edição: o pet volta a ser exatamente como era, inclusive a foto.
export async function restaurarPet(entrada: z.input<typeof PetAnterior>): Promise<Resultado> {
  const lido = PetAnterior.safeParse(entrada);
  if (!lido.success) return { ok: false, erro: MSG_ERRO };
  const { id, foto_foco, ...campos } = lido.data;

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("pets")
    .update({ ...campos, foto_foco_x: foto_foco.x, foto_foco_y: foto_foco.y })
    .eq("id", id);
  if (error) return { ok: false, erro: MSG_ERRO };

  salvou();
  return { ok: true, dados: null };
}

// Apaga o pet de vez (pedido da Barbara, 16/10): para cadastro errado ou repetido. Não tem "Desfazer";
// o histórico guarda como ele era. Pet com despesa (mesmo cancelada) não é apagado.
export async function apagarPet(entrada: { id: string }): Promise<Resultado> {
  const lido = z.object({ id: z.uuid() }).safeParse(entrada);
  if (!lido.success) return { ok: false, erro: MSG_ERRO };
  const { id } = lido.data;

  const supabase = await criarClienteServidor();
  const { count, error: erroDaContagem } = await supabase.from("despesas").select("id", { count: "exact", head: true }).eq("pet_id", id);
  if (erroDaContagem) return { ok: false, erro: MSG_ERRO };
  if (count) return { ok: false, erro: MSG_TEM_DESPESA };

  const { data, error } = await supabase.from("pets").delete().eq("id", id).select("foto_path");
  // 23503: ganhou uma despesa entre a conferência e o delete
  if (error) return { ok: false, erro: error.code === "23503" ? MSG_TEM_DESPESA : MSG_ERRO };
  if (!data?.length) return { ok: false, erro: MSG_ERRO };
  await apagarFoto(supabase, "pets", data[0].foto_path);

  salvou();
  return { ok: true, dados: null };
}
