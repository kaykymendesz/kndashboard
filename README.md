# K&N Dashboard

Painel de gestão interno da **K&N Desenvolvimento de Software** (Mendes & Anaya Desenvolvimento de Software LTDA), criado para Elaine e Kayky controlarem finanças, cronograma, atividades, clientes e dados da empresa.

## Funcionalidades

- **Visão Geral** — indicadores financeiros e resumo operacional
- **Financeiro** — gráficos, rateio Elaine/Kayky e saldos pendentes
- **Gastos** — CRUD completo com categorias, parcelas e status
- **Cronograma** — marcos, prazos e valores previstos vs. realizados
- **Atividades** — controle de tarefas do projeto (importadas da planilha)
- **Clientes** — cadastro de clientes e contratos
- **Dados da Empresa** — informações jurídicas, marca, infraestrutura

## Stack

- [Next.js 16](https://nextjs.org) + TypeScript
- [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS
- [Neon PostgreSQL](https://neon.tech) + Drizzle ORM
- [NextAuth.js](https://authjs.dev) — login Elaine & Kayky
- Deploy: [Vercel](https://vercel.com)

## Configuração local

### 1. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string do Neon Postgres |
| `AUTH_SECRET` | Segredo para sessões (`openssl rand -base64 32`) |
| `AUTH_ELAINE_EMAIL` | E-mail de login da Elaine |
| `AUTH_ELAINE_PASSWORD` | Senha da Elaine |
| `AUTH_KAYKY_EMAIL` | E-mail de login do Kayky |
| `AUTH_KAYKY_PASSWORD` | Senha do Kayky |

### 2. Banco de dados (Neon)

1. Crie um projeto gratuito em [console.neon.tech](https://console.neon.tech)
2. Copie a connection string para `DATABASE_URL`
3. Execute:

```bash
npm run db:push
npm run db:seed
```

### 3. Rodar localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) e faça login.

## Deploy na Vercel

1. Faça push para [github.com/kaykymendesz/kndashboard](https://github.com/kaykymendesz/kndashboard)
2. Importe o repositório na [Vercel](https://vercel.com/new)
3. Adicione as variáveis de ambiente (mesmas do `.env.local`)
4. Instale a integração **Neon** no Marketplace da Vercel (provisiona `DATABASE_URL` automaticamente)
5. Após o deploy, rode o seed uma vez:

```bash
# Com DATABASE_URL de produção configurada localmente:
npm run db:push
npm run db:seed
```

## Login padrão (desenvolvimento)

| Usuário | E-mail | Senha |
|---------|--------|-------|
| Elaine | `elaine@kn.dev` | `elaine2026` |
| Kayky | `kayky@kn.dev` | `kayky2026` |

> Altere as senhas nas variáveis de ambiente antes do deploy em produção.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run db:push` | Sincroniza schema com o Neon |
| `npm run db:seed` | Importa dados da planilha inicial |

---

Desenvolvido com ❤️ por K&N — Elaine Rebelo Anaya & Kayky Medes da Silva
