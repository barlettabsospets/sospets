-- T5.6: fotos dos pets e das campanhas no Storage (SPEC, seção 6).
-- Buckets públicos: qualquer pessoa abre uma foto pelo endereço dela
-- (/storage/v1/object/public/...), sem passar pelo RLS.
-- Enviar, trocar, apagar e listar: só administrador.
-- As fotos chegam reduzidas pelo navegador (WebP, ou JPEG onde o navegador não gera WebP).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('pets', 'pets', true, 1048576, array['image/webp', 'image/jpeg']),
  ('campanhas', 'campanhas', true, 1048576, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;

-- sem política para anon: o visitante não lista os arquivos (nem os de pets ocultos)
create policy "fotos: admin lê" on storage.objects
  for select to authenticated
  using (bucket_id in ('pets', 'campanhas') and public.eh_admin());
create policy "fotos: admin envia" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('pets', 'campanhas') and public.eh_admin());
create policy "fotos: admin troca" on storage.objects
  for update to authenticated
  using (bucket_id in ('pets', 'campanhas') and public.eh_admin())
  with check (bucket_id in ('pets', 'campanhas') and public.eh_admin());
create policy "fotos: admin apaga" on storage.objects
  for delete to authenticated
  using (bucket_id in ('pets', 'campanhas') and public.eh_admin());
