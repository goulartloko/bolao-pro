# ⚽ BOLÃO PRO - SaaS de Palpites de Futebol Automatizado

Aplicação Web completa, moderna e mobile-first para gerenciamento de bolões de futebol por **Rodada (Semanal)** ou **Liga Mensal**, com pagamento automatizado via **Pix (Mercado Pago API)**, **Webhook de aprovação instantânea**, **Painel Administrativo completo** e **Ranking em tempo real com recálculo automático de pontuações**.

---

## 🚀 Tecnologias Utilizadas

- **Framework Web**: [Next.js 14](https://nextjs.org/) (App Router, Server Components & Route Handlers)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/) (Design Mobile-First, paleta temática esportiva Arena Neon)
- **Banco de Dados & ORM**: [Prisma ORM](https://www.prisma.io/) com suporte nativo a **PostgreSQL** (Supabase, Neon, Docker) e **SQLite** (desenvolvimento local imediato zero-config)
- **Autenticação**: Sessão JWT segura via Cookies `HttpOnly` com hash de senha `bcryptjs`
- **Gateway de Pagamento Pix**: SDK oficial do [Mercado Pago](https://www.mercadopago.com.br/developers) com geração de QR Code Base64, Pix Copia e Cola, Webhook em tempo real e modo simulador integrado
- **Componentes Visuais**: [Lucide React](https://lucide.dev/), [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) para celebrações

---

## 🏆 Funcionalidades Principais

### 1. Interface do Usuário (Mobile-First / Foco Instagram)
- **Landing Page de Alta Conversão**:
  - Destaque claro do **Valor do Prêmio**, **Valor da Inscrição no Pix** e **Cronômetro Regressivo** de tempo limite para envio de palpites.
  - Vitrine com jogos da rodada e classificação dos líderes.
- **Cadastro Simplificado**:
  - Nome completo, E-mail, WhatsApp (com DDD) e Senha.
- **Fluxo de Pagamento via Pix**:
  - Geração automática de QR Code e código Pix Copia e Cola.
  - Polling e Webhook bancário para liberação imediata da inscrição.
  - Modo Simulador de Teste com 1 clique para homologação sem custo.
- **Tela de Palpites Exclusiva**:
  - Liberada somente após a confirmação do Pix.
  - Controles de placar com toque rápido (+ / -) e bloqueio automático no horário de início de cada partida.
- **Ranking e Classificação em Tempo Real**:
  - Pódio visual do 1º, 2º e 3º lugares.
  - Tabela com posição, placares cravados e pontuação acumulada.
  - Botões para compartilhamento no **WhatsApp** e **Instagram Stories**.

### 2. Painel Administrativo (Admin Control)
- **Visão Geral & Dashboard Executivo**:
  - Total arrecadado no Pix, inscritos pagos, jogos processados e palpites registrados.
- **Configuração do Bolão Ativo**:
  - Tipo de competição: Por Rodada (Semanal) ou Liga Mensal.
  - Valor da entrada Pix e valor do prêmio garantido.
  - Regras de pontuação customizáveis: **Placar Exato** (ex: 10 pts), **Vencedor/Empate** (ex: 5 pts) e **Saldo de Gols** (ex: 2 pts).
  - Prazos e datas limites.
- **Gestão de Partidas da Rodada**:
  - Cadastro de novos jogos (mandante, visitante, estádio, data/horário).
  - **Inserção do Placar Final**: dispara o motor de cálculo automático (`scoreEngine`) que atualiza instantaneamente as pontuações de todos os palpites e o ranking dos participantes.
- **Gestão de Participantes e Pix**:
  - Listagem com filtro por Pagos e Pendentes e busca por nome/WhatsApp.
  - **Aprovação Manual (Contingência Pix)** para liberação de acesso imediata.

---

## 📂 Arquitetura e Estrutura de Pastas

```
BOALO/
├── prisma/
│   ├── schema.prisma              # Schema ativo do Prisma
│   ├── schema.postgresql.prisma   # Schema oficial para PostgreSQL / Supabase
│   ├── schema.sqlite.prisma       # Schema zero-config para SQLite local
│   └── dev.db                     # Banco SQLite local populado
├── scripts/
│   └── seed.mjs                   # Script para popular rodada, jogos e participantes
├── src/
│   ├── app/
│   │   ├── admin/                 # Painel Administrativo
│   │   │   ├── bolao/             # Configuração da Dinâmica do Bolão
│   │   │   ├── jogos/             # Gestão de Jogos e Placares Finais
│   │   │   ├── participantes/     # Gestão de Inscritos e Contingência Pix
│   │   │   ├── layout.tsx         # Sidebar e controle de acesso Admin
│   │   │   └── page.tsx           # Dashboard executivo com métricas
│   │   ├── api/                   # Route Handlers
│   │   │   ├── admin/             # Endpoints administrativos
│   │   │   ├── auth/              # Cadastro, Login, Logout e Me
│   │   │   ├── payment/           # Criação e status do Pix
│   │   │   ├── predictions/       # Envio e consulta de palpites
│   │   │   └── webhooks/mercadopago/ # Webhook oficial Mercado Pago
│   │   ├── bolao/[id]/
│   │   │   ├── pagamento/         # Tela de Pagamento Pix com QR Code
│   │   │   ├── palpites/          # Tela de Palpites com bloqueio inteligente
│   │   │   └── ranking/           # Tabela de Classificação e Compartilhamento
│   │   ├── globals.css            # Estilização temática esportiva arena
│   │   ├── layout.tsx             # Layout raiz com BottomNav mobile
│   │   └── page.tsx               # Landing Page Principal
│   ├── components/
│   │   ├── AuthModal.tsx          # Modal de Login e Cadastro mobile
│   │   ├── BottomNav.tsx          # Navegação inferior nativa para celulares
│   │   ├── CountdownTimer.tsx     # Cronômetro regressivo dinâmico
│   │   └── Navbar.tsx             # Topbar responsivo com dados do usuário
│   └── lib/
│       ├── auth.ts                # Autenticação JWT, bcrypt e sessões
│       ├── pixService.ts          # Integração Mercado Pago + Simulador
│       ├── prisma.ts              # Conexão singleton Prisma Client
│       └── scoreEngine.ts         # Motor de cálculo e ranking automático
├── .env                           # Variáveis de ambiente
├── .env.example                   # Modelo de variáveis de ambiente
└── package.json                   # Dependências e scripts
```

---

## ⚡ Como Rodar o Projeto Localmente

### 1. Clonar ou Acessar a Pasta do Projeto
```bash
cd "c:\Users\empre\OneDrive\Área de Trabalho\BOALO"
```

### 2. Instalar as Dependências (já instaladas)
```bash
npm install
```

### 3. Banco de Dados e Dados Iniciais (Seed)
O projeto já está configurado e semeado com partidas e ranking de demonstração. Caso queira recriar:
```bash
npx prisma db push
npm run seed
```

### 4. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse no seu navegador: **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Credenciais de Demonstração (Seed)

| Perfil | E-mail | Senha | WhatsApp |
|---|---|---|---|
| **Administrador** | `admin@bolao.com` | `admin123` | (11) 98888-7777 |
| **Jogador 1** | `lucas@exemplo.com` | `123456` | (11) 99999-1111 |
| **Jogador 2** | `mariana@exemplo.com` | `123456` | (21) 98888-2222 |

---

## 💳 Configuração do Pix (Mercado Pago API)

No arquivo `.env`:
```env
# Obtenha em: https://www.mercadopago.com.br/developers/panel
MERCADO_PAGO_ACCESS_TOKEN="APP_USR-seu-access-token"
MERCADO_PAGO_PUBLIC_KEY="APP_USR-sua-public-key"
MERCADO_PAGO_WEBHOOK_SECRET="seu-webhook-secret"

# Defina a URL pública (usando ngrok ou domínio de produção para receber o webhook)
NEXT_PUBLIC_APP_URL="https://seubolao.com.br"

# Desative o simulador para exigir pagamentos reais da API
ENABLE_PIX_SIMULATOR=false
```

> **Dica**: Em ambiente local (`localhost:3000`), a flag `ENABLE_PIX_SIMULATOR=true` permite que o sistema gere QR Codes Pix simulados válidos e disponibiliza o botão **"Simular Aprovação Instantânea"** para testar todo o fluxo sem gastar dinheiro real!

---

## 🗄️ Conectando ao PostgreSQL / Supabase em Produção

1. Obtenha a connection string no **Supabase** (ou Neon / PostgreSQL):
   ```env
   DATABASE_URL="postgresql://postgres:[SENHA]@[HOST]:5432/postgres?schema=public"
   ```
2. Alterne para o schema PostgreSQL:
   ```bash
   npm run db:use-postgres
   npm run seed
   ```
3. Para voltar ao SQLite local em qualquer momento:
   ```bash
   npm run db:use-sqlite
   ```

---

## 🎯 Regras do Motor de Pontuação (`scoreEngine.ts`)

Quando o Administrador insere o Placar Final de uma partida no painel:
1. **Placar Exato Cravado**:
   - Atribui os pontos de placar exato (padrão: **+10 pts**).
   - Incrementa a contagem de `exactScoresCount` (critério de desempate #1).
2. **Acerto de Vencedor ou Empate com Saldo de Gols**:
   - Atribui os pontos de vencedor + saldo de gols (padrão: **5 + 2 = 7 pts**).
3. **Acerto Apenas de Vencedor ou Empate**:
   - Atribui os pontos de vencedor (padrão: **+5 pts**).
4. **Reclassificação em Tempo Real**:
   - Soma todos os pontos de cada participante.
   - Aplica os critérios de desempate:
     1. Maior pontuação total.
     2. Maior número de placares exatos cravados.
     3. Maior número de acertos de vencedores.
   - Atualiza a posição oficial no ranking (`rankPosition`).
