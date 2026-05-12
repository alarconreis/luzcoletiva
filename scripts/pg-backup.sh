#!/bin/bash
# Backup do Postgres do Luz Coletiva
# Rotação GFS: diário (7d), semanal (4 semanas), mensal (6 meses)
# Alerta via Resend API se falhar
set -euo pipefail

# Carrega .env (agora com aspas em EMAIL_FROM)
set -a
source /opt/luzcoletiva/.env
set +a

LOG=/var/log/luz-backup.log
LOCAL_DIR=/opt/luzcoletiva/backups/postgres
TS=$(date +%Y%m%d-%H%M%S)
DOW=$(date +%u)
DOM=$(date +%d)

# Tipo do backup (decisão de retenção)
TYPE="daily"
if [ "$DOM" = "01" ]; then
  TYPE="monthly"
elif [ "$DOW" = "7" ]; then
  TYPE="weekly"
fi

DUMP_FILE="${LOCAL_DIR}/luzcoletiva-${TYPE}-${TS}.sql.gz.gpg"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"
}

send_backup_alert() {
  local exit_code="$1"
  local fail_line="$2"

  if [ -z "${RESEND_API_KEY:-}" ]; then
    log "RESEND_API_KEY não configurado — alerta não enviado"
    return 0
  fi

  ALERT_SUBJECT="[Luz Coletiva] Falha no backup PostgreSQL" \
  ALERT_BODY="Falha no backup do Luz Coletiva.

Host: $(hostname)
Data/hora: $(date)
Tipo: ${TYPE:-?}
Código de saída: ${exit_code}
Linha do erro: ${fail_line}

Log: ${LOG}" \
  ALERT_TO="${ALERT_EMAIL:-contato@luzcoletiva.com.br}" \
  ALERT_FROM="${EMAIL_FROM}" \
  RESEND_KEY="${RESEND_API_KEY}" \
  python3 <<'PYRESEND'
import json, os, urllib.request, urllib.error
payload = {
    "from": os.environ["ALERT_FROM"],
    "to": [os.environ["ALERT_TO"]],
    "subject": os.environ["ALERT_SUBJECT"],
    "text": os.environ["ALERT_BODY"],
}
req = urllib.request.Request(
    "https://api.resend.com/emails",
    data=json.dumps(payload).encode("utf-8"),
    headers={
        "Authorization": "Bearer " + os.environ["RESEND_KEY"],
        "Content-Type": "application/json",
        "User-Agent": "LuzColetiva-Backup/1.0",
    },
    method="POST",
)
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        print("Alerta enviado: HTTP", resp.status)
except urllib.error.HTTPError as e:
    body = e.read().decode("utf-8", errors="replace")[:300]
    print("Resend HTTP", e.code, body)
except Exception as e:
    print("Falha alerta:", e)
PYRESEND
}

trap 'rc=$?; log "ERRO: backup falhou (cod=${rc}, linha ${BASH_LINENO[0]})"; send_backup_alert "${rc}" "${BASH_LINENO[0]}" 2>&1 | tee -a "$LOG" || true' ERR

mkdir -p "${LOCAL_DIR}"

log "=== Iniciando backup (${TYPE}) ==="

# 1. Dump cifrado
log "Gerando dump cifrado..."
docker exec luz-db pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --clean --if-exists \
  | gzip -9 \
  | gpg --batch --yes --symmetric --cipher-algo AES256 \
        --passphrase "${BACKUP_PASSPHRASE}" \
        --output "${DUMP_FILE}"

SIZE=$(du -h "${DUMP_FILE}" | cut -f1)
log "Dump local: ${DUMP_FILE} (${SIZE})"

# 2. Upload pra B2
log "Upload pra B2..."
AWS_ACCESS_KEY_ID="${B2_KEY_ID}" \
AWS_SECRET_ACCESS_KEY="${B2_APP_KEY}" \
AWS_DEFAULT_REGION="us-east-005" \
aws s3 cp "${DUMP_FILE}" "s3://${B2_BUCKET}/postgres/${TYPE}/$(basename ${DUMP_FILE})" \
  --endpoint-url "${B2_ENDPOINT}" >> "$LOG" 2>&1

log "Upload OK"

# 3. Rotação local (mantém últimos 7 daily, 4 weekly, 6 monthly)
log "Rotação local..."
find "${LOCAL_DIR}" -name "luzcoletiva-daily-*.sql.gz.gpg" -mtime +7 -delete 2>>"$LOG" || true
find "${LOCAL_DIR}" -name "luzcoletiva-weekly-*.sql.gz.gpg" -mtime +28 -delete 2>>"$LOG" || true
find "${LOCAL_DIR}" -name "luzcoletiva-monthly-*.sql.gz.gpg" -mtime +180 -delete 2>>"$LOG" || true

# 4. Rotação remota B2
prune_remote() {
  local prefix="$1"
  local keep_days="$2"
  local cutoff
  cutoff=$(date -u -d "${keep_days} days ago" +%Y-%m-%dT%H:%M:%SZ)

  AWS_ACCESS_KEY_ID="${B2_KEY_ID}" \
  AWS_SECRET_ACCESS_KEY="${B2_APP_KEY}" \
  AWS_DEFAULT_REGION="us-east-005" \
  aws s3api list-objects-v2 \
    --bucket "${B2_BUCKET}" \
    --prefix "postgres/${prefix}/" \
    --query "Contents[?LastModified<\`${cutoff}\`].[Key]" \
    --output text \
    --endpoint-url "${B2_ENDPOINT}" 2>>"$LOG" | tr '\t' '\n' | while read -r key; do
      [ -z "$key" ] && continue
      [ "$key" = "None" ] && continue
      log "Remove (B2): ${key}"
      AWS_ACCESS_KEY_ID="${B2_KEY_ID}" \
      AWS_SECRET_ACCESS_KEY="${B2_APP_KEY}" \
      AWS_DEFAULT_REGION="us-east-005" \
      aws s3 rm "s3://${B2_BUCKET}/${key}" \
        --endpoint-url "${B2_ENDPOINT}" >> "$LOG" 2>&1 || true
    done
}

log "Rotação remota B2..."
prune_remote "daily" 7
prune_remote "weekly" 28
prune_remote "monthly" 180

log "=== Backup concluído ==="
echo "" >> "$LOG"
