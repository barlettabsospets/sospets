-- T1.1: enums e tabelas (SPEC, seção 5).
-- Dinheiro em numeric(12,2); meses em date com dia 1.

-- enums -------------------------------------------------------------------

create type public.especie_pet as enum ('cachorro', 'gato');
create type public.sexo_pet as enum ('f', 'm');
create type public.faixa_idade as enum ('filhote', 'adulto');
create type public.castracao as enum ('sim', 'nao', 'nao_sei');
create type public.situacao_campanha as enum ('em_andamento', 'encerrada');
create type public.acao_historico as enum ('criou', 'alterou', 'cancelou');

-- "é o primeiro dia do mês"
create function public.eh_inicio_do_mes(d date)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select d = date_trunc('month', d)::date
$$;

-- configuracoes (uma linha só) -------------------------------------------------

create table public.configuracoes (
  id uuid primary key default gen_random_uuid(),
  unica boolean not null default true unique check (unica),
  dados_desde date not null,
  valor_padrao numeric(12,2) not null default 20 check (valor_padrao > 0),
  aviso_meses int not null default 3 check (aviso_meses in (2, 3, 6)),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- categorias ---------------------------------------------------------------

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique check (btrim(nome) <> ''),
  cor text not null default '#CFC3B4' check (cor ~ '^#[0-9A-Fa-f]{6}$'),
  ordem int not null default 0,
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- campanhas ----------------------------------------------------------------
-- Arrecadado e gasto não são colunas: vêm de contribuicoes e despesas.

create table public.campanhas (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (btrim(nome) <> ''),
  descricao text,
  meta numeric(12,2) check (meta > 0),
  inicio date not null,
  situacao public.situacao_campanha not null default 'em_andamento',
  foto_path text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- membros (dado privado) ---------------------------------------------------------

create table public.membros (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (btrim(nome) <> ''),
  -- null = usa configuracoes.valor_padrao
  valor_mensal numeric(12,2) check (valor_mensal > 0),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- administradores ----------------------------------------------------------

create table public.administradores (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (btrim(nome) <> ''),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- contribuicoes (dado privado; o público só vê somas) ----------------------------

create table public.contribuicoes (
  id uuid primary key default gen_random_uuid(),
  competencia date not null check (public.eh_inicio_do_mes(competencia)),
  valor numeric(12,2) not null check (valor > 0),
  -- null = doação avulsa
  membro_id uuid references public.membros (id),
  -- só para avulsa; vazio = "Anônimo"
  nome_avulso text,
  campanha_id uuid references public.campanhas (id),
  cancelada_em timestamptz,
  motivo_cancelamento text,
  criado_por uuid default auth.uid() references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint contribuicoes_nome_so_avulsa check (membro_id is null or nome_avulso is null),
  constraint contribuicoes_cancelamento_com_motivo check (
    (cancelada_em is null and motivo_cancelamento is null)
    or (cancelada_em is not null and btrim(coalesce(motivo_cancelamento, '')) <> '')
  )
);

-- no máximo uma contribuição não cancelada por membro e mês
create unique index contribuicoes_membro_mes_unica
  on public.contribuicoes (membro_id, competencia)
  where cancelada_em is null;

create index contribuicoes_competencia on public.contribuicoes (competencia);
create index contribuicoes_campanha on public.contribuicoes (campanha_id);

-- pets -----------------------------------------------------------------------
-- A situação (rua, lar, adotado, falecido) é calculada pelas datas: situacao_pet().

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (btrim(nome) <> ''),
  especie public.especie_pet not null,
  sexo public.sexo_pet not null,
  faixa_idade public.faixa_idade not null,
  pelagem text,
  entrou_em date not null check (public.eh_inicio_do_mes(entrou_em)),
  lar_em date check (public.eh_inicio_do_mes(lar_em) and lar_em >= entrou_em),
  adotado_em date check (public.eh_inicio_do_mes(adotado_em) and adotado_em >= entrou_em),
  obito_em date check (public.eh_inicio_do_mes(obito_em) and obito_em >= entrou_em),
  castrado public.castracao not null default 'nao_sei',
  castrado_em date check (public.eh_inicio_do_mes(castrado_em)),
  vacinado boolean not null default false,
  vermifugado boolean not null default false,
  -- só gatos
  fiv_felv_testado boolean not null default false,
  -- na rua e pronto para lar temporário
  precisa_lar boolean not null default false,
  -- aparece no site
  necessidade text,
  -- privado: onde o pet fica. Nunca aparece no site
  local text,
  oculto boolean not null default false,
  foto_path text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint pets_castrado_em_so_se_castrado check (castrado_em is null or castrado = 'sim'),
  constraint pets_fiv_so_gatos check (especie = 'gato' or not fiv_felv_testado)
);

-- despesas -------------------------------------------------------------------

create table public.despesas (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  -- sem nomes de pessoas (aviso no formulário)
  descricao text not null check (btrim(descricao) <> ''),
  valor numeric(12,2) not null check (valor > 0),
  categoria_id uuid not null references public.categorias (id),
  -- null = "Vários pets"
  pet_id uuid references public.pets (id),
  campanha_id uuid references public.campanhas (id),
  cancelada_em timestamptz,
  motivo_cancelamento text,
  criado_por uuid default auth.uid() references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint despesas_cancelamento_com_motivo check (
    (cancelada_em is null and motivo_cancelamento is null)
    or (cancelada_em is not null and btrim(coalesce(motivo_cancelamento, '')) <> '')
  )
);

create index despesas_data on public.despesas (data);
create index despesas_categoria on public.despesas (categoria_id);
create index despesas_pet on public.despesas (pet_id);
create index despesas_campanha on public.despesas (campanha_id);

-- historico (auditoria; preenchido por trigger, nunca editado) --------------------
-- Só tem "quando": uma linha do histórico não muda depois de criada.

create table public.historico (
  id uuid primary key default gen_random_uuid(),
  quando timestamptz not null default now(),
  user_id uuid,
  tabela text not null,
  registro_id uuid not null,
  acao public.acao_historico not null,
  resumo text not null,
  antes jsonb,
  depois jsonb
);

create index historico_quando on public.historico (quando desc);
create index historico_registro on public.historico (tabela, registro_id);
