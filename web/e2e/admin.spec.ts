import { expect, test } from "@playwright/test";

// T7.2: o admin entra, lança uma despesa e ela aparece no site; depois cancela e ela sai.
// O e-mail e a senha vêm do ambiente (nunca do código): E2E_EMAIL e E2E_SENHA.
const email = process.env.E2E_EMAIL;
const senha = process.env.E2E_SENHA;

test.skip(!email || !senha, "defina E2E_EMAIL e E2E_SENHA de um administrador de teste");

test("despesa lançada no admin aparece no site, e a cancelada some", async ({ page }) => {
  const descricao = `Teste automatizado ${Date.now()}`;
  await page.goto("/entrar?proximo=/admin/despesas");
  await page.getByRole("button", { name: "Mostrar" }).waitFor();
  await page.getByLabel("E-mail").fill(email!);
  await page.getByLabel("Senha", { exact: true }).fill(senha!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/admin\/despesas$/);

  await page.getByRole("button", { name: "Nova despesa" }).click();
  const janela = page.getByRole("dialog", { name: "Nova despesa" });
  await janela.getByLabel("O que foi comprado ou pago?").fill(descricao);
  await janela.getByLabel("Valor").fill("12,34");
  await janela.getByRole("button", { name: "Salvar despesa" }).click();
  await expect(page.locator(".toast")).toContainText("Despesa de R$ 12,34 registrada.");

  // no site, na lista de despesas (o cache público é atualizado na hora)
  const site = await page.context().newPage();
  await expect(async () => {
    await site.goto("/despesas");
    await expect(site.getByText(descricao)).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 20_000 });

  // cancela (nada é apagado) e ela sai do site
  await page.getByRole("button", { name: `Editar ${descricao}` }).click();
  await page.getByRole("dialog", { name: "Editar despesa" }).getByRole("button", { name: "Cancelar despesa" }).click();
  const cancelar = page.getByRole("dialog", { name: "Cancelar despesa" });
  await cancelar.getByLabel("Motivo").fill("teste automatizado");
  await cancelar.getByRole("button", { name: "Cancelar despesa" }).click();
  await expect(page.locator(".toast")).toContainText("Despesa cancelada.");
  await expect(async () => {
    await site.goto("/despesas");
    await expect(site.getByText(descricao)).toHaveCount(0, { timeout: 2000 });
  }).toPass({ timeout: 20_000 });
});
