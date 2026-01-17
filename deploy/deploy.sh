#!/usr/bin/env bash
#
# Deploy to Cloudflare Pages using Wrangler CLI
#
# Usage:
#   ./deploy/deploy.sh              # Deploy to production
#   ./deploy/deploy.sh preview      # Deploy preview
#
# Prerequisites:
#   - wrangler CLI installed: npm install -g wrangler
#   - Authenticated: wrangler login

set -euo pipefail

PROJECT_NAME="faturinha"
BUILD_DIR="dist"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if wrangler is installed
check_wrangler() {
    if ! command -v wrangler &> /dev/null; then
        log_error "wrangler CLI not found. Install with: npm install -g wrangler"
        exit 1
    fi
}

# Build the project
build_project() {
    log_info "Building project..."
    npm run build

    if [[ ! -d "$BUILD_DIR" ]]; then
        log_error "Build directory '$BUILD_DIR' not found after build"
        exit 1
    fi

    log_info "Build complete"
}

# Deploy to Cloudflare Pages
deploy() {
    local branch="${1:-}"

    log_info "Deploying to Cloudflare Pages..."

    if [[ -n "$branch" ]]; then
        wrangler pages deploy "$BUILD_DIR" \
            --project-name "$PROJECT_NAME" \
            --branch "$branch"
    else
        wrangler pages deploy "$BUILD_DIR" \
            --project-name "$PROJECT_NAME"
    fi

    log_info "Deployment complete!"
}

main() {
    local mode="${1:-production}"

    check_wrangler

    log_info "Starting deployment (mode: $mode)"

    build_project

    case "$mode" in
        preview)
            # Preview deployments use a non-production branch
            deploy "preview-$(date +%Y%m%d-%H%M%S)"
            ;;
        production|*)
            deploy
            ;;
    esac
}

main "$@"
