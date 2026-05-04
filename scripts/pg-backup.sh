#!/bin/bash
# Backup do Postgres do Luz Coletiva
# Rotação GFS: diário (7d), semanal (4 semanas), mensal (6 meses)
set -euo pipefail

# Carrega .env
set -a
source /opt/luzcoletiva/.env
set +a

LOG=/var/log/luz-backup.log
LOCAL_DIR=/opt/luzcoletiva/backups/postgres
TS=$(date +%Y%m%d-%H%M%S)
DOW=$(date +%u)        # 1-7 (segunda=1)
DOM=$(date +%d)        # 01-31

# Tipo do backup do dia (decisão de retenção)
TYPE="daily"
if [ "$DOM" = "01" ]; then
  TYPE="monthly"
elif [ "$DOW" = "7" ]; then  # domingo
  TYPE="weekly"
fi

DUMP_FILE="${LOCAL_DIR}/luzcoletiva-${TYPE}-${TS}.sql.gz.gpg"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"
}

send_backup_alert() {
  local exit_code="$1"
  local fail_line="$2"

  if [ -z "${SMTP_HOST:-}" ]; then
    log "SMTP não configurado — alerta de falha não enviado por e-mail"
    return 0
  fi

  ALERT_SUBJECT="[Luz Coletiva] Falha no backup PostgreSQL — $(date '+%Y-%m-%d')" \
  ALERT_BODY="Falha no backup PostgreSQL do Luz Coletiva.

Host: $(hostname)
Data/hora: $(date)
Tipo de backup: ${TYPE:-desconhecido}
Código de saída: ${exit_code}
Linha do erro: ${fail_line}

Verifique o log em: ${LOG}" \
  ALERT_TO="${ALERT_EMAIL:-contato@luzcoletiva.com.br}" \
  ALERT_FROM="${SMTP_FROM:-no-reply@luzcoletiva.com.br}" \
  ALERT_HOST="${SMTP_HOST}" \
  ALERT_PORT="${SMTP_PORT:-587}" \
  ALERT_USER="${SMTP_USER:-}" \
  ALERT_PASS="${SMTP_PASSWORD:-}" \
  python3 - <<'PYEOF'
import smtplib, os
from email.message import EmailMessage

msg = EmailMessage()
msg["Subject"] = os.environ["ALERT_SUBJECT"]
msg["From"]    = os.environ["ALERT_FROM"]
msg["To"]      = os.environ["ALERT_TO"]
msg.set_content(os.environ["ALERT_BODY"])

try:
    with smtplib.SMTP(os.environ["ALERT_HOST"], int(os.environ["ALERT_PORT"]), timeout=10) as s:
        user = os.environ.get("ALERT_USER", "")
        pwd  = os.environ.get("ALERT_PASS", "")
        if user and pwd:
            s.starttls()
            s.login(user, pwd)
        s.send_message(msg)
    print(f"Alerta enviado para {os.environ['ALERT_TO']}")
except Exception as e:
    print(f"Falha ao enviar alerta de backup: {e}")
PYEOF
}

# Dispara alerta por e-mail se o script abortar com erro
trap 'rc=$?; log "ERRO: backup falhou (código ${rc}, linha ${BASH_LINENO[0]})"; send_backup_alert "${rc}" "${BASH_LINENO[0]}" 2>&1 | tee -a "$LOG" || true' ERR

log "=== Iniciando backup (${TYPE}) ==="

# 1. pg_dump (rodando dentro do container db) | gzip | gpg → arquivo local
log "Gerando dump cifrado..."
docker exec luz-db pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --clean --if-exists \
  | gzip -9 \
  | gpg --batch --yes --symmetric --cipher-algo AES256 \
        --passphrase "${BACKUP_PASSPHRASE}" \
        --output "${DUMP_FILE}"

SIZE=$(du -h "${DUMP_FILE}" | cut -f1)
log "Dump local criado: ${DUMP_FILE} (${SIZE})"

# 2. Upload pro B2
log "Fazendo upload pro B2..."
AWS_ACCESS_KEY_ID="${B2_KEY_ID}" \
AWS_SECRET_ACCESS_KEY="${B2_APP_KEY}" \
aws s3 cp "${DUMP_FILE}" "s3://${B2_BUCKET}/postgres/${TYPE}/$(basename ${DUMP_FILE})" \
  --endpoint-url "${B2_ENDPOINT}" \
  >> "$LOG" 2>&1

log "Upload concluído"

# 3. Rotação local
log "Aplicando rotação local..."
# Diários: manter 7
find "${LOCAL_DIR}" -name "luzcoletiva-daily-*.sql.gz.gpg" -mtime +7 -delete -print | tee -a "$LOG"
# Semanais: manter 4 semanas (28 dias)
find "${LOCAL_DIR}" -name "luzcoletiva-weekly-*.sql.gz.gpg" -mtime +28 -delete -print | tee -a "$LOG"
# Mensais: manter 6 meses (~180 dias)
find "${LOCAL_DIR}" -name "luzcoletiva-monthly-*.sql.gz.gpg" -mtime +180 -delete -print | tee -a "$LOG"

# 4. Rotação remota (B2) — usa --query do aws cli
prune_remote() {
  local prefix="$1"
  local keep_days="$2"
  local cutoff
  cutoff=$(date -u -d "${keep_days} days ago" +%Y-%m-%dT%H:%M:%SZ)

  AWS_ACCESS_KEY_ID="${B2_KEY_ID}" \
  AWS_SECRET_ACCESS_KEY="${B2_APP_KEY}" \
  aws s3api list-objects-v2 \
    --bucket "${B2_BUCKET}" \
    --prefix "postgres/${prefix}/" \
    --query "Contents[?LastModified<\`${cutoff}\`].[Key]" \
    --output text \
    --endpoint-url "${B2_ENDPOINT}" 2>>"$LOG" | tr '\t' '\n' | while read -r key; do
      [ -z "$key" ] && continue
      [ "$key" = "None" ] && continue
      log "Removendo do B2 (antigo): ${key}"
      AWS_ACCESS_KEY_ID="${B2_KEY_ID}" \
      AWS_SECRET_ACCESS_KEY="${B2_APP_KEY}" \
      aws s3 rm "s3://${B2_BUCKET}/${key}" \
        --endpoint-url "${B2_ENDPOINT}" >> "$LOG" 2>&1 || true
    done
}

log "Aplicando rotação remota (B2)..."
prune_remote "daily" 7
prune_remote "weekly" 28
prune_remote "monthly" 180

log "=== Backup concluído com sucesso ==="
echo "" >> "$LOG"
