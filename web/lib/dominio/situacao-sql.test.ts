// T2.3: situacao_pet() do SQL e situacaoPet() do TS dão o mesmo resultado
// para todos os pets do banco em todos os meses (mais pets de teste com óbito).
// Só leitura. Roda com `npm run test:banco`, contra o projeto linkado (homologação)
// ou, com TESTE_BANCO=local, contra o banco local do supabase start.
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { paraMes } from "./meses";
import { situacaoPet } from "./pets";

const alvo = process.env.TESTE_BANCO;

const SQL = `
with pets_teste as (
  select * from public.pets
  union all
  select (jsonb_populate_record(null::public.pets, x)).*
  from jsonb_array_elements('[
    {"nome": "Teste óbito na rua", "entrou_em": "2026-01-01", "obito_em": "2026-03-01"},
    {"nome": "Teste óbito no lar", "entrou_em": "2026-01-01", "lar_em": "2026-02-01", "obito_em": "2026-05-01"},
    {"nome": "Teste óbito após adoção", "entrou_em": "2026-01-01", "adotado_em": "2026-02-01", "obito_em": "2026-06-01"}
  ]'::jsonb) x
)
select p.nome, p.entrou_em::text, p.lar_em::text, p.adotado_em::text, p.obito_em::text,
  to_char(m, 'YYYY-MM') as mes, public.situacao_pet(p, m::date) as sql
from pets_teste p
cross join generate_series('2025-06-01'::date, '2026-12-01'::date, interval '1 month') m`;

type Linha = {
  nome: string;
  entrou_em: string;
  lar_em: string | null;
  adotado_em: string | null;
  obito_em: string | null;
  mes: string;
  sql: string | null;
};

function consultar(): Linha[] {
  const saida = execFileSync(
    "npx",
    ["supabase", "db", "query", alvo === "local" ? "--local" : "--linked", SQL],
    { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
  );
  return JSON.parse(saida.slice(saida.indexOf("{"))).rows;
}

describe.skipIf(!alvo)("situacao_pet (SQL) × situacaoPet (TS)", () => {
  it("dão o mesmo resultado para todos os pets em todos os meses", { timeout: 120_000 }, () => {
    const linhas = consultar();
    expect(linhas.length).toBeGreaterThan(48 * 19);
    for (const l of linhas) {
      expect(situacaoPet(l, paraMes(l.mes)), `${l.nome} em ${l.mes}`).toBe(l.sql);
    }
    expect(linhas.some((l) => l.sql === "falecido")).toBe(true);
  });
});
