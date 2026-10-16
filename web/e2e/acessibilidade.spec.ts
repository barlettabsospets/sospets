import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

// T7.3: as 10 telas sem problemas de acessibilidade que o axe encontra (regras WCAG 2.1 A e AA),
// no celular e no computador. As do admin precisam de E2E_EMAIL e E2E_SENHA (como em admin.spec.ts).
const email = process.env.E2E_EMAIL;
const senha = process.env.E2E_SENHA;

async function semProblemas(page: Page, nome: string) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const problemas = r.violations.map((v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
  expect(problemas, `${nome}`).toEqual([]);
}

for (const [rota, nome] of [["/", "Prestação de contas"], ["/pets", "Pets"], ["/despesas", "Despesas"], ["/entrar", "Login"]] as const) {
  test(`${nome} (público)`, async ({ page }) => {
    await page.goto(rota);
    await page.waitForLoadState("networkidle");
    await semProblemas(page, nome);
  });
}

test.describe("área do administrador", () => {
  test.skip(!email || !senha, "defina E2E_EMAIL e E2E_SENHA de um administrador de teste");

  for (const [rota, nome] of [
    ["/admin/contribuicoes", "Contribuições"], ["/admin/despesas", "Despesas do admin"], ["/admin/pets", "Pets do admin"],
    ["/admin/membros", "Membros"], ["/admin/campanhas", "Campanhas"], ["/admin/mais", "Mais"],
  ] as const) {
    test(nome, async ({ page }) => {
      await page.goto(`/entrar?proximo=${rota}`);
      await page.getByRole("button", { name: "Mostrar" }).waitFor();
      await page.getByLabel("E-mail").fill(email!);
      await page.getByLabel("Senha", { exact: true }).fill(senha!);
      await page.getByRole("button", { name: "Entrar" }).click();
      await page.waitForURL(`**${rota}`);
      await page.waitForLoadState("networkidle");
      await semProblemas(page, nome);
      // a janela de cadastro aberta também (onde existe)
      const novo = page.getByRole("button", { name: /^(Nova despesa|Novo pet|Novo membro|Nova campanha|Doação avulsa)/ }).first();
      if (await novo.count()) {
        await novo.click();
        await page.locator("dialog[open]").waitFor();
        await semProblemas(page, `${nome}, janela aberta`);
      }
    });
  }
});
