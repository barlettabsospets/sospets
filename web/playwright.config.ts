import { defineConfig, devices } from "@playwright/test";

// Testes de ponta a ponta num navegador de verdade (T7.2).
// Rodam contra o build de produção na porta 3100 (npm run build antes).
export default defineConfig({
  testDir: "e2e",
  // um teste por vez: o do admin mexe nos números do mês enquanto roda
  workers: 1,
  use: { baseURL: "http://localhost:3100", locale: "pt-BR" },
  projects: [
    { name: "celular", use: { ...devices["Pixel 7"] } },
    { name: "computador", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npx next start -p 3100",
    url: "http://localhost:3100/entrar",
    reuseExistingServer: true,
  },
});
