# 🌞 Luz Coletiva

> **Iluminando vidas juntos.**
>
> Plataforma de solidariedade que conecta pessoas que precisam de ajuda com quem pode oferecer apoio.

[![CI](https://github.com/alarconreis/luzcoletiva/actions/workflows/ci.yml/badge.svg)](https://github.com/alarconreis/luzcoletiva/actions/workflows/ci.yml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Status](https://img.shields.io/badge/Status-Early%20stage-orange.svg)]()

🌐 **Produção**: [luzcoletiva.com.br](https://luzcoletiva.com.br)
📝 **Blog**: [Doação online sem golpe](https://luzcoletiva.com.br/blog/doacao-online-sem-golpe-luz-coletiva)
🔒 **Política de segurança**: [SECURITY.md](./SECURITY.md)

---

## ⚠️ Status do projeto

A Luz Coletiva está em **fase inicial**. O código está aberto para fins de:

- Transparência técnica com parceiros institucionais
- Auditoria por profissionais de segurança
- Aprendizado para quem quer construir tecnologia social com rigor

Não há garantias de SLA, suporte ou estabilidade. Use por sua conta e risco se decidir fork/self-host.

---

## ✨ O que é

Plataforma para conectar:

- **Solicitantes**: pessoas que precisam de ajuda concreta (fraldas, cesta básica, materiais escolares, etc.)
- **Ajudantes**: pessoas que querem doar bens ou recursos
- **Parceiros institucionais**: ONGs, igrejas, CRAS, abrigos que cadastram pedidos em nome de pessoas vulneráveis sem acesso digital (atendimento assistido)

**Diferenciais:**

- Verificação de identidade real (RG + selfie + revisão humana)
- Atendimento assistido (parceiros cadastram em nome de quem não tem smartphone)
- Privacy by design (LGPD como fundação)
- Auditável tecnicamente (este repositório)

---

## 🏗️ Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | React + Vite + TailwindCSS | React 18 |
| Servidor web | Caddy (TLS + reverse proxy) | 2.11.3 |
| Backend | FastAPI + Uvicorn | 0.121 / Python 3.12 |
| Tarefas assíncronas | Celery + Redis | 5.4 / 7.4 |
| Banco de dados | PostgreSQL | 16.14 |
| Containerização | Docker + Docker Compose | - |
| Autenticação | JWT HS256 + TOTP 2FA pra admin | RFC 6238 |
| Cifragem de documentos | AES-256-GCM (HKDF-SHA256) | - |
| Email | Resend API | - |
| Storage de backup | Backblaze B2 (S3-compatible) | - |
| Analytics | Google Analytics 4 (com consent LGPD) | - |
| CDN/Proxy | Cloudflare | - |

---

## 🎨 Identidade visual

- **Cores principais**: `#FFD54F` (sol) · `#4FC3F7` (céu) · `#81C784` (verde)
- **Tipografia**: Poppins (títulos) + Open Sans (textos)
- **Logo**: quatro pessoas interligadas formando um sol
- **Slogan**: *"Iluminando vidas juntos."*

---

## 🚀 Rodando localmente

⚠️ **Requer**: Docker + Docker Compose v2

```bash
git clone https://github.com/alarconreis/luzcoletiva.git
cd luzcoletiva

# Configura .env com seus próprios valores
cp .env.example .env
# Edita .env (JWT_SECRET, POSTGRES_PASSWORD, RESEND_API_KEY, etc.)

# Sobe os containers
docker compose up -d

# Acessa em http://localhost:5173 (frontend)
# API docs em http://localhost:8000/docs
```

Para desenvolvimento local sem Docker, veja [CLAUDE.md](./CLAUDE.md).

---

## 🔒 Segurança

Veja [SECURITY.md](./SECURITY.md) para:

- Política de reporte de vulnerabilidades
- CVE Tracker (histórico de patches)
- Defesas implementadas (auth, autz, dados, network)
- Rotinas operacionais (backup, monitoramento)
- Histórico de incidentes documentados com transparência

---

## 🤝 Contribuindo

Este é um projeto pessoal mantido por **Vinicius Reis** (gerente CSIRT) em horário livre.

**Aceito contribuições** de:

- 🐛 Bug reports detalhados (via Issues)
- 🔒 Reports de vulnerabilidade (via email — ver SECURITY.md)
- 📝 Sugestões de melhoria
- 🎨 Pull requests pequenas e bem documentadas

**Não aceito ainda:**

- Refatorações grandes sem discussão prévia
- Mudanças de design / identidade visual
- Features fora do escopo MVP

Para discussões, abra uma Issue ou me chame no [LinkedIn](https://www.linkedin.com/in/reisvi).

---

## 📜 Licença

Este projeto está sob **GNU Affero General Public License v3** ([AGPL v3](./LICENSE)).

Resumindo: você pode usar, modificar e redistribuir, **mas** se rodar versão modificada em serviço público (SaaS), **DEVE liberar o código-fonte das suas modificações**.

Escolhi AGPL v3 porque acredito que tecnologia social deve permanecer aberta e acessível à comunidade.

---

## 📬 Contato

- **Email**: alarconreis@gmail.com
- **LinkedIn**: [linkedin.com/in/reisvi](https://www.linkedin.com/in/reisvi)
- **Site**: [luzcoletiva.com.br](https://luzcoletiva.com.br)
- **Vulnerabilidades**: ver [SECURITY.md](./SECURITY.md)
