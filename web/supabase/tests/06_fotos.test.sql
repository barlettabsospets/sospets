-- Fotos (Storage): buckets públicos para abrir a foto, mas só administrador envia,
-- troca, apaga ou lista. Visitante e usuário logado que não é admin não gravam nada.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(13);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-a000-000000000001', 'admin@exemplo.com', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-a000-000000000002', 'logado@exemplo.com', 'authenticated', 'authenticated');
insert into public.administradores (user_id, nome, ativo) values
  ('00000000-0000-4000-a000-000000000001', 'Admin Exemplo', true);

select results_eq(
  $$select id, public, file_size_limit, allowed_mime_types from storage.buckets
    where id in ('pets', 'campanhas') order by id$$,
  $$values ('campanhas', true, 1048576::bigint, array['image/webp', 'image/jpeg']),
           ('pets', true, 1048576::bigint, array['image/webp', 'image/jpeg'])$$,
  'buckets pets e campanhas: públicos, até 1 MB, só WebP e JPEG'
);
select policies_are('storage', 'objects',
  array['fotos: admin lê', 'fotos: admin envia', 'fotos: admin troca', 'fotos: admin apaga'],
  'storage.objects só tem as políticas das fotos');
select policy_roles_are('storage', 'objects', 'fotos: admin lê', array['authenticated'], 'listar: só logado (e o RLS exige admin)');
select policy_roles_are('storage', 'objects', 'fotos: admin envia', array['authenticated'], 'enviar: só logado (e o RLS exige admin)');

-- administrador ---------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-4000-a000-000000000001", "role": "authenticated"}';

select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('pets', 'teste-admin.webp')$$,
  'admin envia foto de pet'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('campanhas', 'teste-admin.webp')$$,
  'admin envia foto de campanha'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('outro', 'teste-admin.webp')$$,
  null, null, 'admin não envia para outro bucket'
);
select is((select count(*)::int from storage.objects where name = 'teste-admin.webp'), 2, 'admin lista as fotos');

-- usuário logado que não é admin ---------------------------------------------

set local request.jwt.claims to '{"sub": "00000000-0000-4000-a000-000000000002", "role": "authenticated"}';

select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('pets', 'teste-logado.webp')$$,
  '42501', null, 'logado que não é admin não envia foto'
);
select is((select count(*)::int from storage.objects where bucket_id in ('pets', 'campanhas')), 0, 'logado que não é admin não lista as fotos');
update storage.objects set name = 'trocado.webp' where name = 'teste-admin.webp';

-- visitante -------------------------------------------------------------------

set local role anon;
set local request.jwt.claims to '{"role": "anon"}';

select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('pets', 'teste-anon.webp')$$,
  '42501', null, 'visitante não envia foto'
);
select is((select count(*)::int from storage.objects where bucket_id in ('pets', 'campanhas')), 0, 'visitante não lista as fotos');

reset role;
select is((select count(*)::int from storage.objects where name = 'teste-admin.webp'), 2, 'quem não é admin não troca o nome de uma foto');

select * from finish();
rollback;
