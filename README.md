# SOS Pets DF Águas Claras

Site de prestação de contas do grupo de voluntários SOS Pets DF Águas Claras: quanto entrou, quanto saiu e como estão os pets. A área do administrador registra contribuições, despesas, pets, membros e campanhas.

- Especificação, escopo e tarefas: [SPEC.md](SPEC.md)
- Regras para quem programa (e para o Claude Code): [CLAUDE.md](CLAUDE.md)
- Protótipo de design (HTML estático): [sospets-design/sospets-kit/design/](sospets-design/sospets-kit/design/)
- App (Next.js + Supabase): [web/](web/)

## Rodar o app

```bash
cd web
cp .env.example .env.local   # preencha com as chaves do projeto de homologação
npm install
npm run dev
```

## Administradores

Só administradores entram na área do administrador (`/entrar`). O cadastro público é desligado: cada pessoa é criada por quem já administra o projeto no Supabase.

### Adicionar um administrador

1. No [painel do Supabase](https://supabase.com/dashboard), abra o projeto (`sospets-homolog` ou `sospets-prod`) → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Preencha o **e-mail**, uma **senha temporária** e marque **Auto Confirm User**. Clique em **Create user**.
3. Ligue o usuário à tabela de administradores, com o nome que aparece no histórico de alterações (o `.env.local` precisa apontar para o mesmo projeto, com a `SUPABASE_SERVICE_ROLE_KEY`):
   ```bash
   cd web
   node --env-file=.env.local scripts/adicionar-admin.ts pessoa@exemplo.com "Nome da Pessoa"
   ```
   Em produção, o script só roda com `PRODUCAO=sim` na frente do comando.
4. Passe a senha temporária para a pessoa por um canal privado (nunca em grupo).
5. A pessoa entra em `/entrar` e troca a senha em `/entrar/nova-senha`.

### Esqueceu a senha

Quem esquecer a senha fala com quem administra o projeto, que gera uma senha temporária (rode no seu terminal; a senha aparece só para você):

```bash
node --env-file=.env.local scripts/adicionar-admin.ts pessoa@exemplo.com --senha-temporaria
```

Passe a senha por um canal privado; a pessoa entra e troca em `/entrar/nova-senha`.

### Tirar o acesso

```bash
node --env-file=.env.local scripts/adicionar-admin.ts pessoa@exemplo.com --desativar
```

O usuário continua existindo (o histórico mostra quem fez cada alteração), mas não entra mais. Para devolver o acesso, rode o comando de adicionar de novo.
