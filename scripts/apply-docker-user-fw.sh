#!/bin/bash
# DOCKER-USER: bloqueia tráfego ENTRANDO em containers vindo de fora,
# mas NÃO bloqueia tráfego SAINDO dos containers pra internet.
#
# Truque: usar -o (interface de SAÍDA) na regra de DROP. Tráfego entrando
# em containers tem out=br-76d46cf4c74b (a bridge). Tráfego saindo tem
# out=ens3 (interface externa do host).
set -uo pipefail

if [ "$(id -u)" -ne 0 ]; then echo "Rode com sudo."; exit 1; fi

V4=/etc/cloudflare/ips-v4
V6=/etc/cloudflare/ips-v6

# Descobre a interface bridge do compose project (luzcoletiva_luz-net)
BRIDGE_IF=$(docker network inspect luzcoletiva_luz-net 2>/dev/null \
  | grep -oP '"Id": "\K[^"]+' | head -c 12)
BRIDGE_IF="br-${BRIDGE_IF}"

if ! ip link show "$BRIDGE_IF" >/dev/null 2>&1; then
  echo "ERRO: bridge $BRIDGE_IF não existe."
  echo "Bridges disponíveis:"
  ip -br link | grep "^br-"
  exit 1
fi

echo "==> Bridge alvo: $BRIDGE_IF"

echo "==> Flush DOCKER-USER (v4 + v6)"
iptables  -F DOCKER-USER
ip6tables -F DOCKER-USER

echo "==> Permitindo ESTABLISHED,RELATED no topo"
iptables  -A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
ip6tables -A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

echo "==> ACCEPT explícito pra Cloudflare → bridge (NEW)"
while IFS= read -r ip; do
  [ -z "$ip" ] && continue
  iptables -A DOCKER-USER -p tcp -s "$ip" -o "$BRIDGE_IF" --dport 80  -m conntrack --ctstate NEW -j ACCEPT -m comment --comment "cf"
  iptables -A DOCKER-USER -p tcp -s "$ip" -o "$BRIDGE_IF" --dport 443 -m conntrack --ctstate NEW -j ACCEPT -m comment --comment "cf"
done < "$V4"

while IFS= read -r ip; do
  [ -z "$ip" ] && continue
  ip6tables -A DOCKER-USER -p tcp -s "$ip" -o "$BRIDGE_IF" --dport 80  -m conntrack --ctstate NEW -j ACCEPT -m comment --comment "cf"
  ip6tables -A DOCKER-USER -p tcp -s "$ip" -o "$BRIDGE_IF" --dport 443 -m conntrack --ctstate NEW -j ACCEPT -m comment --comment "cf"
done < "$V6"

echo "==> DROP catch-all SÓ pra tráfego ENTRANDO na bridge (NEW)"
# A flag -o $BRIDGE_IF é a chave: só dropa se o pacote vai PRA bridge
# (= internet→container). Tráfego container→internet vai pra ens3, não bate.
iptables  -A DOCKER-USER -p tcp -o "$BRIDGE_IF" --dport 80  -m conntrack --ctstate NEW -j DROP -m comment --comment "block-non-cf"
iptables  -A DOCKER-USER -p tcp -o "$BRIDGE_IF" --dport 443 -m conntrack --ctstate NEW -j DROP -m comment --comment "block-non-cf"
ip6tables -A DOCKER-USER -p tcp -o "$BRIDGE_IF" --dport 80  -m conntrack --ctstate NEW -j DROP -m comment --comment "block-non-cf"
ip6tables -A DOCKER-USER -p tcp -o "$BRIDGE_IF" --dport 443 -m conntrack --ctstate NEW -j DROP -m comment --comment "block-non-cf"

echo ""
echo "=== DOCKER-USER ==="
iptables -L DOCKER-USER -n --line-numbers | head -10
echo "..."
iptables -L DOCKER-USER -n --line-numbers | tail -5
