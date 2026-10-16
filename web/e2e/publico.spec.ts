import { expect, type Page, test } from "@playwright/test";

// T7.2: o visitante vê a prestação de contas com os números do protótipo (seed fictício).

// escolhe outubro de 2026 no seletor, seja qual for o mês de hoje
async function irParaOutubro(page: Page) {
  await page.locator(".pbar .pdrop-btn").first().click();
  await page.getByRole("option", { name: /^Outubro de 2026/ }).click();
}

test("Prestação de contas: outubro de 2026 como no protótipo", async ({ page }) => {
  await page.goto("/");
  await irParaOutubro(page);
  const resumo = page.locator(".c-resumo");
  await expect(resumo.getByRole("heading")).toHaveText("Resumo de outubro");
  await expect(resumo.locator(".i .v")).toHaveText("R$ 410,00");
  await expect(resumo.locator(".i .d")).toHaveText("18 contribuições");
  await expect(resumo.locator(".o .v")).toHaveText("R$ 354,00");
  // nada de nomes de quem contribuiu no site público
  await expect(page.getByText("Ana Exemplo")).toHaveCount(0);
});

test("Pets e Despesas abrem e mostram o que o seed tem", async ({ page }) => {
  await page.goto("/pets");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".an-card").first()).toBeVisible();
  await page.goto("/despesas");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".tp-row").first()).toBeVisible();
});
