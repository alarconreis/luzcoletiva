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
| CVE-2026-2003 a 2007 | 4.0-8.1 | PostgreSQL | 16.x to 16.13 | base image |
| CVE-2026-2008+ (11 CVEs) | até 8.8 | PostgreSQL | 16.13 to 16.14 | base image 2026-05-15 |

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
- Database: PostgreSQL 16.14 (Alpine 3.23.4)
- Cache: Redis 7.4.9
- Async: Celery + Redis
- Crypto: cryptography 46.0.7 / pyotp 2.9.0
- TLS: Cloudflare Origin Certificate (proxy via Cloudflare)

---

## Rotinas de segurança

### Diárias

- Backup PostgreSQL automatizado às 04:00 BRT (GPG AES-256 + B2)
- Rotação GFS: 7 daily, 4 weekly, 6 monthly
- Alerta via Resend em caso de falha (interno ao script)
- Heartbeat externo via Healthchecks.io (detecta falha silenciosa do próprio script)
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
- Email OTP via Resend (fallback 2FA para usuários sem TOTP)
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

## CI/CD em ação (defesa em camadas)

Casos onde o GitHub Actions CI capturou problemas **antes** do merge em main, evitando incidentes em produção. Esta seção documenta o valor concreto do pipeline.

### 2026-05-19 — Starlette 0.49.1 → 0.52.1 (PR #27)

**Cenário**: Dependabot abriu PR pra atualizar Starlette de 0.49.1 → 0.52.1.

**Detecção pelo CI**: backend job falhou no comando `pip install -r requirements.txt` com o seguinte erro:

```
ERROR: Cannot install -r requirements.txt and starlette==0.52.1 because 
these package versions have conflicting dependencies.

The conflict is caused by:
  The user requested starlette==0.52.1
  fastapi 0.121.0 depends on starlette<0.50.0 and >=0.40.0
```

**Análise**:
- Dependabot avalia pacotes em isolamento, ignora constraints transitivos
- FastAPI 0.121 fixa Starlette < 0.50 nas próprias constraints
- Upgrade isolado de Starlette é fisicamente impossível sem bump do FastAPI

**Decisão**: PR #27 fechada. Starlette só será atualizado quando o FastAPI release uma versão que relaxe a constraint.

**Valor demonstrado**:
- Sem CI: merge poderia ter passado, falhado no build em produção, gerado downtime até revert
- Com CI: detecção em ~60 segundos, custo zero, decisão informada antes de qualquer impacto

---

### 2026-05-21 — CodeQL (GitHub Code Scanning) ativado — 6 alerts triados

Ativado o GitHub Code Scanning (CodeQL) no repositório. Primeira varredura gerou 6 alerts, triados com análise de contexto:

**Corrigido (1 issue real, 2 alerts):**
- Workflow CI sem `permissions` explícitas (alerts #1, #2 — Medium). Aplicado princípio do menor privilégio: `permissions: contents: read`. O CI só faz build, então read-only basta.

**Dispensados como falso positivo (4 alerts):**
- `blog.py` — "uncontrolled data in path expression" (#3, #4 — High). O filename é sanitizado antes do uso: rejeita separadores e navegação de path (`PurePosixPath(filename).name == filename`), exige correspondência no banco e valida `is_file()`. Defesa em camadas que o CodeQL não consegue provar estaticamente.
- `VerifyIdentity.jsx` — "DOM text reinterpreted as HTML" (#5, #6 — High). Os previews vêm de `URL.createObjectURL()` sobre arquivo selecionado pelo próprio usuário, usados em `<img src>` (não em `innerHTML`/`dangerouslySetInnerHTML`). Sem reinterpretação de texto como HTML nem vetor de XSS.

**Aprendizado**: SAST é conservador por design (prefere falso positivo a falso negativo). A triagem com conhecimento do contexto é parte essencial do processo — nem todo alerta é vulnerabilidade. As correções e dispensas ficam registradas no painel de Code Scanning com justificativa técnica.

---

## Decisões de arquitetura de segurança

### 2026-05-20 — Remoção de SMS OTP, migração para Email OTP

**Contexto**: SMS OTP (via ClickSend) era usado como 2FA de fallback para usuários sem TOTP configurado. Custava mínimo de US$ 20 em créditos e dependia de fornecedor externo.

**Análise de risco**:
- A verificação de identidade da plataforma é feita via documento (RG) + selfie + revisão humana — camada forte de anti-fraude.
- O SMS OTP verificava posse temporária de um aparelho, não identidade. Para fins anti-fraude, é redundante com a verificação documental já existente.
- O telefone deixa de ser verificado por SMS, mas permanece no cadastro como dado de contato (não é canal crítico). Validação de formato (regex BR) garante plausibilidade.
- O 2FA de login **não foi removido** — foi substituído por Email OTP (via Resend, já presente no stack, sem custo adicional). Mantém o segundo fator para usuários sem TOTP.

**Decisão**: remover ClickSend/SMS, migrar OTP de login para email.

**Benefícios**:
- Elimina custo recorrente e dependência de fornecedor (menor superfície de terceiros)
- Mantém 2FA equivalente para usuários sem TOTP
- Consolida comunicação num único provedor (Resend), já monitorado via email_log

**Validação**: fluxo testado end-to-end (geração, envio, verificação, anti-replay single-use, rejeição de código incorreto). Email registrado em email_log com success=true.

**Evolução futura**: tornar TOTP obrigatório para todos os perfis quando a base crescer, aposentando o Email OTP de fallback.

---

## Riscos aceitos (Risk Acceptance)

Decisões documentadas em que vulnerabilidades conhecidas foram analisadas e o risco residual foi aceito, com justificativa técnica.

### 2026-05-18 — esbuild 0.21.5 (CVE-2026-39365)

**Vulnerabilidade**: esbuild < 0.25.0 permite que qualquer site mande requisições ao dev-server e leia respostas (origin validation error).

**Severidade**: Moderate (CVSS 5.3)

**Análise**:
- esbuild é dependência transitiva do Vite 5.x
- A vulnerabilidade afeta apenas o **dev-server** (`npm run dev`)
- Produção usa Dockerfile multi-stage:
  - Stage 1 (build): node:20 + vite/esbuild roda 1x pra gerar `/dist`
  - Stage 2 (runtime): caddy:2-alpine serve `/dist` estático
- Imagem final em produção **não contém** node, vite ou esbuild
- Superfície de ataque em produção: zero

**Decisão**: aceitar risco residual em desenvolvimento.

**Mitigações**:
- Dev-server local (Vinicius) bind em 127.0.0.1 quando possível
- Avaliação de upgrade pra Vite 6+ adiada (breaking changes em @vitejs/plugin-react)

**Reavaliação**: próxima janela de patching mensal ou se nova CVE escalar severity.

### 2026-05-18 — Vite 5.4.21 (CVE-2026-39365 — falso positivo)

**Sintoma**: Dependabot abriu PR #13 propondo Vite ^5.4.8 → ^8.0.13.

**Análise**:
- Affected versions oficiais: <= 6.4.1
- `package.json` declara `vite ^5.4.8` (range semver)
- `package-lock.json` instala **5.4.21** (última patch da série 5.x)
- Vite 5.x **não está** no range vulnerável
- Dependabot reporta o alerta porque lê apenas `package.json` (constraint) sem consultar lockfile

**Decisão**: nenhuma ação técnica necessária. Vite 5.4.21 já é segura.

PR #13 fechada por análise técnica. Alert no GitHub dismissado como "Risk tolerable".

---

## Histórico de incidentes

### 2026-05-15 — Falha silenciosa de backup automatizado

**Sintoma**: backups remotos no Backblaze B2 pararam em 12/maio. Última subida automática 22:24 BRT. Janela de 3 dias sem backup novo no remote.

**Causa raiz**: cron tentava escrever output em `/var/log/luz-backup-cron.log` que não existia mais (provavelmente apagado por logrotate ou cleanup). User `reis` não tem permissão de escrita em `/var/log/`. Script morria na primeira linha de redirect, antes de executar a lógica de backup ou de alerta.

**Detecção**: manual. Gerente verificou bucket B2 e notou ausência de uploads recentes.

**Impacto**: nenhum dado perdido. Backups locais e remotos antigos intactos. Plataforma em fase inicial com pouca movimentação durante o gap.

**Correção aplicada**:
- Cron output movido pra `/opt/luzcoletiva/logs/backup-cron.log` (diretório do projeto, com permissão do user reis)
- Permissão garantida em `/var/log/luz-backup.log` (chown reis:reis)
- Validado: cron disparou em horário agendado, log gerou, backup subiu pro B2

**Lições aprendidas**:
- Lógica de alerta dentro do próprio script é insuficiente — script morto não consegue alertar
- Backup mensal e semanal também ficaram com gap (cron único quebrou todos os tipos)
- Necessário monitor heartbeat externo

**Ações de follow-up**:
- Implementado heartbeat externo via Healthchecks.io em 2026-05-15
- 3 endpoints: `/start`, `/ok`, `/fail`
- Schedule cron `0 7 * * *` UTC (04:00 BRT) com grace period de 2 horas
- Alertas via email (alarconreis@gmail.com)
- Validado ponta a ponta (canal direto + script forçado a falhar)
- Defesa em camadas: alerta interno (Resend) + alerta externo (Healthchecks)

**Status**: RESOLVIDO em 2026-05-15 11:44 BRT — hardening adicional em 2026-05-15 15:47 BRT

---

Política mantida por: Vinicius Reis (alarconreis@gmail.com) - Gerente CSIRT
Última revisão: 2026-05-21
