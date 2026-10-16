# CLAUDE.md

Site de prestação de contas do grupo de voluntários **SOS Pets DF Águas Claras** (cães e gatos de rua). O site público mostra quanto entrou, quanto saiu e como estão os pets; a área do administrador registra tudo.

**Leia o [SPEC.md](SPEC.md) antes de qualquer tarefa.** Ele tem o escopo, o modelo de dados, as regras de acesso e a lista de tarefas (seção 10).

## Onde fica cada coisa

| Pasta | O que é |
|---|---|
| `sospets-design/sospets-kit/design/` | **Protótipo em HTML estático: a referência de design.** Não editar, a não ser que peçam. Não tem `package.json` |
| `web/` | O app de verdade: Next.js + TypeScript + Tailwind v4 + Supabase |
| `web/supabase/migrations/` | Todo o SQL do banco |
| `web/lib/dominio/` | Regras de negócio puras (situação do pet, saldo, formatação) |

Para ver o protótipo: Live Server na raiz do repositório. O `index.html` da raiz redireciona para ele.

## Comandos (dentro de `web/`)

```bash
npm run dev            # app local
npm run lint
npm run typecheck
npm test               # Vitest
supabase db push --dry-run   # mostra o que seria aplicado no projeto linkado
supabase db push       # aplica as migrations no projeto linkado (confira qual antes!)
supabase db query --linked "select ..."   # consulta no projeto linkado
supabase gen types typescript --linked > lib/supabase/tipos.ts
```

**Sem Docker no dia a dia.** O Docker deixa o Codespace lento, então o banco de trabalho é o `sospets-homolog` (dados fictícios, pode ser zerado), não um banco local. Migration nova: `db push --dry-run`, `db push`, e conferir com `db query --linked`. Os testes pgTAP (`supabase/tests/`) não rodam com `--linked` (a CLI não tem permissão no schema `extensions`); eles rodam no GitHub Actions (T7.1) ou, se precisar, num banco local.

**Banco local, só se precisar** (`supabase start`, `supabase test db`): avise antes, porque é lento. No Codespace, o Docker vem com uma regra de firewall antiga que bloqueia a rede entre containers; depois de cada reinício, rode uma vez `sudo iptables-legacy -I DOCKER-USER -i br-+ -o br-+ -j ACCEPT`. Ao terminar, `supabase stop`.

O seed é gerado: edite `scripts/gerar-seed.mjs` e rode `node scripts/gerar-seed.mjs`; não edite o `seed.sql` à mão.

Antes de dizer que uma tarefa está pronta, rode lint, typecheck e os testes, e diga o resultado.

## Regras que não se quebram

1. **Privacidade.** Nomes de membros e doadores, contribuições individuais, `pets.local` e o `historico` **nunca** chegam ao site público. Páginas públicas leem **só as views `pub_*`**, nunca as tabelas. Qualquer mudança em RLS ou nas views precisa de teste pgTAP.
2. **O banco só muda por migration.** Nada de mudar tabela pelo painel do Supabase. Não edite uma migration já aplicada: crie outra.
3. **Produção é intocável sem pedido explícito.** Não rode `db push`, `seed` nem SQL contra `sospets-prod` sem a pessoa pedir naquela conversa. Antes de qualquer `supabase db push`, mostre qual projeto está linkado.
4. **`SUPABASE_SERVICE_ROLE_KEY` só no servidor.** Nunca com prefixo `NEXT_PUBLIC_`, nunca em Client Component, nunca no git.
5. **Nada é apagado.** Despesas e contribuições são canceladas (`cancelada_em` + motivo); categorias são desativadas.
6. **O repositório é público.** Antes de todo commit, siga a lista "Repositório público" da seção 6 do SPEC: e-mail `noreply`, nenhum segredo, nenhum dado real, nenhum backup. Rode `scripts/conferir-commit.sh && git commit ...` (ele falha e impede o commit se achar algo) e confira à mão que nenhum nome de pessoa real entrou. Na dúvida, não commite e pergunte.

## Design

- **Fiel ao protótipo.** Cada tela tem um arquivo correspondente (tabela na seção 7 do SPEC). Copie layout, textos, estados vazios, teclado e ARIA. Se o protótipo e o SPEC divergirem num detalhe visual, vale o protótipo.
- **Não redesenhe.** Se algo parecer errado no protótipo, aponte o problema e pergunte; não mude por conta própria.
- Cores e espaçamentos vêm dos tokens (`tokens.css` → `@theme`). Cores de categoria vêm da tabela `categorias`, não de constantes no código.
- Fontes locais (Fraunces, Nunito, Barlow Condensed). Sem Google Fonts.
- Mobile-first, a partir de 360 px. Acessibilidade WCAG 2.1 AA.
- Gráficos em SVG próprio, sem biblioteca de gráficos.
- **Estilos:** os CSS do protótipo são copiados como estão para `app/estilos/` por `scripts/portar-estilos.mjs` (não edite esses arquivos; rode o script de novo se o protótipo mudar). Tokens em `app/estilos/tokens.css` (`@theme`). Ajustes do app só em `app/estilos/ajustes.css`. Use as classes do protótipo nos componentes; o CSS dele vence os utilitários do Tailwind.
- **Três layouts raiz** (cada um com o `<body>` do protótipo): `(publico)` = `body.pub`, `(admin)` = `body.pub.admin`, login = `body.pub.admin.auth`. A 404 global é `app/global-not-found.tsx`.
- **Páginas públicas** leem por funções `'use cache'` em `lib/dados/publico.ts` (cliente sem cookies, `cacheLife` de 5 min, `cacheTag("publico")`). Server Actions do admin chamam `updateTag("publico")`.
- Componentes de UI em `components/ui`, com testes de teclado e ARIA (`*.test.tsx`, jsdom).

## Código

- **Textos da interface, mensagens de erro, nomes de tabelas, colunas e funções de domínio em português** (`situacaoPet`, `despesas.cancelada_em`). Termos técnicos do framework continuam em inglês.
- Dinheiro: `numeric(12,2)` no banco; formatar com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`. Nunca somar valores formatados.
- Meses: `date` com dia 1. Na tela, "outubro de 2026" ou "out/2026".
- Server Components por padrão; `'use client'` só onde houver interação.
- Gravar com Server Actions, validar com Zod e chamar `revalidatePath` nas páginas públicas afetadas.
- Regra de negócio fica em `lib/dominio` (testada), não espalhada nos componentes. A mesma regra em SQL e em TS precisa de um teste que compare as duas.
- Siga o estilo do código ao redor; comentários curtos e em português.

## Git

- Branches: `main` (produção), `develop` (homologação), `feat/T4.1-prestacao-de-contas` para tarefas.
- PR sempre para `develop`. Só `develop` vai para `main`.
- Ao terminar uma tarefa, marque `[x]` no SPEC.md, no mesmo PR.
- Commits só quando a pessoa pedir.

## Dados fictícios

O `seed.sql` reproduz o protótipo (`dados.js`, `CAMP_DEFAULT` em `app.js`, arrays `IN`/`OUT`/`CNT` em `index.html`). "Hoje" no protótipo é outubro de 2026. Conferência rápida: outubro → entrou R$ 410,00, saiu R$ 354,00, 18 contribuições, 4 despesas.
