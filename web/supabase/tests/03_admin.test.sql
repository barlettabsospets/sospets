-- Administrador lê e escreve (e cada mudança vai para o histórico);
-- usuário logado que não é admin não lê nem escreve nada.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(18);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-a000-000000000001', 'admin@exemplo.com', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-a000-000000000002', 'logado@exemplo.com', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-a000-000000000003', 'ex-admin@exemplo.com', 'authenticated', 'authenticated');
insert into public.administradores (user_id, nome, ativo) values
  ('00000000-0000-4000-a000-000000000001', 'Admin Exemplo', true),
  ('00000000-0000-4000-a000-000000000003', 'Ex-admin Exemplo', false);

-- administrador ---------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-4000-a000-000000000001", "role": "authenticated"}';

select ok(public.eh_admin(), 'admin ativo é admin');
select is((select count(*)::int from public.membros), 24, 'admin lê membros');

select lives_ok(
  $$insert into public.despesas (data, descricao, valor, categoria_id)
    select '2026-10-12', 'Ração de teste', 50, id from public.categorias where nome = 'Ração'$$,
  'admin cria despesa'
);
select results_eq(
  $$select acao::text, resumo, user_id from public.historico where tabela = 'despesas' order by quando desc limit 1$$,
  $$values ('criou', 'Despesa criada: Ração de teste', '00000000-0000-4000-a000-000000000001'::uuid)$$,
  'criar despesa vai para o histórico com o admin'
);

select lives_ok(
  $$update public.despesas set cancelada_em = now(), motivo_cancelamento = 'lançada em duplicidade'
    where descricao = 'Ração de teste'$$,
  'admin cancela despesa'
);
select is(
  (select resumo from public.historico where tabela = 'despesas' and acao = 'cancelou' and user_id is not null),
  'Despesa cancelada: lançada em duplicidade', 'cancelamento vai para o histórico'
);
select throws_ok(
  $$update public.despesas set cancelada_em = now() where descricao = 'Vacina V4' and data = '2026-10-03'$$,
  '23514', null, 'cancelar exige motivo'
);

select lives_ok($$update public.pets set adotado_em = '2026-10-01' where nome = 'Stuart'$$, 'admin altera pet');
select is(
  (select resumo from public.historico where tabela = 'pets' order by quando desc limit 1),
  'Pet alterado: Stuart foi adotado', 'mudança de situação aparece no histórico'
);

select throws_ok(
  $$insert into public.contribuicoes (competencia, valor, membro_id)
    select '2026-10-01', 20, id from public.membros where nome = 'Ana Exemplo'$$,
  '23505', null, 'membro não contribui duas vezes no mesmo mês'
);
select lives_ok(
  $$insert into public.contribuicoes (competencia, valor, membro_id)
    select '2026-10-01', 20, id from public.membros where nome = 'Sofia Fictícia'$$,
  'depois de cancelada, a contribuição do mês pode ser registrada de novo'
);

select throws_ok('update public.historico set resumo = $$x$$', '42501', null, 'admin não edita o histórico');
select throws_ok('delete from public.historico', '42501', null, 'admin não apaga o histórico');

-- logado, mas não é admin ---------------------------------------------------------

set local request.jwt.claims to '{"sub": "00000000-0000-4000-a000-000000000002", "role": "authenticated"}';

select is((select count(*)::int from public.membros), 0, 'logado sem ser admin não lê membros');
select throws_ok(
  $$insert into public.despesas (data, descricao, valor, categoria_id)
    select '2026-10-12', 'x', 1, gen_random_uuid()$$,
  '42501', null, 'logado sem ser admin não grava despesas'
);
select lives_ok($$update public.pets set nome = 'x'$$, 'update de quem não é admin não dá erro, mas não acha linhas');
reset role;
select is((select count(*)::int from public.pets where nome = 'x'), 0, 'logado sem ser admin não altera pets');

-- admin inativo -----------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-4000-a000-000000000003", "role": "authenticated"}';
select is((select count(*)::int from public.contribuicoes), 0, 'admin inativo não lê contribuições');

select * from finish();
rollback;
