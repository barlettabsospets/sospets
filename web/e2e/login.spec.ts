import { expect, test } from "@playwright/test";

test("admin sem login vai para o login, lembrando o destino", async ({ page }) => {
  await page.goto("/admin/despesas");
  await expect(page).toHaveURL(/\/entrar\?proximo=%2Fadmin%2Fdespesas/);
  await expect(page.getByRole("heading", { name: "Área do administrador" })).toBeVisible();
});

test("Mostrar e Esconder a senha", async ({ page }) => {
  await page.goto("/entrar");
  const senha = page.getByLabel("Senha", { exact: true });
  await expect(senha).toHaveAttribute("type", "password");
  // o botão só aparece quando já funciona
  await page.getByRole("button", { name: "Mostrar" }).click();
  await expect(senha).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Esconder" }).click();
  await expect(senha).toHaveAttribute("type", "password");
});

test("campo vazio mostra o erro do protótipo", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByRole("button", { name: "Mostrar" }).waitFor();
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.locator("#erro")).toHaveText("Informe seu e-mail e a senha para entrar.");
  await expect(page.locator("#erro")).toHaveRole("alert");
  await expect(page.getByLabel("E-mail")).toBeFocused();
});
