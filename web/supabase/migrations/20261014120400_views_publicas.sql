-- T1.5: views públicas (SPEC, seção 6). As páginas públicas leem só daqui.
-- security_invoker = false: a view roda com o dono (que passa pelo RLS), e o visitante
-- só enxerga as colunas escolhidas abaixo. Nunca: nomes de membros ou doadores,
-- contribuições individuais, pets.local, historico. Canceladas nunca entram.

-- mês, entrou, saiu e quantidades, de dados_desde até o último mês com dados (ou o mês atual)
create view public.pub_resumo_mensal
with (security_invoker = false) as
with
  entradas as (
    select competencia as mes, sum(valor) as entrou, count(*)::int as contribuicoes
    from public.contribuicoes
    where cancelada_em is null
    group by competencia
  ),
  saidas as (
    select date_trunc('month', data)::date as mes, sum(valor) as saiu, count(*)::int as despesas
    from public.despesas
    where cancelada_em is null
    group by 1
  ),
  limites as (
    select
      date_trunc('month', c.dados_desde)::date as inicio,
      greatest(
        date_trunc('month', current_date)::date,
        (select max(mes) from entradas),
        (select max(mes) from saidas)
      ) as fim
    from public.configuracoes c
  ),
  meses as (
    select generate_series(inicio, fim, interval '1 month')::date as mes
    from limites
  )
select
  m.mes,
  coalesce(e.entrou, 0)::numeric(12,2) as entrou,
  coalesce(s.saiu, 0)::numeric(12,2) as saiu,
  coalesce(e.contribuicoes, 0) as contribuicoes,
  coalesce(s.despesas, 0) as despesas
from meses m
left join entradas e using (mes)
left join saidas s using (mes);

-- quanto saiu por categoria em cada mês (rosca e "Para onde foi o dinheiro")
create view public.pub_gasto_categoria_mes
with (security_invoker = false) as
select
  date_trunc('month', d.data)::date as mes,
  c.id as categoria_id,
  c.nome as categoria,
  c.cor,
  c.ordem,
  sum(d.valor)::numeric(12,2) as total
from public.despesas d
join public.categorias c on c.id = d.categoria_id
where d.cancelada_em is null
group by 1, c.id, c.nome, c.cor, c.ordem;

-- despesas uma a uma; pet oculto aparece como "Vários pets"
create view public.pub_despesas
with (security_invoker = false) as
select
  d.id,
  d.data,
  d.descricao,
  c.nome as categoria,
  c.cor,
  d.valor,
  case when p.oculto then null else p.id end as pet_id,
  case when p.id is null or p.oculto then 'Vários pets' else p.nome end as pet,
  case when p.oculto then null else p.especie end as especie,
  d.campanha_id
from public.despesas d
join public.categorias c on c.id = d.categoria_id
left join public.pets p on p.id = d.pet_id
where d.cancelada_em is null;

-- pets visíveis, sem local (e sem oculto, que aqui é sempre falso)
create view public.pub_pets
with (security_invoker = false) as
select
  id, nome, especie, sexo, faixa_idade, pelagem,
  entrou_em, lar_em, adotado_em, obito_em,
  castrado, castrado_em, vacinado, vermifugado, fiv_felv_testado,
  precisa_lar, necessidade, foto_path
from public.pets
where not oculto;

-- campanhas com arrecadado e gasto somados
create view public.pub_campanhas
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
  ), 0)::numeric(12,2) as gasto
from public.campanhas c;

-- rodapé
create view public.pub_config
with (security_invoker = false) as
select dados_desde from public.configuracoes;

grant select on
  public.pub_resumo_mensal,
  public.pub_gasto_categoria_mes,
  public.pub_despesas,
  public.pub_pets,
  public.pub_campanhas,
  public.pub_config
to anon, authenticated;
