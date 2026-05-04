# 🌞 Luz Coletiva

> **Iluminando vidas juntos.**
>
> Plataforma de solidariedade que conecta pessoas que precisam de ajuda
> com quem pode oferecer apoio. Cada interação ilumina uma vida —
> literalmente e simbolicamente.

---

## ✨ Visão geral

Luz Coletiva é um MVP funcional construído como base sólida e modular,
pronto para evoluir com novas funcionalidades (match, geolocalização,
reputação, etc.).

| Camada              | Tecnologia                          |
| ------------------- | ----------------------------------- |
| Frontend            | React 18 + Vite + TailwindCSS       |
| Backend             | Python 3.12 + FastAPI               |
| Tarefas assíncronas | Celery + Redis                      |
| Banco de dados      | PostgreSQL 16                       |
| Containerização     | Docker + Docker Compose             |
| Autenticação        | JWT (HS256)                         |
| Hash de senha       | bcrypt                              |

---

## 🎨 Identidade visual

- **Cores**: `#FFD54F` (sol) · `#4FC3F7` (céu) · `#81C784` (verde) · `#424242` (cinza) · `#1565C0` (footer)
- **Tipografia**: Poppins (títulos) + Open Sans (textos)
- **Logo**: quatro pessoas interligadas formando um sol — símbolo da união e luz compartilhada
- **Slogan**: *"Iluminando vidas juntos."*

---

## 📁 Estrutura

```
luzcoletiva/
├── backend/
│   ├── app/
│   │   ├── core/         → config, database, security, deps
│   │   ├── models/       → User
│   │   ├── schemas/      → Pydantic
│   │   ├── routes/       → auth, profile, stories
│   │   ├── tasks/        → Celery + email
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/   → Logo, Header, Hero, Cards, Footer...
│   │   ├── pages/        → Home, Login, Register, Dashboard
│   │   ├── context/      → AuthContext (JWT)
│   │   ├── services/     → api.js (axios)
│   │   ├── App.jsx, main.jsx, index.css
│   ├── public/favicon.svg
│   ├── package.json, vite.config.js, tailwind.config.js
│   ├── nginx.conf
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Como rodar localmente

### Pré-requisitos

- Docker 24+ e Docker Compose v2
- Porta `80` e `8000` livres

### Passos

```bash
# 1. Clone e entre no diretório
git clone <seu-repo> luzcoletiva
cd luzcoletiva

# 2. Copie o env de exemplo e edite os segredos
cp .env.example .env

# Gere um JWT_SECRET forte:
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
# cole o valor em JWT_SECRET no .env
# também troque POSTGRES_PASSWORD

# 3. Suba todos os serviços
docker compose up -d --build

# 4. Acompanhe os logs (opcional)
docker compose logs -f backend worker
```

### Acessos

| Serviço          | URL                            |
| ---------------- | ------------------------------ |
| Frontend         | http://localhost               |
| API (direto)     | http://localhost:8000          |
| Documentação API | http://localhost:8000/docs     |
| Healthcheck      | http://localhost:8000/health   |

---

## 🔌 Endpoints da API

Todos os endpoints estão sob o prefixo `/api`.

| Método | Rota                   | Auth | Descrição                              |
| ------ | ---------------------- | :--: | -------------------------------------- |
| POST   | `/api/register`        |  —   | Cadastro + e-mail de boas-vindas async |
| POST   | `/api/login`           |  —   | Retorna JWT                            |
| GET    | `/api/profile`         |  ✅  | Dados do usuário autenticado           |
| GET    | `/api/profile/history` |  ✅  | Histórico mock de interações           |
| GET    | `/api/stories`         |  —   | Histórias inspiradoras (mock)          |
| GET    | `/health`              |  —   | Healthcheck                            |

### Exemplo: cadastro

```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ana Silva",
    "email": "ana@exemplo.com",
    "password": "senhaSegura123",
    "profile_type": "helper"
  }'
```

Resposta (`201 Created`):

```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "Ana Silva",
    "email": "ana@exemplo.com",
    "profile_type": "helper",
    "is_verified": false,
    "created_at": "2026-05-01T19:30:00Z"
  }
}
```

### Exemplo: requisição autenticada

```bash
curl http://localhost:8000/api/profile \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 🔐 Notas de segurança (MVP)

Decisões já implementadas:

- ✅ **bcrypt** com custo padrão (12) para hash de senha
- ✅ **JWT HS256** com `exp` e `iat`, segredo via env (nunca em código)
- ✅ **Mensagem genérica** em login (`"Credenciais inválidas"`) — não vaza enumeração de e-mails
- ✅ Auto-logout em `401` no interceptor do axios
- ✅ Container do backend roda como **usuário não-root** (`appuser`)
- ✅ Headers de segurança no nginx: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`
- ✅ `task_time_limit=60s` no Celery — evita workers travados
- ✅ Validação Pydantic em todas as entradas

Antes de produção, recomenda-se ainda:

- 🔲 **Rate limiting** em `/login` e `/register` (sugestão: `slowapi`)
- 🔲 **HTTPS** via Nginx/Traefik com Let's Encrypt
- 🔲 **Alembic** para migrations versionadas (substituir `create_all`)
- 🔲 **Refresh tokens** + revogação (Redis allowlist)
- 🔲 **CSP** (Content Security Policy) restrita no nginx
- 🔲 Log de auditoria (logins, alterações de perfil)
- 🔲 **Verificação de e-mail** real (token de confirmação)
- 🔲 **2FA** opcional via TOTP

---

## 🧪 Desenvolvimento sem Docker

### Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Suba só o Postgres e Redis via Docker
docker compose up -d db redis

# Rode a API
export DATABASE_URL="postgresql+psycopg2://luzcoletiva:luzcoletiva@localhost:5432/luzcoletiva"
export JWT_SECRET="dev-secret-trocar"
export REDIS_URL="redis://localhost:6379/0"
export CELERY_BROKER_URL="redis://localhost:6379/0"
uvicorn app.main:app --reload

# Em outro terminal — worker do Celery
celery -A app.tasks.celery_app.celery_app worker --loglevel=info
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# abre em http://localhost:5173
```

---

## 🐳 Deploy em VPS Linux (Ubuntu 22.04+)

### 1. Preparar o servidor

```bash
# Como root ou com sudo
apt update && apt upgrade -y
apt install -y docker.io docker-compose-plugin git ufw

systemctl enable --now docker

# Firewall básico
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 2. Clonar e configurar

```bash
git clone <seu-repo> /opt/luzcoletiva
cd /opt/luzcoletiva
cp .env.example .env

# Edite com segredos REAIS de produção
nano .env
# - JWT_SECRET: gere com python -c "import secrets; print(secrets.token_urlsafe(64))"
# - POSTGRES_PASSWORD: senha forte
# - DEBUG=false
# - CORS_ORIGINS=https://seu-dominio.com
# - SMTP_*: provedor real (SES, Postmark, etc.)
```

### 3. Subir

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f
```

### 4. Adicionar HTTPS (Caddy é o caminho mais simples)

Crie `/opt/luzcoletiva/Caddyfile`:

```
seu-dominio.com {
    reverse_proxy localhost:80
}
```

Rode em outro container ou instale Caddy direto na VPS — ele cuida do
Let's Encrypt automaticamente.

### 5. Backup

```bash
# Backup do Postgres (automatize com cron)
docker exec luz-db pg_dump -U luzcoletiva luzcoletiva | gzip > backup-$(date +%F).sql.gz
```

---

## 🗺️ Roadmap pós-MVP

- [ ] Sistema de match entre solicitação e oferta
- [ ] Geolocalização (PostGIS) para encontros próximos
- [ ] Sistema de reputação e feedback
- [ ] Chat seguro entre usuários
- [ ] Notificações push (web + e-mail)
- [ ] Painel administrativo + moderação
- [ ] Verificação de identidade opcional
- [ ] App mobile (React Native)

---

## 👥 Contribuindo

Esse projeto cresce com gente. Pull requests, issues e ideias são bem-vindos.

Antes de abrir PR:

1. Rode `docker compose up --build` e confirme que tudo sobe
2. Não commitar `.env` nem segredos
3. Mantenha o estilo das classes Tailwind e a paleta da marca

---

## 📄 Licença

A definir pela equipe Luz Coletiva.

---

**Feito com ☀️ pela comunidade — porque ninguém ilumina sozinho.**
