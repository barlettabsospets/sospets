# SOS Pets DF Águas Claras: especificação do sistema

Versão 1 · outubro de 2026 · ponto de partida: o protótipo em `sospets-design/sospets-kit/design/`

---

## 1. O que é

Um site de **prestação de contas** para o grupo de voluntários SOS Pets DF Águas Claras, que cuida de cães e gatos de rua.

- **Site público:** qualquer pessoa vê quanto entrou, quanto saiu, em quê, e como estão os pets (na rua, em lar temporário, adotados, castrados).
- **Área do administrador:** os voluntários registram contribuições, despesas, pets, membros e campanhas.

**Regra que não se quebra:** o site público mostra **totais**, nunca **quem** contribuiu. Nome de membro ou doador nunca chega ao navegador de um visitante, nem pela API.

## 2. Escopo da versão 1

**Entra:**
- As 3 páginas públicas do protótipo, com os mesmos números e comportamento: Prestação de contas, Pets e Despesas.
- O login e as 6 telas do admin: Contribuições, Despesas, Pets, Membros, Campanhas e Mais.
- Banco no Supabase, login dos administradores, fotos dos pets.
- Dois ambientes, **homologação** e **produção**, publicados na Vercel.

**Não entra:**
- Pagamento online (Pix, cartão). As contribuições são registradas à mão.
- Cadastro público ou login para membros. Só administradores entram.
- Upload de comprovantes de despesa.
- Notificações por e-mail ou WhatsApp. O aviso "sem contribuir há X meses" aparece só dentro do admin.
- Redesenho de telas. **O design é o do protótipo.**

## 3. Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Front-end | **Next.js (App Router) + TypeScript** | Roda nativamente na Vercel; páginas públicas renderizadas no servidor (rápidas e indexáveis) |
| Estilo | **Tailwind CSS v4** | `tokens.css` do protótipo vira o `@theme` (já previsto no README do protótipo) |
| Banco, login e arquivos | **Supabase** (Postgres, Auth, Storage) | Banco relacional com regras de acesso por linha (RLS) |
| Cliente Supabase | `@supabase/ssr` | Sessão em cookie, funciona em Server Components e no middleware |
| Gráficos | **SVG próprio em componentes React** | Igual ao protótipo; sem biblioteca de gráficos |
| Testes | **Vitest** (regras de negócio), **pgTAP** via `supabase test db` (RLS), **Playwright** (fluxos principais) | |
| Hospedagem | **Vercel** | Produção no `main`, homologação no `develop` |

**Onde fica o código:** em `web/`, na raiz do repositório. O protótipo continua em `sospets-design/sospets-kit/design/` como referência visual e **não é apagado**.

```
web/
  app/
    (publico)/            page.tsx (Prestação de contas), pets/, despesas/
    entrar/               login
    admin/                contribuicoes/, despesas/, pets/, membros/, campanhas/, mais/
  components/ui/          botões, cartões, seletor de período, lista de escolha, paginação, diálogo, toast
  components/graficos/    barras mensais, rosca, barras por categoria
  lib/
    supabase/             clientes (server, browser, middleware)
    dominio/              regras puras: situacaoPet, totais, formatação BRL (testadas com Vitest)
  supabase/
    migrations/           SQL versionado (única forma de mudar o banco)
    seed.sql              dados fictícios (os mesmos do protótipo)
    tests/                testes pgTAP das regras de acesso
```

## 4. Ambientes

| | Homologação | Produção |
|---|---|---|
| Branch | `develop` | `main` |
| Vercel | Ambiente *Preview* com as variáveis de homologação, ligado ao branch `develop` | Ambiente *Production* |
| Supabase | Projeto `sospets-homolog` | Projeto `sospets-prod` |
| Dados | Fictícios (`seed.sql`), pode ser zerado | Reais, **nunca** rodar seed |
| Faixa no topo | "Ambiente de homologação" | Nenhuma |

**Fluxo:** feature branch → PR para `develop` → testar na URL de homologação → PR de `develop` para `main`.

**Migrations:** aplicar primeiro em homologação (`supabase db push` com o projeto de homologação linkado), testar e só depois em produção.

**Variáveis de ambiente** (em `web/.env.local` e na Vercel, por ambiente):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # só no servidor; nunca com prefixo NEXT_PUBLIC_
NEXT_PUBLIC_AMBIENTE=homolog    # homolog | prod
```

## 5. Modelo de dados

Valores em dinheiro: `numeric(12,2)`. Meses: `date` com dia 1 (ex.: `2026-10-01`). Toda tabela tem `id uuid`, `criado_em` e `atualizado_em`.

### `configuracoes` (uma linha só)
| Campo | Tipo | Notas |
|---|---|---|
| `dados_desde` | date | Aparece no rodapé público ("Dados registrados desde…") |
| `valor_padrao` | numeric | Contribuição mensal sugerida (padrão R$ 20,00) |
| `aviso_meses` | int | Avisar quando um membro ficar X meses sem contribuir (2, 3 ou 6) |

### `categorias`
| Campo | Tipo | Notas |
|---|---|---|
| `nome` | text, único | Ex.: "Veterinário e consultas" |
| `cor` | text | Hex. Categorias novas usam `#CFC3B4` |
| `ordem` | int | |
| `ativa` | bool | Não se apaga categoria que já tem despesa; desativa-se |

Iniciais, com as cores validadas do protótipo (`COR_CAT` em `dados.js`): Veterinário e consultas `#2D5F9A`, Ração `#C2477A`, Castração `#DB7838`, Exames `#2A9D8F`, Medicamentos `#D4A017`, Vacinas `#7A5BA6`, Transporte `#8C9A2B`, Lar temporário `#A8432F`, Outros `#CFC3B4`.

### `campanhas`
| Campo | Tipo | Notas |
|---|---|---|
| `nome` | text | "Campanha da Mel" |
| `descricao` | text | Aparece no site |
| `meta` | numeric, opcional | |
| `inicio` | date | |
| `situacao` | enum `em_andamento` \| `encerrada` | |
| `foto_path` | text, opcional | Storage |

Arrecadado e gasto **não são colunas**: são somados de `contribuicoes` e `despesas` ligadas à campanha.

### `membros` (quem contribui todo mês; **dado privado**)
| Campo | Tipo | Notas |
|---|---|---|
| `nome` | text | |
| `valor_mensal` | numeric, opcional | `null` = usa `configuracoes.valor_padrao` |
| `ativo` | bool | Inativos saem da lista de Contribuições |

### `contribuicoes` (**dado privado**; o público só vê somas)
| Campo | Tipo | Notas |
|---|---|---|
| `competencia` | date (dia 1) | Mês a que se refere |
| `valor` | numeric > 0 | |
| `membro_id` | uuid, opcional | `null` = doação avulsa |
| `nome_avulso` | text, opcional | Só para avulsa; vazio = "Anônimo" |
| `campanha_id` | uuid, opcional | |
| `cancelada_em`, `motivo_cancelamento` | | Nada é apagado; cancela-se |
| `criado_por` | uuid → auth.users | |

Restrição: um membro tem no máximo **uma** contribuição não cancelada por mês (índice único parcial em `membro_id, competencia where cancelada_em is null`).

### `pets`
| Campo | Tipo | Notas |
|---|---|---|
| `nome` | text | |
| `especie` | enum `cachorro` \| `gato` | |
| `sexo` | enum `f` \| `m` | |
| `faixa_idade` | enum `filhote` \| `adulto` | |
| `pelagem` | text | |
| `entrou_em` | date (mês) | Quando o grupo passou a acompanhar |
| `lar_em` | date, opcional | Foi para lar temporário |
| `adotado_em` | date, opcional | |
| `obito_em` | date, opcional | |
| `castrado` | enum `sim` \| `nao` \| `nao_sei` | |
| `castrado_em` | date, opcional | |
| `vacinado`, `vermifugado` | bool | |
| `fiv_felv_testado` | bool | Só gatos |
| `precisa_lar` | bool | Na rua e pronto para lar temporário |
| `necessidade` | text, opcional | "Precisa de cirurgia" (aparece no site) |
| `local` | text, opcional | **Privado**: onde o pet fica. Nunca aparece no site |
| `oculto` | bool | "Ocultar do site" |
| `foto_path` | text, opcional | Storage, bucket `pets` |

A **situação** de um pet num mês não é guardada: é calculada pelas datas, como `situacaoPet()` em `dados.js`: falecido → adotado → lar temporário → rua; `null` se ainda não tinha entrado. Implementar a mesma regra em SQL (função `situacao_pet(pet, mes)`) e em TypeScript (`lib/dominio`), com testes que comparam as duas.

### `despesas`
| Campo | Tipo | Notas |
|---|---|---|
| `data` | date | |
| `descricao` | text | Sem nomes de pessoas (aviso no formulário) |
| `valor` | numeric > 0 | |
| `categoria_id` | uuid | |
| `pet_id` | uuid, opcional | `null` = "Vários pets" |
| `campanha_id` | uuid, opcional | |
| `cancelada_em`, `motivo_cancelamento` | | "Cancelar despesa" pede motivo |
| `criado_por` | uuid | |

### `administradores`
| Campo | Tipo | Notas |
|---|---|---|
| `user_id` | uuid → auth.users, PK | |
| `nome` | text | Aparece no histórico |
| `ativo` | bool | |

### `historico` (auditoria; preenchido por trigger)
`quando`, `user_id`, `tabela`, `registro_id`, `acao` (`criou` \| `alterou` \| `cancelou`), `resumo` (texto da tela "Histórico de alterações"), `antes` e `depois` (jsonb).

## 6. Acesso e privacidade (RLS)

**RLS ligado em todas as tabelas.** Função `eh_admin()` = existe linha ativa em `administradores` para `auth.uid()`.

| Quem | Pode |
|---|---|
| Visitante (`anon`) | Ler **só as views públicas** abaixo. Nenhuma tabela direto |
| Administrador | Ler e escrever em todas as tabelas; ler `historico` (sem editar) |

**Views públicas** (`security_invoker = false`, com `grant select` para `anon`), sempre sem linhas canceladas:

| View | Colunas | Usada em |
|---|---|---|
| `pub_resumo_mensal` | mês, entrou, saiu, nº de contribuições | Prestação de contas (cartões, gráfico mensal, saldo) |
| `pub_gasto_categoria_mes` | mês, categoria, cor, total | Rosca e "Para onde foi o dinheiro" |
| `pub_despesas` | data, descrição, categoria, cor, valor, nome e espécie do pet (ou "Vários pets") | Despesas, "Últimas despesas" |
| `pub_pets` | tudo de `pets`, **menos `local`**, só `oculto = false` | Pets, cartão de pets |
| `pub_campanhas` | nome, descrição, meta, início, situação, foto, arrecadado, gasto | Campanhas |
| `pub_config` | `dados_desde` | Rodapé |

Se um pet oculto tiver despesa, `pub_despesas` mostra "Vários pets" no lugar do nome.

**Login:** e-mail e senha (Supabase Auth). **Cadastro público desligado.** Administradores são convidados pelo painel do Supabase e recebem uma linha em `administradores`. O middleware do Next protege `/admin/*` e manda para `/entrar` quem não tiver sessão.

**Storage:** bucket `pets` e bucket `campanhas`, leitura pública, escrita só para admin. Fotos redimensionadas no envio (máximo 1600 px, WebP).

### Repositório público

O repositório no GitHub é **público**: qualquer pessoa vê o código, **todo o histórico de commits**, os PRs e os logs do GitHub Actions. A segurança vem do RLS e de manter os segredos fora do git, não de esconder o código.

**Nunca entra no git (nem em commit antigo, PR, issue ou log):**
- **Segredos:** `.env.local` e qualquer `.env` preenchido, `SUPABASE_SERVICE_ROLE_KEY`, chaves `sb_secret_…`, senhas do banco, tokens do GitHub, da Vercel ou do Supabase (`supabase login`). Só o `.env.example` vazio vai para o git.
- **Dados reais:** a planilha (`web/dados-reais/`, `*.xlsx`), nomes, e-mails e telefones de membros, doadores e administradores, contribuições individuais, `pets.local`, exportações CSV do admin, `pg_dump` e qualquer backup do banco.
- **Prints e cópias de produção** em PRs e issues. Para exemplo, use dados do `seed.sql`, que são fictícios.

**O `seed.sql` e os testes usam só dados fictícios.** Nomes de membros no seed são inventados.

**Antes de cada commit:**
1. Conferir o e-mail do autor: `git config user.email` deve ser o endereço `noreply` do GitHub, nunca o e-mail pessoal.
2. Ver a lista do que vai entrar (`git diff --cached --name-only`): nenhum `.env*` além do `.env.example`, nenhum `.xlsx`, `.csv`, `.dump` ou `.sql` fora de `web/supabase/`.
3. Procurar segredos no diff (`git diff --cached`): textos começando com `eyJhbGci`, `sb_secret_`, `sb_publishable_`, `ghp_`, `ghu_`, `password=` ou `postgres://…:senha@`.
4. Se algo aparecer, tirar do commit e colocar no `.gitignore` antes de seguir.

**GitHub Actions:** os logs são públicos. Segredos só em *GitHub Secrets*, e nunca impressos (`echo`) nos passos. O backup de produção (T6.8) roda e fica **num repositório privado separado**, porque artefatos de repositório público podem ser baixados por qualquer pessoa.

**Se um segredo vazar:** considere-o comprometido. Primeiro **troque a chave ou a senha** no Supabase, na Vercel ou no GitHub; só depois limpe o histórico. Apagar o commit não basta, porque robôs copiam chaves de repositórios públicos em minutos.

## 7. Telas

Cada tela segue o arquivo correspondente do protótipo: layout, textos, estados vazios e comportamento. **Se o protótipo e este spec divergirem num detalhe visual, vale o protótipo.**

### Públicas (sem login)
| Rota | Protótipo | Dados |
|---|---|---|
| `/` | `index.html`: Prestação de contas | Abre no mês atual. Seletor "Desde o início" + meses. Saldo, Entrou − Saiu = Sobrou, gráfico mensal (clicar num mês muda o filtro), rosca das 5 maiores categorias + "Outras", últimas 5 despesas, cartão de pets, campanhas em andamento + "Ver histórico" |
| `/pets` | `animais.html` | "Precisam de lar temporário", busca, filtros por espécie e situação, chegadas e saídas por mês, fila de castração |
| `/despesas` | `despesas.html` | Por mês, filtro por categoria, total, "Para onde foi o dinheiro", "Por pet" |
| `/entrar` | `login.html` | Erro em caixa vermelha, "Mostrar/Esconder" senha, "Voltar ao site" |

### Administrador (login obrigatório)
| Rota | Protótipo | O que faz |
|---|---|---|
| `/admin/contribuicoes` | `admin-contribuicoes.html` | Por mês: marcar quem contribuiu (com "Desfazer"), anel "18 de 24 membros", arrecadado no mês, doação avulsa (nome opcional, campanha opcional) |
| `/admin/despesas` | `admin-despesas.html` | Por mês: lista, nova/editar despesa, cancelar com motivo, total e "Por categoria" (clicar filtra) |
| `/admin/pets` | `admin-animais.html` | Tabela (Pet, Espécie e idade, Situação, Castrado), filtro por situação no mês, busca, "Precisa de atenção", novo/editar pet com foto |
| `/admin/membros` | `admin-membros.html` | Ativos/inativos, novo membro, valor próprio ou padrão, alterar valor padrão (com opção de aplicar a todos) |
| `/admin/campanhas` | `admin-campanhas.html` | Lista com arrecadado/gasto/meta, nova/editar, encerrar |
| `/admin/mais` | `admin-mais.html` | Exportar CSV (doações, despesas, pets), categorias (adicionar, renomear, desativar), configurações, histórico de alterações |

**Comportamentos comuns:** listas de 10 em 10 com a mesma paginação; "Desfazer" no toast após marcar contribuição ou cancelar; diálogos `<dialog>` nativos; números em BRL (`pt-BR`).

### Regras de negócio que precisam bater com o protótipo
- **Saldo** = tudo o que entrou − tudo o que saiu, desde `dados_desde` até o fim do mês escolhido.
- **"Faltou" em vez de "Sobrou"** quando saiu mais do que entrou no período.
- **Pets acompanhados hoje** = pets não ocultos com situação `rua` ou `lar` no mês atual.
- **Fila de castração** = pets em `rua` ou `lar` com `castrado <> 'sim'`.
- **"Precisa de atenção" (admin)** = precisa de lar, necessidade preenchida, não vacinado ou não castrado, só no mês atual.
- **Membro sem contribuir há X meses** = última contribuição não cancelada mais antiga que `aviso_meses`.
- Despesas e contribuições **canceladas** não entram em nenhuma soma.

## 8. Requisitos não funcionais

- **Mobile-first.** Tudo usável a partir de 360 px.
- **Acessibilidade WCAG 2.1 AA:** a navegação por teclado e os atributos ARIA do protótipo (seletores, diálogos, tabelas) precisam ser mantidos.
- **Desempenho:** páginas públicas com cache (ISR, revalidar em 5 min e na hora em que o admin salva algo); LCP < 2,5 s em 4G.
- **Fontes locais** (`assets/fonts`), sem Google Fonts.
- **Idioma:** tudo em português do Brasil, inclusive mensagens de erro.
- **Plano gratuito do Supabase e da Vercel.** O Supabase gratuito permite 2 projetos (homologação e produção), mas pausa um projeto após 7 dias sem uso e não faz backup. Por isso: uma tarefa agendada da Vercel faz uma consulta por dia em produção (mantém o projeto ativo), e um GitHub Action faz `pg_dump` semanal num repositório privado (backup).
- **Backup manual:** exportação CSV disponível no admin.

## 9. Critérios de pronto da versão 1

1. As 3 páginas públicas em homologação mostram **os mesmos números do protótipo** com o `seed.sql` (ex.: outubro de 2026 → entrou R$ 410,00, saiu R$ 354,00, 18 contribuições).
2. Um visitante **não consegue** ler `membros`, `contribuicoes`, `pets.local` nem `historico`: testes pgTAP passando.
3. Um administrador consegue fazer todos os fluxos do admin, e cada mudança aparece no histórico.
4. Produção no ar com domínio, sem dados fictícios, com pelo menos um administrador real.

---

## 10. Tarefas

Formato: `[ ]` a fazer, `[x]` feito. **Dep.** = precisa de outra tarefa antes. Cada tarefa termina com algo que dá para conferir.

### Fase 0: preparação (comece por aqui)
- [x] **T0.1** Criar os projetos `sospets-homolog` e `sospets-prod` no Supabase (região São Paulo). Guardar as chaves num gerenciador de senhas, nunca no repositório.
- [x] **T0.2** Criar o branch `develop` a partir do `main` e proteger os dois no GitHub (merge só por PR).
- [x] **T0.3** Criar o app em `web/`: Next.js + TypeScript + Tailwind v4 + ESLint. Rodar `npm run dev` e ver a página inicial. *Dep.: nenhuma*
- [x] **T0.4** Instalar a Supabase CLI, rodar `supabase init` dentro de `web/` e `supabase link` com o projeto de homologação.
- [x] **T0.5** Criar `web/.env.example` com as variáveis da seção 4, `web/.env.local` (no `.gitignore`) e os clientes em `lib/supabase/` (server, browser, middleware). *Dep.: T0.3, T0.4*
- [x] **T0.6** Configurar Vitest e um teste de exemplo passando. *Dep.: T0.3*

### Fase 1: banco de dados
- [x] **T1.1** Migration: enums e tabelas da seção 5, com chaves estrangeiras, `check (valor > 0)` e o índice único de contribuição por membro e mês. *Dep.: T0.4*
- [x] **T1.2** Migration: triggers de `atualizado_em`. *Dep.: T1.1*
- [x] **T1.3** Migration: função `situacao_pet(pet, mes)` em SQL. *Dep.: T1.1*
- [x] **T1.4** Migration: `eh_admin()` e RLS em todas as tabelas (admin lê e escreve; `anon` não lê nada). *Dep.: T1.1*
- [x] **T1.5** Migration: as 6 views públicas da seção 6 com `grant select to anon`. *Dep.: T1.3, T1.4*
- [x] **T1.6** Migration: trigger de `historico` em contribuições, despesas, pets, membros, campanhas e categorias, com `resumo` legível ("Despesa criada: Ração para gatos de rua"). *Dep.: T1.1*
- [x] **T1.7** `seed.sql` com os dados fictícios de `dados.js` e `app.js` (48 pets, despesas de ago a out, campanhas Stuart e Nelson, categorias com cores). Gerar despesas e contribuições de jan a jul que somem exatamente os valores `IN`, `OUT` e `CNT` do `index.html`. Criar 24 membros fictícios. *Dep.: T1.1*
- [x] **T1.8** Testes pgTAP: `anon` não lê tabelas privadas; `anon` lê as views; `pub_pets` não tem `local` nem pets ocultos; canceladas não somam; admin escreve; usuário logado que não é admin não escreve. *Dep.: T1.5, T1.7*
- [x] **T1.9** Aplicar tudo em homologação (`supabase db push` + seed) e conferir no painel. *Dep.: T1.8*
- [x] **T1.10** Gerar os tipos TypeScript (`supabase gen types typescript`) em `lib/supabase/tipos.ts`. *Dep.: T1.9*
- [ ] **T1.11** Importar a planilha real: script em `web/scripts/importar-planilha.ts` que lê o `.xlsx` de `web/dados-reais/` (pasta fora do git) e grava em pets, membros, contribuições, despesas, campanhas e categorias. Mostra um relatório antes de gravar (quantas linhas, totais por mês, linhas com problema). Rodar primeiro num banco local ou em homologação, conferir os totais com a planilha e só depois, com pedido explícito, em produção. *Dep.: T1.9*

### Fase 2: base do front-end
- [x] **T2.1** Portar `tokens.css` para o `@theme` do Tailwind; copiar as fontes de `assets/fonts` e as imagens do logo. *Dep.: T0.3*
- [x] **T2.2** `lib/dominio`: `situacaoPet`, `mesesEntre`, formatação BRL e de mês ("out/2026"), cálculo de saldo, com testes Vitest usando os mesmos casos do protótipo. *Dep.: T0.6*
- [x] **T2.3** Teste que compara `situacao_pet` do SQL com `situacaoPet` do TS para todos os pets do seed em todos os meses. *Dep.: T1.9, T2.2*
- [x] **T2.4** Componentes de UI (`components/ui`): botão, cartão, seletor de período (`periodPicker`), lista de escolha (`escolha`), chips, paginação, diálogo, toast com "Desfazer". Mesmo teclado e ARIA do `app.js` e do `admin.js`. *Dep.: T2.1*
- [x] **T2.5** Layouts: cabeçalho público (logo, abas, "Área do administrador"), cabeçalho do admin (abas + "Sair"), tabbar no celular, rodapé com `dados_desde`, faixa de homologação. *Dep.: T2.4*
- [x] **T2.6** Gráficos SVG (`components/graficos`): barras mensais clicáveis, rosca com legenda, barras por categoria. *Dep.: T2.1*

### Fase 3: login
- [x] **T3.1** Página `/entrar` igual a `login.html`, com login por e-mail e senha no Supabase Auth e mensagens de erro em português. *Dep.: T0.5, T2.5*
- [x] **T3.2** Middleware protegendo `/admin/*`; botão "Sair". *Dep.: T3.1*
- [x] **T3.3** Desligar o cadastro público no Supabase (nos dois projetos) e criar os 3 administradores (Barbara + duas pessoas) em homologação. Documentar no README como convidar um administrador. *Dep.: T1.9*
- [ ] **T3.4** Página "esqueci minha senha" (e-mail do Supabase em português). *Dep.: T3.1*

### Fase 4: páginas públicas
- [x] **T4.1** `/` Prestação de contas, lendo `pub_resumo_mensal`, `pub_gasto_categoria_mes`, `pub_despesas`, `pub_pets` e `pub_campanhas`. Conferir os números contra o protótipo, mês a mês. *Dep.: T1.10, T2.4–T2.6*
- [ ] **T4.2** `/pets`, igual a `animais.html`. *Dep.: T4.1*
- [ ] **T4.3** `/despesas`, igual a `despesas.html`. *Dep.: T4.1*
- [ ] **T4.4** Cache: ISR de 5 min + `revalidatePath` quando o admin salva. *Dep.: T4.1*

### Fase 5: área do administrador
Cada tela usa Server Actions para gravar, valida com Zod e mostra o toast do protótipo.
- [ ] **T5.1** `/admin/membros`: listar, criar, editar, ativar/desativar, valor padrão. *Dep.: T3.2*
- [ ] **T5.2** `/admin/contribuicoes`: marcar e desmarcar por mês (com Desfazer), doação avulsa, resumo do mês, aviso de "sem contribuir". *Dep.: T5.1*
- [ ] **T5.3** `/admin/mais` (parte de categorias e configurações): categorias e configurações. *Dep.: T3.2*
- [ ] **T5.4** `/admin/campanhas`: criar, editar, encerrar, foto. *Dep.: T3.2*
- [ ] **T5.5** `/admin/despesas`: criar, editar, cancelar com motivo, filtro por categoria, ligar a pet e campanha. *Dep.: T5.3, T5.4*
- [ ] **T5.6** Storage: buckets `pets` e `campanhas` com política de escrita só para admin; redimensionar a foto antes de enviar. *Dep.: T1.4*
- [ ] **T5.7** `/admin/pets`: tabela, filtro por situação no mês, busca, "Precisa de atenção", criar/editar com foto, ocultar do site. *Dep.: T5.6*
- [ ] **T5.8** `/admin/mais` (parte de exportação e histórico): exportar CSV e histórico de alterações paginado. *Dep.: T1.6, T5.3*

### Fase 6: deploy
- [ ] **T6.1** Criar o projeto na Vercel com *Root Directory* = `web`. *Dep.: T0.3*
- [ ] **T6.2** Variáveis de ambiente: *Preview* (branch `develop`) com o Supabase de homologação; *Production* com o de produção. `SUPABASE_SERVICE_ROLE_KEY` só onde for usada. *Dep.: T6.1, T0.1*
- [ ] **T6.3** No Supabase Auth de cada projeto, cadastrar a URL do site e as URLs de redirecionamento (homologação e produção). *Dep.: T6.2*
- [ ] **T6.4** Publicar `develop` e testar homologação de ponta a ponta. *Dep.: Fases 3 a 5*
- [ ] **T6.5** Aplicar as migrations em produção (**sem seed**), importar a planilha real (T1.11), criar categorias iniciais, configurações e os 3 administradores. *Dep.: T6.4, T1.11*
- [ ] **T6.6** Merge `develop` → `main`; escolher o nome do projeto na Vercel para o endereço `<nome>.vercel.app`. *Dep.: T6.5*
- [ ] **T6.7** Tarefa agendada da Vercel (`vercel.json`, uma vez por dia) que faz uma consulta leve em produção, para o Supabase gratuito não pausar o projeto. *Dep.: T6.6*
- [ ] **T6.8** GitHub Action semanal com `pg_dump` de produção, guardado como artefato num repositório privado (backup que o plano gratuito não tem). *Dep.: T6.6*

### Fase 7: qualidade
- [ ] **T7.1** GitHub Actions: lint, typecheck, Vitest e pgTAP em todo PR. *Dep.: T1.8, T2.2*
- [ ] **T7.2** Playwright: visitante vê a Prestação de contas; admin entra, registra uma despesa e ela aparece no site. *Dep.: T6.4*
- [ ] **T7.3** Auditoria de acessibilidade (teclado, contraste, leitor de tela) nas 10 telas. *Dep.: Fases 4 e 5*
- [ ] **T7.4** Teste em celular real (Android e iPhone) em homologação. *Dep.: T6.4*

### Decisões tomadas
- [x] **Endereço:** o gratuito da Vercel, `<nome>.vercel.app` (nome a escolher; ex.: `sospets-aguasclaras.vercel.app`). Homologação usa a URL de preview do branch `develop`.
- [x] **Administradores:** 3 pessoas (Barbara + duas).
- [x] **Dados reais:** importar da planilha Excel (T1.11).
- [x] **Planos:** Supabase e Vercel gratuitos, com as compensações de T6.7 e T6.8.
- [x] **Seed:** gerado por `web/scripts/gerar-seed.mjs` a partir do protótipo. A Campanha Stuart fica com R$ 1.200 arrecadados e **R$ 0 gastos**: no protótipo ela tem R$ 980 gastos, mas nenhuma despesa de agosto a outubro é do Stuart, e mudar essas despesas quebraria os totais públicos.
- [x] **Senha esquecida (T3.4):** segue o protótipo ("peça a redefinição a quem administra o sistema"): quem administra gera uma senha temporária com `scripts/adicionar-admin.ts --senha-temporaria` e a pessoa troca em `/entrar/nova-senha`. O link "Esqueci minha senha" fica para quando houver envio de e-mail próprio (o SMTP gratuito do Supabase só entrega para membros da organização).
- [x] **Administradores:** criados no painel com senha temporária (sem convite por e-mail), ligados com `scripts/adicionar-admin.ts`. Passo a passo no README.
