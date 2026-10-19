-- Contato do adotante: só a equipe vê, e só existe enquanto o pet está adotado.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(8);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-a000-000000000001', 'admin@exemplo.com', 'authenticated', 'authenticated');
insert into public.administradores (user_id, nome, ativo) values
  ('00000000-0000-4000-a000-000000000001', 'Admin Exemplo', true);

-- o site público não tem as colunas
select hasnt_column('public', 'pub_pets', 'adotante_nome', 'pub_pets não tem o nome do adotante');
select hasnt_column('public', 'pub_pets', 'adotante_telefone', 'pub_pets não tem o telefone do adotante');
select hasnt_column('public', 'pub_pets', 'adotante_endereco', 'pub_pets não tem o endereço do adotante');

-- administrador ---------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-4000-a000-000000000001", "role": "authenticated"}';

select lives_ok(
  $$update public.pets set adotante_nome = 'Maria Exemplo', adotante_telefone = '(61) 99999-0000',
      adotante_endereco = 'Quadra 105 (exemplo)' where nome = 'Bento'$$,
  'admin grava o contato do adotante de um pet adotado'
);
select throws_ok(
  $$update public.pets set adotante_nome = 'João Exemplo' where nome = 'Thor'$$,
  '23514', null, 'pet que não foi adotado não tem adotante'
);
select throws_ok(
  $$update public.pets set adotado_em = null where nome = 'Bento'$$,
  '23514', null, 'deixar de ser adotado sem apagar o contato é recusado'
);
select throws_ok(
  $$update public.pets set adotante_telefone = '   ' where nome = 'Bento'$$,
  '23514', null, 'contato em branco é recusado (vazio vira null)'
);

-- visitante -------------------------------------------------------------------

reset role;
set local role anon;
select throws_ok(
  $$select adotante_nome from public.pets$$,
  '42501', null, 'visitante não lê o contato do adotante'
);

select * from finish();
rollback;
