-- T1.4: quem pode o quê (SPEC, seção 6).
-- Visitante (anon): nenhuma tabela, só as views pub_* (próxima migration).
-- Administrador: lê e escreve tudo; historico só leitura.

-- existe linha ativa em administradores para o usuário logado
create function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.administradores
    where user_id = auth.uid() and ativo
  )
$$;

revoke execute on function public.eh_admin() from public, anon;
grant execute on function public.eh_admin() to authenticated;

-- RLS ligado em todas as tabelas ------------------------------------------

alter table public.configuracoes enable row level security;
alter table public.categorias enable row level security;
alter table public.campanhas enable row level security;
alter table public.membros enable row level security;
alter table public.administradores enable row level security;
alter table public.contribuicoes enable row level security;
alter table public.pets enable row level security;
alter table public.despesas enable row level security;
alter table public.historico enable row level security;

-- segunda camada: anon não tem permissão nenhuma nas tabelas, nem nas que forem criadas depois
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

-- administrador lê e escreve ------------------------------------------------

create policy "admin lê e escreve" on public.configuracoes
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());
create policy "admin lê e escreve" on public.categorias
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());
create policy "admin lê e escreve" on public.campanhas
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());
create policy "admin lê e escreve" on public.membros
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());
create policy "admin lê e escreve" on public.administradores
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());
create policy "admin lê e escreve" on public.contribuicoes
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());
create policy "admin lê e escreve" on public.pets
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());
create policy "admin lê e escreve" on public.despesas
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

-- historico: admin só lê; quem grava é o trigger
create policy "admin lê" on public.historico
  for select to authenticated using (public.eh_admin());
revoke insert, update, delete, truncate on public.historico from authenticated;
