#!/bin/bash
# Restore do Postgres do Luz Coletiva
# Uso: ./pg-restore.sh <arquivo.sql.gz.gpg>
#
# ATENÇÃO: substitui TODO o banco atual.
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Uso: $0 <caminho-do-backup.sql.gz.gpg>"
  echo ""
  echo "Backups locais disponíveis:"
  ls -lh /opt/luzcoletiva/backups/postgres/ 2>/dev/null || echo "  (nenhum)"
  exit 1
fi

FILE="$1"
if [ ! -f "$FILE" ]; then
  echo "Arquivo não encontrado: $FILE"
  exit 1
fi

set -a
source /opt/luzcoletiva/.env
set +a

echo ""
echo "ATENÇÃO: vou SUBSTITUIR o banco '${POSTGRES_DB}' pelo conteúdo de:"
echo "  $FILE"
echo ""
read -p "Confirma? (digite RESTAURAR para prosseguir): " confirm
if [ "$confirm" != "RESTAURAR" ]; then
  echo "Abortado."
  exit 1
fi

echo "Decifrando, descomprimindo e restaurando..."
gpg --batch --yes --decrypt --passphrase "${BACKUP_PASSPHRASE}" "$FILE" \
  | gunzip \
  | docker exec -i luz-db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"

echo ""
echo "Restore concluído. Verifique os containers:"
echo "  docker compose restart backend worker"
