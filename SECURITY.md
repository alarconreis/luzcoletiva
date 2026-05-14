# Security Policy

## Reportando uma vulnerabilidade

Se você encontrou uma vulnerabilidade de segurança no Luz Coletiva, **não abra um issue público**. Em vez disso, envie um e-mail para:

**alarconreis@gmail.com** com o assunto `[SECURITY] descrição breve`

Inclua:
- Descrição da vulnerabilidade
- Passos para reproduzir
- Impacto potencial
- Sua sugestão de mitigação (opcional)

Responderemos em até **72 horas úteis**.

---

## Escopo

Esta política cobre:

- Plataforma web `luzcoletiva.com.br` (frontend + backend)
- API REST em `api.luzcoletiva.com.br`
- Infraestrutura de produção (Docker, Caddy, PostgreSQL, Redis)

**Fora do escopo:**
- Vulnerabilidades em dependências de terceiros já divulgadas publicamente
- Engenharia social contra membros do projeto
- DoS via volume (a infra usa Cloudflare)

---

## CVE Tracker

### Crítico não afetado

| CVE | CVSS | Componente | Status | Verificado |
|-----|------|------------|--------|------------|
| CVE-2026-42945 (NGINX Rift) | 9.2 | NGINX rewrite_module | Não afetado, projeto usa Caddy v2.11.3 | 2026-05-14 |

### Patcheado

| CVE | CVSS | Componente | Versão | Commit |
|-----|------|------------|--------|--------|
| CVE-2024-47081 | 6.5 | requests | 2.32.3 to 2.33.0 | 65dfa05 |
| CVE-2026-25645 | 5.3 | requests | 2.32.3 to 2.33.0 | 65dfa05 |
| CVE-2026-34073 | 3.7 | cryptography | 46.0.5 to 46.0.7 | 65dfa05 |
| CVE-2026-39892 | 6.5 | cryptography | 46.0.5 to 46.0.7 | 65dfa05 |
| CVE-2026-2003 a 2007 | 4.0-8.1 | PostgreSQL | série 16 to 16.13 | base image |

### Mitigações aplicadas

| Categoria | Mitigação | Commit |
|-----------|-----------|--------|
| Path traversal | safe_path_under em 4 endpoints FileResponse | 65dfa05 |
| CRLF log injection | _safe_log sanitiza CR/LF antes de logar | 65dfa05 |
| Authentication | TOTP 2FA obrigatório para admin (RFC 6238) | 3344840 |
| Storage RG/selfies | AES-256-GCM com HKDF-SHA256 | inicial |
| Session cookies | HttpOnly + SameSite strict + Secure | inicial |

---

## Stack em produção

Estado atual (atualizado em 2026-05-14):

- Frontend: Caddy 2.11.3 + React 18 + Vite
- Backend: FastAPI 0.121.0 / Uvicorn / Python 3.12.13
- Database: PostgreSQL 16.13 (Alpine 3.23.4)
- Cache: Redis 7.4.9
- Async: Celery + Redis
- Crypto: cryptography 46.0.7 / pyotp 2.9.0
- TLS: Cloudflare Origin Certificate (proxy via Cloudflare)

---

## Rotinas de segurança

### Diárias

- Backup PostgreSQL automatizado às 04:00 BRT (GPG AES-256 + B2)
- Rotação GFS: 7 daily, 4 weekly, 6 monthly
- Alerta via Resend em caso de falha
- Audit log de ações administrativas

### Mensais

- docker compose pull + rebuild --no-cache
- Trivy scan local + baseline diff
- Semgrep scan (Code + Supply Chain)
- Review de admin audit log

### Trimestrais

- Pentest manual de endpoints sensíveis
- Re-scan ZAP autenticado
- Review de política de privacidade vs práticas reais

---

## Defesas implementadas

### Autenticação

- JWT HS256, exp 60 min
- Cookie session HttpOnly + SameSite strict + Secure
- TOTP 2FA obrigatório para admin
- 10 backup codes bcrypt-hashados, one-time use
- SMS OTP via ClickSend (usuários comuns)
- Rate limiting OTP: 5/24h user, 3/h user, 20/h IP
- bcrypt cost 12

### Autorização

- RBAC 3 roles: user, moderator, admin
- require_admin / require_moderator
- Audit log de ações sensíveis

### Dados sensíveis

- AES-256-GCM para RG/selfie (HKDF-SHA256)
- TOTP secrets cifrados na DB
- IPs anonimizados em GA
- Consentimento explícito de cookies (LGPD)

### Network

- HTTPS obrigatório (Caddy + Cloudflare)
- HSTS, CSP restritiva
- X-Frame-Options DENY
- X-Content-Type-Options nosniff
- Referrer-Policy strict-origin-when-cross-origin
- SSH porta não-padrão (22022)

### Aplicação

- Path traversal: safe_path_under valida resolved path
- SQL injection: SQLAlchemy ORM exclusivo
- XSS: React escaping nativo
- CSRF: SameSite strict cookies
- File upload: magic bytes + UUID filenames
- Rate limiting (slowapi): 30/min endpoints sensíveis

---

## Histórico de incidentes

Nenhum incidente reportado até a data desta política.

---

Política mantida por: Vinicius Reis (alarconreis@gmail.com) - Gerente CSIRT
Última revisão: 2026-05-14
