-- T1.3: situação de um pet no fim de um mês.
-- Mesma regra de situacaoPet() em dados.js e em lib/dominio (há teste comparando as duas):
-- falecido → adotado → lar temporário → rua; null se ainda não tinha entrado.

create function public.situacao_pet(p public.pets, mes date)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p.entrou_em > date_trunc('month', mes)::date then null
    when p.obito_em <= date_trunc('month', mes)::date then 'falecido'
    when p.adotado_em <= date_trunc('month', mes)::date then 'adotado'
    when p.lar_em <= date_trunc('month', mes)::date then 'lar'
    else 'rua'
  end
$$;
