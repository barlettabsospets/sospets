-- T5.1: "Alterar valor padrão" (admin-membros.html) numa transação só.
-- p_fixar = true: quem segue o padrão hoje passa a ter o valor antigo como valor próprio
-- (a caixa "Aplicar também aos que seguem o padrão" desmarcada).
-- p_liberar: membros que voltam a seguir o padrão (usado pelo "Desfazer").
-- Devolve os ids que ganharam valor próprio, para o "Desfazer" liberar depois.
-- security invoker: o RLS de configuracoes e membros vale como num update comum.
create function public.alterar_valor_padrao(
  p_valor numeric,
  p_fixar boolean,
  p_liberar uuid[] default '{}'
)
returns uuid[]
language plpgsql
security invoker
set search_path = ''
as $$
declare
  antigo numeric(12,2);
  fixados uuid[] := '{}';
begin
  if not public.eh_admin() then
    raise exception 'só administradores alteram o valor padrão' using errcode = '42501';
  end if;

  select valor_padrao into antigo from public.configuracoes for update;

  update public.membros set valor_mensal = null
  where id = any (p_liberar) and valor_mensal is not null;

  if p_fixar then
    with f as (
      update public.membros set valor_mensal = antigo
      where valor_mensal is null and not (id = any (p_liberar))
      returning id
    )
    select coalesce(array_agg(id), '{}') into fixados from f;
  end if;

  update public.configuracoes set valor_padrao = p_valor;
  return fixados;
end
$$;

revoke execute on function public.alterar_valor_padrao(numeric, boolean, uuid[]) from public, anon;
grant execute on function public.alterar_valor_padrao(numeric, boolean, uuid[]) to authenticated;
