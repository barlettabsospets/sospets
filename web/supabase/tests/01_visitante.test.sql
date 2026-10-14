-- Visitante (anon): nenhuma tabela, só as views pub_*; nada privado chega a ele.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(25);

-- guarda, antes de virar anon, os textos privados que nunca podem aparecer
create temporary table privados as
  select nome as texto from public.membros
  union select nome_avulso from public.contribuicoes where nome_avulso is not null
  union select local from public.pets where local is not null;
grant select on privados to anon;

set local role anon;
set local request.jwt.claims to '{"role": "anon"}';

-- tabelas: acesso negado
select throws_ok('select * from public.configuracoes', '42501', null, 'anon não lê configuracoes');
select throws_ok('select * from public.categorias', '42501', null, 'anon não lê categorias');
select throws_ok('select * from public.campanhas', '42501', null, 'anon não lê campanhas');
select throws_ok('select * from public.membros', '42501', null, 'anon não lê membros');
select throws_ok('select * from public.administradores', '42501', null, 'anon não lê administradores');
select throws_ok('select * from public.contribuicoes', '42501', null, 'anon não lê contribuicoes');
select throws_ok('select * from public.pets', '42501', null, 'anon não lê pets');
select throws_ok('select * from public.despesas', '42501', null, 'anon não lê despesas');
select throws_ok('select * from public.historico', '42501', null, 'anon não lê historico');
select throws_ok(
  $$insert into public.despesas (data, descricao, valor, categoria_id) values ('2026-10-10', 'x', 1, gen_random_uuid())$$,
  '42501', null, 'anon não grava despesas'
);

-- views: leitura liberada
select lives_ok('select * from public.pub_resumo_mensal', 'anon lê pub_resumo_mensal');
select lives_ok('select * from public.pub_gasto_categoria_mes', 'anon lê pub_gasto_categoria_mes');
select lives_ok('select * from public.pub_despesas', 'anon lê pub_despesas');
select lives_ok('select * from public.pub_pets', 'anon lê pub_pets');
select lives_ok('select * from public.pub_campanhas', 'anon lê pub_campanhas');
select lives_ok('select * from public.pub_config', 'anon lê pub_config');

-- colunas privadas fora das views
select hasnt_column('public', 'pub_pets', 'local', 'pub_pets não tem local');
select hasnt_column('public', 'pub_pets', 'oculto', 'pub_pets não tem oculto');
select hasnt_column('public', 'pub_despesas', 'criado_por', 'pub_despesas não tem criado_por');

-- nenhum nome de membro, doador ou local aparece em nenhuma view
select is(
  (select count(*)::int from privados p, public.pub_pets v where row_to_json(v)::text ilike '%' || p.texto || '%'),
  0, 'pub_pets não mostra nada privado'
);
select is(
  (select count(*)::int from privados p, public.pub_despesas v where row_to_json(v)::text ilike '%' || p.texto || '%'),
  0, 'pub_despesas não mostra nada privado'
);
select is(
  (select count(*)::int from privados p, public.pub_campanhas v where row_to_json(v)::text ilike '%' || p.texto || '%'),
  0, 'pub_campanhas não mostra nada privado'
);

-- pet oculto: some de pub_pets e vira "Vários pets" em pub_despesas
reset role;
update public.pets set oculto = true where nome = 'Luna';
set local role anon;

select is(
  (select count(*)::int from public.pub_pets where nome = 'Luna'),
  0, 'pet oculto não aparece em pub_pets'
);
select is(
  (select count(*)::int from public.pub_despesas where pet = 'Luna'),
  0, 'despesa de pet oculto não mostra o nome dele'
);
select is(
  (select count(*)::int from public.pub_despesas
    where data = '2026-10-05' and descricao = 'Consulta e antibiótico' and pet = 'Vários pets' and pet_id is null),
  1, 'despesa de pet oculto aparece como "Vários pets"'
);

select * from finish();
rollback;
