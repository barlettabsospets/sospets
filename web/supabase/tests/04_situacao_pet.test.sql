-- situacao_pet(): mesma regra de situacaoPet() em dados.js.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(9);

create function pg_temp.sit(nome_pet text, mes date) returns text language sql as $$
  select public.situacao_pet(p, mes) from public.pets p where p.nome = nome_pet
$$;

-- Bento: entrou 2026-05, adotado 2026-10
select is(pg_temp.sit('Bento', '2026-04-01'), null, 'antes de entrar: null');
select is(pg_temp.sit('Bento', '2026-05-01'), 'rua', 'no mês em que entrou: rua');
select is(pg_temp.sit('Bento', '2026-10-01'), 'adotado', 'no mês da adoção: adotado');
-- Caramelo: entrou 2026-03, lar 2026-05, adotado 2026-09
select is(pg_temp.sit('Caramelo', '2026-06-01'), 'lar', 'em lar temporário');
select is(pg_temp.sit('Caramelo', '2026-09-01'), 'adotado', 'adoção vem antes de lar');
select is(pg_temp.sit('Caramelo', '2026-09-20'), 'adotado', 'qualquer dia do mês vale como o mês');

-- falecido vem antes de tudo
update public.pets set obito_em = '2026-10-01' where nome = 'Pipoca';
select is(pg_temp.sit('Pipoca', '2026-09-01'), 'lar', 'antes do óbito: lar');
select is(pg_temp.sit('Pipoca', '2026-10-01'), 'falecido', 'óbito vem antes de lar');

-- contagem de hoje, como no protótipo: 25 pets acompanhados (rua ou lar)
select is(
  (select count(*)::int from public.pets p
    where not p.oculto and public.situacao_pet(p, '2026-10-01') in ('rua', 'lar') and p.nome <> 'Pipoca'),
  24, 'pets acompanhados em outubro (sem a Pipoca, que faleceu no teste)'
);

select * from finish();
rollback;
