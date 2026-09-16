#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  METHA OFFSHORE v2 – Script de Deploy em VPS compartilhada
#  Uso: ./deploy.sh [--update]
#  Pré-requisitos: Docker instalado; nginx nativo já rodando no host
#  (este app NÃO sobe nginx próprio — usa o nginx do host na porta 8081,
#   para não conflitar com outros sites já hospedados na VPS)
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔] $1${NC}"; }
warn() { echo -e "${YELLOW}[!] $1${NC}"; }
err()  { echo -e "${RED}[✗] $1${NC}"; exit 1; }

[[ -f ".env" ]] || err ".env não encontrado. Copie .env.example para .env e preencha."
source .env
[[ -z "${JWT_SECRET:-}" ]]         && err "JWT_SECRET não definida no .env"
[[ -z "${JWT_REFRESH_SECRET:-}" ]] && err "JWT_REFRESH_SECRET não definida no .env"
[[ -z "${ADMIN_SENHA:-}" ]]        && err "ADMIN_SENHA não definida no .env"

if [[ "${1:-}" == "--update" ]]; then
  log "Modo update: reconstruindo imagem da aplicação..."
  docker compose build --no-cache app
  docker compose up -d
  log "Update concluído!"
else
  log "Primeira instalação. Subindo o container da aplicação (porta interna 3001, somente localhost)..."
  docker compose up -d --build

  if [[ ! -f /etc/nginx/sites-available/metha-offshore ]]; then
    log "Instalando site nginx nativo (porta 8081)..."
    cp nginx/default.conf /etc/nginx/sites-available/metha-offshore
    ln -sf /etc/nginx/sites-available/metha-offshore /etc/nginx/sites-enabled/metha-offshore
    nginx -t && systemctl reload nginx
    log "Site nginx instalado e recarregado."
  else
    warn "Site nginx 'metha-offshore' já existe, não sobrescrevendo. Edite manualmente se necessário."
  fi
fi

echo ""
echo "════════════════════════════════════════════════════"
log "Metha Offshore v2 rodando!"
echo -e "  ${GREEN}→${NC} Web:   http://$(hostname -I | awk '{print $1}'):8081"
echo -e "  ${GREEN}→${NC} Admin: ${ADMIN_EMAIL:-admin@methaoffshore.com.br}"
echo "════════════════════════════════════════════════════"
