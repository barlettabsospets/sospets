-- As views públicas mostram os números do protótipo com o seed, e canceladas não somam.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(9);

set local role anon;
set local request.jwt.claims to '{"role": "anon"}';

-- conferência rápida do CLAUDE.md
select results_eq(
  $$select entrou, saiu, contribuicoes, despesas from public.pub_resumo_mensal where mes = '2026-10-01'$$,
  $$values (410.00::numeric(12,2), 354.00::numeric(12,2), 18, 4)$$,
  'outubro de 2026: entrou R$ 410,00, saiu R$ 354,00, 18 contribuições, 4 despesas'
);

-- IN, OUT e CNT do index.html, mês a mês
select results_eq(
  $$select mes, entrou, saiu, contribuicoes from public.pub_resumo_mensal
    where mes between '2026-01-01' and '2026-10-01' order by mes$$,
  $$select ('2026-' || lpad(m::text, 2, '0') || '-01')::date, e::numeric(12,2), s::numeric(12,2), c
    from unnest(
      array[1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      array[520, 640, 900, 830, 960, 1040, 870, 780, 890, 410],
      array[450, 540.5, 790, 640.25, 820, 905.6, 700, 610, 724, 354],
      array[16, 20, 28, 26, 30, 33, 27, 24, 28, 18]
    ) as t(m, e, s, c) order by m$$,
  'resumo mensal igual a IN, OUT e CNT do protótipo'
);

-- BY_SET + BY_OUT do index.html
select results_eq(
  $$select categoria, sum(total)::numeric(12,2) from public.pub_gasto_categoria_mes group by categoria, ordem order by ordem$$,
  $$values ('Castração', 1650.00::numeric(12,2)), ('Veterinário e consultas', 1360.35), ('Ração', 1140.00),
    ('Medicamentos', 760.00), ('Exames', 640.00), ('Vacinas', 404.00), ('Lar temporário', 240.00),
    ('Transporte', 240.00), ('Outros', 100.00)$$,
  'gasto por categoria igual ao protótipo'
);

select results_eq(
  $$select descricao, valor from public.pub_despesas where data >= '2026-10-01' order by data desc$$,
  $$values ('Ração para gatos de rua', 120.00::numeric(12,2)), ('Consulta e antibiótico', 180.00),
    ('Vacina V4', 24.00), ('Transporte até a clínica', 30.00)$$,
  'despesas de outubro iguais a dados.js (sem a cancelada)'
);

select results_eq(
  $$select nome, arrecadado, gasto from public.pub_campanhas order by inicio$$,
  $$values ('Campanha Nelson (exemplo)', 640.00::numeric(12,2), 640.00::numeric(12,2)),
    ('Campanha Stuart (exemplo)', 1200.00, 0.00)$$,
  'arrecadado e gasto das campanhas'
);

select is((select dados_desde from public.pub_config), '2026-01-01'::date, 'dados registrados desde janeiro de 2026');

-- canceladas não entram em nenhuma soma
reset role;
insert into public.despesas (data, descricao, valor, categoria_id, campanha_id, cancelada_em, motivo_cancelamento)
select '2026-10-10', 'Despesa de teste cancelada', 999, c.id, (select id from public.campanhas where nome like 'Campanha Stuart%'),
  now(), 'teste'
from public.categorias c where c.nome = 'Outros';
insert into public.contribuicoes (competencia, valor, campanha_id, cancelada_em, motivo_cancelamento)
select '2026-10-01', 999, id, now(), 'teste' from public.campanhas where nome like 'Campanha Stuart%';
set local role anon;

select results_eq(
  $$select entrou, saiu, contribuicoes, despesas from public.pub_resumo_mensal where mes = '2026-10-01'$$,
  $$values (410.00::numeric(12,2), 354.00::numeric(12,2), 18, 4)$$,
  'canceladas não mudam o resumo do mês'
);
select is(
  (select count(*)::int from public.pub_despesas where descricao = 'Despesa de teste cancelada'),
  0, 'despesa cancelada não aparece em pub_despesas'
);
select results_eq(
  $$select arrecadado, gasto from public.pub_campanhas where nome like 'Campanha Stuart%'$$,
  $$values (1200.00::numeric(12,2), 0.00::numeric(12,2))$$,
  'canceladas não somam na campanha'
);

select * from finish();
rollback;
