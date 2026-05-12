#!/bin/bash
# Atualiza ranges Cloudflare (UFW + DOCKER-USER) e reaplica regras.
# Roda mensalmente via cron. Logs em /var/log/cloudflare-update.log
set -uo pipefail
LOG=/var/log/cloudflare-update.log
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"; }

log "=== Iniciando atualização ==="

TMPV4=$(mktemp)
TMPV6=$(mktemp)
trap "rm -f $TMPV4 $TMPV6" EXIT

curl -sf https://www.cloudflare.com/ips-v4 -o "$TMPV4" || { log "ERRO download IPv4"; exit 1; }
curl -sf https://www.cloudflare.com/ips-v6 -o "$TMPV6" || { log "ERRO download IPv6"; exit 1; }

V4_COUNT=$(wc -l < "$TMPV4")
V6_COUNT=$(wc -l < "$TMPV6")
if [ "$V4_COUNT" -lt 10 ] || [ "$V6_COUNT" -lt 5 ]; then
  log "ERRO: lista parece incompleta (v4=$V4_COUNT, v6=$V6_COUNT). Não aplicando."
  exit 1
fi

if cmp -s "$TMPV4" /etc/cloudflare/ips-v4 && cmp -s "$TMPV6" /etc/cloudflare/ips-v6; then
  log "Sem mudanças nos ranges Cloudflare."
  exit 0
fi

log "Ranges mudaram. Reaplicando UFW + DOCKER-USER..."
cp "$TMPV4" /etc/cloudflare/ips-v4
cp "$TMPV6" /etc/cloudflare/ips-v6

# === UFW ===
ufw status numbered | grep cloudflare | awk -F'[][]' '{print $2}' | sort -rn | while read -r n; do
  echo "y" | ufw delete "$n" >/dev/null 2>&1 || true
done

while IFS= read -r ip; do
  [ -z "$ip" ] && continue
  ufw allow from "$ip" to any port 80 proto tcp comment 'cloudflare' >/dev/null
  ufw allow from "$ip" to any port 443 proto tcp comment 'cloudflare' >/dev/null
done < /etc/cloudflare/ips-v4

while IFS= read -r ip; do
  [ -z "$ip" ] && continue
  ufw allow from "$ip" to any port 80 proto tcp comment 'cloudflare' >/dev/null
  ufw allow from "$ip" to any port 443 proto tcp comment 'cloudflare' >/dev/null
done < /etc/cloudflare/ips-v6

ufw reload

# === DOCKER-USER ===
iptables -F DOCKER-USER
ip6tables -F DOCKER-USER

while IFS= read -r ip; do
  [ -z "$ip" ] && continue
  iptables -A DOCKER-USER -p tcp -s "$ip" --dport 80  -j ACCEPT -m comment --comment "cf"
  iptables -A DOCKER-USER -p tcp -s "$ip" --dport 443 -j ACCEPT -m comment --comment "cf"
done < /etc/cloudflare/ips-v4

while IFS= read -r ip; do
  [ -z "$ip" ] && continue
  ip6tables -A DOCKER-USER -p tcp -s "$ip" --dport 80  -j ACCEPT -m comment --comment "cf"
  ip6tables -A DOCKER-USER -p tcp -s "$ip" --dport 443 -j ACCEPT -m comment --comment "cf"
done < /etc/cloudflare/ips-v6

iptables  -A DOCKER-USER -p tcp --dport 80  -j DROP -m comment --comment "block-non-cf"
iptables  -A DOCKER-USER -p tcp --dport 443 -j DROP -m comment --comment "block-non-cf"
ip6tables -A DOCKER-USER -p tcp --dport 80  -j DROP -m comment --comment "block-non-cf"
ip6tables -A DOCKER-USER -p tcp --dport 443 -j DROP -m comment --comment "block-non-cf"

netfilter-persistent save >/dev/null 2>&1 || true

log "Atualização concluída. UFW + DOCKER-USER reaplicados."
