#!/bin/bash
# BOTÃO DE PÂNICO: abre 80/443 pra todo mundo (caso Cloudflare esteja fora do ar).
# Use SÓ em emergência. Restaure depois com:
#   sudo /opt/luzcoletiva/scripts/cloudflare-update.sh
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Rode com sudo."
  exit 1
fi

echo "ATENÇÃO: vou abrir 80/443 pra TODO MUNDO."
echo "Isso desfaz a proteção Cloudflare-only."
echo "Use só se Cloudflare estiver fora do ar e você precisa debugar."
read -p "Confirma? (digite ABRIR): " c
[ "$c" = "ABRIR" ] || { echo "Abortado."; exit 1; }

ufw allow 80/tcp comment 'EMERGENCY'
ufw allow 443/tcp comment 'EMERGENCY'
ufw reload

echo "FEITO. 80/443 abertos pra geral."
echo "Quando terminar, restaure com:"
echo "  sudo /opt/luzcoletiva/scripts/cloudflare-update.sh"
