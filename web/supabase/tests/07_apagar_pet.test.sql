-- Apagar pet: o administrador apaga um pet sem despesa e isso vai para o histórico;
-- pet com despesa (mesmo cancelada) não é apagado; quem não é admin não apaga.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(7);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-a000-000000000001', 'admin@exemplo.com', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-a000-000000000002', 'logado@exemplo.com', 'authenticated', 'authenticated');
insert into public.administradores (user_id, nome, ativo) values
  ('00000000-0000-4000-a000-000000000001', 'Admin Exemplo', true);

insert into public.pets (id, nome, especie, sexo, faixa_idade, entrou_em) values
  ('00000000-0000-4000-a000-0000000000c1', 'Duplicado Exemplo', 'gato', 'f', 'adulto', '2026-10-01'),
  ('00000000-0000-4000-a000-0000000000c2', 'Com Despesa Exemplo', 'gato', 'm', 'adulto', '2026-10-01');
insert into public.despesas (data, descricao, valor, categoria_id, pet_id, cancelada_em, motivo_cancelamento)
  select '2026-10-12', 'Consulta de teste', 50, id, '00000000-0000-4000-a000-0000000000c2', now(), 'teste'
  from public.categorias where nome = 'Ração';

-- quem não é admin ---------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-4000-a000-000000000002", "role": "authenticated"}';

select lives_ok($$delete from public.pets$$, 'delete de quem não é admin não dá erro, mas não acha linhas');
reset role;
select is((select count(*)::int from public.pets where id = '00000000-0000-4000-a000-0000000000c1'), 1, 'logado sem ser admin não apaga pet');

-- administrador ---------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-4000-a000-000000000001", "role": "authenticated"}';

select lives_ok($$delete from public.pets where id = '00000000-0000-4000-a000-0000000000c1'$$, 'admin apaga pet sem despesa');
select is((select count(*)::int from public.pets where id = '00000000-0000-4000-a000-0000000000c1'), 0, 'o pet saiu');
select results_eq(
  $$select acao::text, resumo, user_id, antes ->> 'nome', depois from public.historico
    where registro_id = '00000000-0000-4000-a000-0000000000c1' and acao = 'apagou'$$,
  $$values ('apagou', 'Pet apagado: Duplicado Exemplo', '00000000-0000-4000-a000-000000000001'::uuid, 'Duplicado Exemplo', null::jsonb)$$,
  'apagar vai para o histórico, com o pet inteiro em "antes"'
);
select throws_ok(
  $$delete from public.pets where id = '00000000-0000-4000-a000-0000000000c2'$$,
  '23503', null, 'pet com despesa (mesmo cancelada) não é apagado'
);
select is((select count(*)::int from public.pets where id = '00000000-0000-4000-a000-0000000000c2'), 1, 'o pet com despesa continua');

select * from finish();
rollback;
