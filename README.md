# 🚀 Vai Que Dá Certo! - Empregos & Recrutamento Teresina

Portal completo de oportunidades de emprego em Teresina e região, integrando vagas do **SINE-PI**, **Themos Vagas**, **Gupy** e vagas cadastradas diretamente por empresas e recrutadores.

---

## 🛠️ Tecnologias Utilizadas
- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Backend:** Node.js, Express, Cheerio, pdf-parse
- **Banco de Dados & Autenticação:** Google Firebase (Firestore & Firebase Auth)

---

## 🚀 Como Executar em Produção (Render / Cloud Run)

### Comandos de Build & Start:
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start`

### Configurações de Ambiente (Environment Variables):
Configure as seguintes variáveis de ambiente no painel da sua hospedagem (Render / Cloud Run):

| Variável | Descrição |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | Porta HTTP (ex: `3000` ou `10000`) |
| `VITE_FIREBASE_API_KEY` | Chave de API do Firebase Web |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domínio Auth do Firebase |
| `VITE_FIREBASE_PROJECT_ID` | ID do Projeto Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket do Storage do Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID do remetente do Firebase |
| `VITE_FIREBASE_APP_ID` | App ID do Firebase |
| `CRON_SECRET` | Senha segura para acionar sincronizações automáticas (`/api/cron/*`) |

---

## 📂 Estrutura do Projeto
```
├── public/               # Ativos estáticos públicos
├── server/               # Provedores de vagas (SINE-PI, Themos, Gupy)
│   ├── gupyProvider.ts
│   ├── sineProvider.ts
│   └── themosProvider.ts
├── src/                  # Aplicação React SPA
│   ├── components/       # Componentes de UI (Vagas, Filtros, Modais, etc.)
│   ├── lib/              # Configuração Firebase
│   └── types.ts          # Definições TypeScript
├── server.ts             # Servidor Express Full-stack
├── render.yaml           # Configuração de Infraestrutura como Código (Render)
├── package.json          # Dependências e Scripts
└── tsconfig.json         # Configurações TypeScript
```
