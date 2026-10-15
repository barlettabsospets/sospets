-- Ponto principal da foto (pedido da Barbara, 15/10): o que não pode ficar de fora quando
-- a foto é cortada para caber no quadro (quadrado na campanha e no avatar, mais largo no catálogo).
-- Em porcentagem da largura e da altura da foto; 50/50 = centro. Na tela vira object-position.

alter table public.pets
  add column foto_foco_x smallint not null default 50 check (foto_foco_x between 0 and 100),
  add column foto_foco_y smallint not null default 50 check (foto_foco_y between 0 and 100);
alter table public.campanhas
  add column foto_foco_x smallint not null default 50 check (foto_foco_x between 0 and 100),
  add column foto_foco_y smallint not null default 50 check (foto_foco_y between 0 and 100);

-- as views só ganham colunas no fim (create or replace view não muda a ordem das que existem)
create or replace view public.pub_pets
with (security_invoker = false) as
select
  id, nome, especie, sexo, faixa_idade, pelagem,
  entrou_em, lar_em, adotado_em, obito_em,
  castrado, castrado_em, vacinado, vermifugado, fiv_felv_testado,
  precisa_lar, necessidade, foto_path,
  criado_em,
  foto_foco_x, foto_foco_y
from public.pets
where not oculto;

create or replace view public.pub_campanhas
with (security_invoker = false) as
select
  c.id, c.nome, c.descricao, c.meta, c.inicio, c.situacao, c.foto_path,
  coalesce((
    select sum(valor) from public.contribuicoes
    where campanha_id = c.id and cancelada_em is null
  ), 0)::numeric(12,2) as arrecadado,
  coalesce((
    select sum(valor) from public.despesas
    where campanha_id = c.id and cancelada_em is null
  ), 0)::numeric(12,2) as gasto,
  c.foto_foco_x, c.foto_foco_y
from public.campanhas c;
