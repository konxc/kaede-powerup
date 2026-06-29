#!/usr/bin/env bash
set -euo pipefail

REPO="https://github.com/konxc/kaede-powerup"
INSTALL_DIR="${KAEDE_DIR:-$HOME/.kaede}"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/kaede"

BRAND='\033[35m'
GREEN='\033[32m'
YELLOW='\033[33m'
CYAN='\033[36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

logo() {
  echo ""
  echo -e "  ${BRAND}╔══════════════════════════════════════╗${NC}"
  echo -e "  ${BRAND}║         KAEDE — Installer            ║${NC}"
  echo -e "  ${BRAND}╚══════════════════════════════════════╝${NC}"
  echo ""
}

info()  { echo -e "  ${CYAN}  ${1}${NC}"; }
ok()    { echo -e "  ${GREEN}  ✓ ${1}${NC}"; }
warn()  { echo -e "  ${YELLOW}  ⚠  ${1}${NC}"; }
fail()  { echo -e "  ${YELLOW}  ✗ ${1}${NC}"; exit 1; }

check_prereqs() {
  info "Checking prerequisites..."

  if ! command -v node &>/dev/null; then
    fail "Node.js not found. Install from https://nodejs.org (v18+)"
  fi
  local node_ver=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$node_ver" -lt 18 ] 2>/dev/null; then
    fail "Node.js v18+ required (found v$(node -v))"
  fi
  ok "Node.js $(node -v)"

  if command -v bun &>/dev/null; then
    HAS_BUN=true
    ok "Bun $(bun --version)"
  else
    HAS_BUN=false
    warn "Bun not found — MCP build will use Node.js fallback"
  fi

  if ! command -v git &>/dev/null; then
    fail "Git not found. Install from https://git-scm.com"
  fi
  ok "Git $(git --version | cut -d' ' -f3)"
}

clone_or_update() {
  if [ -d "$INSTALL_DIR/.git" ]; then
    info "KAEDE already installed at $INSTALL_DIR"
    if [ "${1:-}" = "--update" ]; then
      info "Updating..."
      cd "$INSTALL_DIR"
      git pull --rebase
      ok "Updated to latest"
    else
      ok "Already up to date. Use --update to pull latest"
      exit 0
    fi
  else
    info "Installing to $INSTALL_DIR ..."
    mkdir -p "$(dirname "$INSTALL_DIR")"
    git clone --depth 1 "$REPO" "$INSTALL_DIR"
    ok "Cloned kaede-powerup"
  fi
}

install_deps() {
  info "Installing npm dependencies..."
  cd "$INSTALL_DIR"
  npm install --silent
  ok "Dependencies installed"
}

run_kaede_install() {
  info "Running kaede install (global setup)..."
  cd "$INSTALL_DIR"
  bun scripts/kaede.mjs install
}

print_next() {
  echo ""
  echo -e "  ${GREEN}${BOLD}  ✅  KAEDE installed!${NC}"
  echo ""
  echo -e "  ${DIM}  Next steps:${NC}"
  echo -e "  ${DIM}    kaede setup          — add Trello API credentials${NC}"
  echo -e "  ${DIM}    kaede init <project> — init project with KAEDE${NC}"
  echo -e "  ${DIM}    kaede status --mcp   — verify MCP connection${NC}"
  echo -e "  ${DIM}    kaede today          — view your cards${NC}"
  echo ""
  echo -e "  ${DIM}  Environment:${NC}"
  echo -e "  ${DIM}    KAEDE_DIR=$INSTALL_DIR${NC}"
  echo -e "  ${DIM}    ~/.config/opencode/opencode.json (global MCP)${NC}"
  echo -e "  ${DIM}    ~/.config/kaede/secrets.env${NC}"
  echo ""
}

uninstall() {
  local kaede_bin
  kaede_bin=$(command -v kaede || true)
  if [ -n "$kaede_bin" ]; then
    info "Unlinking global binary..."
    cd "$INSTALL_DIR" 2>/dev/null && npm unlink 2>/dev/null || true
    rm -f "$kaede_bin" 2>/dev/null || true
  fi
  if [ -d "$INSTALL_DIR" ]; then
    info "Removing $INSTALL_DIR ..."
    rm -rf "$INSTALL_DIR"
    ok "Removed $INSTALL_DIR"
  fi
  if [ -d "$CONFIG_DIR" ]; then
    echo ""
    warn "Config directory preserved: $CONFIG_DIR"
    echo -e "  ${DIM}  Remove manually: rm -rf $CONFIG_DIR${NC}"
  fi
  echo ""
  echo -e "  ${GREEN}  ✅  KAEDE uninstalled${NC}"
  echo ""
}

# ─── Main ───

ACTION="${1:-install}"

case "$ACTION" in
  --uninstall|-u)
    logo
    uninstall
    ;;
  --update|-U)
    logo
    check_prereqs
    clone_or_update --update
    install_deps
    run_kaede_install
    ;;
  install|--install|-i|*)
    logo
    check_prereqs
    clone_or_update
    install_deps
    run_kaede_install
    print_next
    ;;
esac
