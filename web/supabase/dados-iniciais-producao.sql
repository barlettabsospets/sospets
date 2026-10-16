-- T6.5: dados iniciais de PRODUÇÃO (rodado uma vez, em 16/10/2026, a pedido da Barbara).
-- Sem nada fictício: só as categorias do protótipo (cores validadas, COR_CAT em dados.js) e as configurações.
-- "Dados registrados desde": janeiro de 2026 (muda pela tela Mais). Não é seed: o seed.sql é só do homolog.
begin;

insert into public.configuracoes (dados_desde, valor_padrao, aviso_meses)
values ('2026-01-01', 20, 3);

insert into public.categorias (nome, cor, ordem) values
  ('Castração', '#DB7838', 0),
  ('Veterinário e consultas', '#2D5F9A', 1),
  ('Ração', '#C2477A', 2),
  ('Medicamentos', '#D4A017', 3),
  ('Exames', '#2A9D8F', 4),
  ('Vacinas', '#7A5BA6', 5),
  ('Lar temporário', '#A8432F', 6),
  ('Transporte', '#8C9A2B', 7),
  ('Outros', '#CFC3B4', 8);

commit;
