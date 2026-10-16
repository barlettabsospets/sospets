-- Pet pode ser apagado de verdade (pedido da Barbara, 16/10): nova ação no histórico.
-- Fica numa migration só, porque o valor novo de um enum só pode ser usado depois do commit.
alter type public.acao_historico add value 'apagou';
