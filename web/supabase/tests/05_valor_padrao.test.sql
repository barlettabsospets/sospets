-- alterar_valor_padrao(): aplica a todos, fixa o valor antigo, desfaz; só admin.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(9);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-a000-000000000001', 'admin@exemplo.com', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-a000-000000000002', 'logado@exemplo.com', 'authenticated', 'authenticated');
insert into public.administradores (user_id, nome, ativo) values
  ('00000000-0000-4000-a000-000000000001', 'Admin Exemplo', true);

-- no seed: padrão R$ 20, 21 membros seguem o padrão e 3 têm valor próprio
set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-4000-a000-000000000001", "role": "authenticated"}';

select is(
  (select cardinality(public.alterar_valor_padrao(25, false))),
  0, 'aplicar a todos não fixa ninguém'
);
select is((select valor_padrao from public.configuracoes), 25.00, 'o padrão passa a 25');
select is((select count(*)::int from public.membros where valor_mensal is null), 21, 'quem seguia continua seguindo');

create temp table fixados as select public.alterar_valor_padrao(30, true) as ids;
select is((select cardinality(ids) from fixados), 21, 'sem aplicar a todos, os 21 ficam com valor próprio');
select is(
  (select count(*)::int from public.membros where valor_mensal = 25),
  21, 'eles ficam com o valor antigo (25)'
);

-- Desfazer: volta o padrão antigo e libera quem foi fixado
select lives_ok('select public.alterar_valor_padrao(25, false, (select ids from fixados))', 'desfazer funciona');
select is((select count(*)::int from public.membros where valor_mensal is null), 21, 'os 21 voltam a seguir o padrão');
select is((select valor_padrao from public.configuracoes), 25.00, 'o padrão volta a 25');

-- logado, mas não é admin
set local request.jwt.claims to '{"sub": "00000000-0000-4000-a000-000000000002", "role": "authenticated"}';
select throws_ok('select public.alterar_valor_padrao(99, false)', '42501', null, 'quem não é admin não altera');

select * from finish();
rollback;
