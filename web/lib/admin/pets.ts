"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { ETIQUETA_PUBLICO } from "@/lib/dados/publico";
import { mesAtual } from "@/lib/dominio/meses";
import { dataDaCastracao, datasDaSituacao } from "@/lib/dominio/pets";
import { criarClienteServidor } from "@/lib/supabase/server";
import { enviarFoto, FocoDaFoto, FotoDoFormulario, MSG_FOTO } from "./fotos";
import type { Resultado } from "./membros";

// Server Actions da tela Pets. Os pets aparecem no site (menos o local e os ocultos).

const MSG_ERRO = "Não foi possível salvar agora. Confira a conexão e tente de novo.";

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
