-- T1.6: histórico de alterações, preenchido por trigger.
-- O resumo é o texto da tela "Histórico de alterações" (admin-mais.html).
-- O valor (R$) aparece na tela a partir de "depois"; o resumo não leva nomes de membros.

create function public.resumo_historico(
  tabela text, acao public.acao_historico, antes jsonb, depois jsonb
)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  n jsonb := coalesce(depois, antes);
begin
  case tabela
  when 'contribuicoes' then
    if acao = 'cancelou' then
      return 'Contribuição cancelada: ' || (n ->> 'motivo_cancelamento');
    elsif acao = 'criou' and n ->> 'membro_id' is null then
      return 'Doação avulsa registrada';
    elsif acao = 'criou' then
      return 'Contribuição registrada';
    end if;
    return 'Contribuição alterada';

  when 'despesas' then
    if acao = 'cancelou' then
      return 'Despesa cancelada: ' || (n ->> 'motivo_cancelamento');
    elsif acao = 'criou' then
      return 'Despesa criada: ' || (n ->> 'descricao');
    end if;
    return 'Despesa alterada: ' || (n ->> 'descricao');

  when 'pets' then
    if acao = 'criou' then
      return 'Pet cadastrado: ' || (n ->> 'nome');
    elsif (antes ->> 'obito_em') is distinct from (depois ->> 'obito_em') and depois ->> 'obito_em' is not null then
      return 'Pet alterado: ' || (n ->> 'nome') || ' faleceu';
    elsif (antes ->> 'adotado_em') is distinct from (depois ->> 'adotado_em') and depois ->> 'adotado_em' is not null then
      return 'Pet alterado: ' || (n ->> 'nome')
        || case when n ->> 'sexo' = 'f' then ' foi adotada' else ' foi adotado' end;
    elsif (antes ->> 'lar_em') is distinct from (depois ->> 'lar_em') and depois ->> 'lar_em' is not null then
      return 'Pet alterado: ' || (n ->> 'nome') || ' passou para lar temporário';
    elsif (antes ->> 'oculto') is distinct from (depois ->> 'oculto') then
      return 'Pet alterado: ' || (n ->> 'nome')
        || case when (depois ->> 'oculto')::boolean then ' saiu do site' else ' voltou ao site' end;
    end if;
    return 'Pet alterado: ' || (n ->> 'nome');

  when 'membros' then
    if acao = 'criou' then
      return 'Membro adicionado: ' || (n ->> 'nome');
    elsif (antes ->> 'ativo') is distinct from (depois ->> 'ativo') then
      return case when (depois ->> 'ativo')::boolean then 'Membro reativado: ' else 'Membro inativado: ' end
        || (n ->> 'nome');
    end if;
    return 'Membro alterado: ' || (n ->> 'nome');

  when 'campanhas' then
    if acao = 'criou' then
      return 'Campanha criada: ' || (n ->> 'nome');
    elsif (antes ->> 'situacao') is distinct from (depois ->> 'situacao') then
      return case when depois ->> 'situacao' = 'encerrada' then 'Campanha encerrada: ' else 'Campanha reaberta: ' end
        || (n ->> 'nome');
    end if;
    return 'Campanha alterada: ' || (n ->> 'nome');

  when 'categorias' then
    if acao = 'criou' then
      return 'Categoria criada: ' || (n ->> 'nome');
    elsif (antes ->> 'nome') is distinct from (depois ->> 'nome') then
      return 'Categoria renomeada: ' || (antes ->> 'nome') || ' → ' || (depois ->> 'nome');
    elsif (antes ->> 'ativa') is distinct from (depois ->> 'ativa') then
      return case when (depois ->> 'ativa')::boolean then 'Categoria reativada: ' else 'Categoria desativada: ' end
        || (n ->> 'nome');
    end if;
    return 'Categoria alterada: ' || (n ->> 'nome');

  else
    return 'Registro alterado';
  end case;
end;
$$;

create function public.registrar_historico()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_antes jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) end;
  v_depois jsonb := to_jsonb(new);
  v_acao public.acao_historico;
begin
  if tg_op = 'INSERT' then
    v_acao := 'criou';
  elsif v_depois ? 'cancelada_em'
    and v_antes ->> 'cancelada_em' is null
    and v_depois ->> 'cancelada_em' is not null then
    v_acao := 'cancelou';
  else
    -- só atualizado_em mudou: nada a registrar
    if (v_antes - 'atualizado_em') = (v_depois - 'atualizado_em') then
      return new;
    end if;
    v_acao := 'alterou';
  end if;

  insert into public.historico (user_id, tabela, registro_id, acao, resumo, antes, depois)
  values (
    auth.uid(), tg_table_name, new.id, v_acao,
    public.resumo_historico(tg_table_name, v_acao, v_antes, v_depois),
    v_antes, v_depois
  );
  return new;
end;
$$;

revoke execute on function public.registrar_historico() from public, anon, authenticated;

create trigger registrar_historico after insert or update on public.contribuicoes
  for each row execute function public.registrar_historico();
create trigger registrar_historico after insert or update on public.despesas
  for each row execute function public.registrar_historico();
create trigger registrar_historico after insert or update on public.pets
  for each row execute function public.registrar_historico();
create trigger registrar_historico after insert or update on public.membros
  for each row execute function public.registrar_historico();
create trigger registrar_historico after insert or update on public.campanhas
  for each row execute function public.registrar_historico();
create trigger registrar_historico after insert or update on public.categorias
  for each row execute function public.registrar_historico();
