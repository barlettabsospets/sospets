-- T1.2: atualizado_em = now() a cada alteração.

create function public.definir_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger definir_atualizado_em before update on public.configuracoes
  for each row execute function public.definir_atualizado_em();
create trigger definir_atualizado_em before update on public.categorias
  for each row execute function public.definir_atualizado_em();
create trigger definir_atualizado_em before update on public.campanhas
  for each row execute function public.definir_atualizado_em();
create trigger definir_atualizado_em before update on public.membros
  for each row execute function public.definir_atualizado_em();
create trigger definir_atualizado_em before update on public.administradores
  for each row execute function public.definir_atualizado_em();
create trigger definir_atualizado_em before update on public.contribuicoes
  for each row execute function public.definir_atualizado_em();
create trigger definir_atualizado_em before update on public.pets
  for each row execute function public.definir_atualizado_em();
create trigger definir_atualizado_em before update on public.despesas
  for each row execute function public.definir_atualizado_em();
