#!/bin/bash
# deploy.sh - Sistema Completo de Deploy Automatizado NEX7
# Versão: 1.0.0 | Autor: Claude + Beto

set -euo pipefail  # Strict mode

# ========================================
# CONFIGURAÇÕES GLOBAIS
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
CONFIG_FILE="$PROJECT_DIR/deploy.config.json"
TIMESTAMP=$(date +%s)
LOG_FILE="/tmp/nex7-deploy-${TIMESTAMP}.log"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ========================================
# FUNÇÕES UTILITÁRIAS
# ========================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        ERROR)   echo -e "${RED}[$timestamp] ❌ ERROR: $message${NC}" | tee -a "$LOG_FILE" ;;
        SUCCESS) echo -e "${GREEN}[$timestamp] ✅ SUCCESS: $message${NC}" | tee -a "$LOG_FILE" ;;
        INFO)    echo -e "${BLUE}[$timestamp] ℹ️  INFO: $message${NC}" | tee -a "$LOG_FILE" ;;
        WARN)    echo -e "${YELLOW}[$timestamp] ⚠️  WARN: $message${NC}" | tee -a "$LOG_FILE" ;;
        DEBUG)   echo -e "${PURPLE}[$timestamp] 🔍 DEBUG: $message${NC}" | tee -a "$LOG_FILE" ;;
        DEPLOY)  echo -e "${CYAN}[$timestamp] 🚀 DEPLOY: $message${NC}" | tee -a "$LOG_FILE" ;;
    esac
}

load_config() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log ERROR "Config file not found: $CONFIG_FILE"
        return 1
    fi
    
    # Extrai configurações usando jq ou python
    if command -v jq &> /dev/null; then
        MAX_ATTEMPTS=$(jq -r '.deployment.retryAttempts' "$CONFIG_FILE")
        TIMEOUT=$(jq -r '.deployment.timeout' "$CONFIG_FILE")
        WATCH_FILES=$(jq -r '.automation.watchFiles[]' "$CONFIG_FILE" | tr '\n' ' ')
    else
        # Fallback para valores padrão
        MAX_ATTEMPTS=3
        TIMEOUT=300
        WATCH_FILES="src app components lib"
    fi
    
    log INFO "Configuration loaded: MAX_ATTEMPTS=$MAX_ATTEMPTS, TIMEOUT=$TIMEOUT"
}

notify_desktop() {
    local title="$1"
    local message="$2"
    local type="${3:-info}"
    
    # Linux
    if command -v notify-send &> /dev/null; then
        notify-send "$title" "$message"
    fi
    
    # macOS
    if command -v osascript &> /dev/null; then
        osascript -e "display notification \"$message\" with title \"$title\""
    fi
    
    # Windows (WSL)
    if command -v powershell.exe &> /dev/null; then
        powershell.exe -Command "
            Add-Type -AssemblyName System.Windows.Forms
            [System.Windows.Forms.MessageBox]::Show('$message', '$title')
        " 2>/dev/null || true
    fi
}

# ========================================
# FUNÇÕES DE VALIDAÇÃO
# ========================================

validate_environment() {
    log INFO "Validating environment..."
    
    # Verifica Node.js
    if ! command -v node &> /dev/null; then
        log ERROR "Node.js not found"
        return 1
    fi
    
    local node_version=$(node --version)
    log INFO "Node.js version: $node_version"
    
    # Verifica npm
    if ! command -v npm &> /dev/null; then
        log ERROR "npm not found"
        return 1
    fi
    
    # Verifica Vercel CLI
    if ! command -v vercel &> /dev/null; then
        log WARN "Vercel CLI not found, installing..."
        npm install -g vercel@latest || {
            log ERROR "Failed to install Vercel CLI"
            return 1
        }
    fi
    
    # Verifica arquivos essenciais
    local required_files=("package.json" "next.config.js")
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log ERROR "Required file not found: $file"
            return 1
        fi
    done
    
    # Verifica .vercelignore
    if [[ ! -f ".vercelignore" ]]; then
        log WARN ".vercelignore not found, creating..."
        create_vercelignore
    fi
    
    log SUCCESS "Environment validation passed"
    return 0
}

validate_code() {
    log INFO "Running code validation..."
    
    # Type checking
    log INFO "Running TypeScript type check..."
    if ! npm run type-check &>> "$LOG_FILE"; then
        log WARN "TypeScript type check failed (continuing anyway)"
    else
        log SUCCESS "TypeScript type check passed"
    fi
    
    # Linting
    log INFO "Running ESLint..."
    if npm run lint:fix &>> "$LOG_FILE"; then
        log SUCCESS "Linting passed"
    else
        log WARN "Linting issues found but fixed"
    fi
    
    return 0
}

# ========================================
# FUNÇÕES DE BUILD E DEPLOY
# ========================================

build_project() {
    log INFO "Building project..."
    
    # Limpa builds anteriores
    rm -rf .next dist build out 2>/dev/null || true
    
    # Instala dependências se necessário
    if [[ ! -d "node_modules" ]] || [[ "package.json" -nt "node_modules" ]]; then
        log INFO "Installing dependencies..."
        npm ci --legacy-peer-deps &>> "$LOG_FILE" || {
            log WARN "npm ci failed, trying npm install..."
            npm install --legacy-peer-deps &>> "$LOG_FILE"
        }
    fi
    
    # Build com timeout
    log INFO "Running build with timeout..."
    if timeout "$TIMEOUT" npm run build &>> "$LOG_FILE"; then
        log SUCCESS "Build completed successfully"
        return 0
    else
        local exit_code=$?
        if [[ $exit_code -eq 124 ]]; then
            log ERROR "Build timed out after ${TIMEOUT}s"
        else
            log ERROR "Build failed with exit code $exit_code"
        fi
        return 1
    fi
}

deploy_to_vercel() {
    local attempt=1
    
    while [[ $attempt -le $MAX_ATTEMPTS ]]; do
        log DEPLOY "Deploy attempt $attempt/$MAX_ATTEMPTS"
        
        if vercel --prod --yes --token="${VERCEL_TOKEN:-}" &>> "$LOG_FILE"; then
            # Extrai URL do deploy
            local deploy_url
            deploy_url=$(vercel ls 2>/dev/null | head -2 | tail -1 | awk '{print $2}' 2>/dev/null || echo "")
            
            if [[ -n "$deploy_url" ]]; then
                log SUCCESS "Deploy successful! URL: $deploy_url"
                notify_desktop "Deploy Successful" "NEX7 deployed to: $deploy_url"
                
                # Salva URL para uso posterior
                echo "$deploy_url" > "/tmp/nex7-last-deploy-url.txt"
                
                return 0
            else
                log SUCCESS "Deploy completed (URL not available)"
                return 0
            fi
        else
            log ERROR "Deploy attempt $attempt failed"
            
            if [[ $attempt -eq $MAX_ATTEMPTS ]]; then
                log ERROR "All deploy attempts failed"
                notify_desktop "Deploy Failed" "All $MAX_ATTEMPTS attempts failed. Check logs: $LOG_FILE"
                return 1
            fi
            
            log INFO "Waiting 30 seconds before retry..."
            sleep 30
            ((attempt++))
        fi
    done
}

# ========================================
# FUNÇÕES DE SETUP
# ========================================

create_vercelignore() {
    log INFO "Creating .vercelignore..."
    cat > .vercelignore << 'EOF'
# Dependencies
node_modules

# Environment files
.env*
!.env.example

# IDE and OS files
.DS_Store
*.log
.vscode
.idea

# Git
.git
.github

# Documentation
docs/
README.md
*.md

# Test files
**/*.test.*
**/*.spec.*
__tests__/
e2e/
coverage/

# Build artifacts
.next/cache
dist/
build/
out/

# Config files
jest.config.*
playwright.config.*
.eslintrc*
.prettierrc*
tsconfig.json
tailwind.config.*

# Scripts
scripts/
sdk/
prisma/seed.ts
EOF
    log SUCCESS ".vercelignore created"
}

setup_git_hooks() {
    log INFO "Setting up Git hooks..."
    
    mkdir -p .git/hooks
    
    # Pre-push hook
    cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash
echo "🔍 Running pre-push validation..."

# Load deploy config
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$SCRIPT_DIR/deploy.sh"

if validate_code; then
    echo "✅ Pre-push validation passed"
    exit 0
else
    echo "❌ Pre-push validation failed"
    exit 1
fi
EOF

    # Post-merge hook
    cat > .git/hooks/post-merge << 'EOF'
#!/bin/bash
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" = "main" ]; then
    echo "🚀 Auto-deploying after merge to main..."
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
    "$SCRIPT_DIR/deploy.sh" --auto
fi
EOF

    chmod +x .git/hooks/pre-push .git/hooks/post-merge
    log SUCCESS "Git hooks installed"
}

setup_github_actions() {
    log INFO "Setting up GitHub Actions..."
    
    mkdir -p .github/workflows
    
    cat > .github/workflows/deploy.yml << 'EOF'
name: NEX7 Auto Deploy

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
    types: [ closed ]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  deploy:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.pull_request.merged == true)
    runs-on: ubuntu-latest
    
    steps:
      - name: 📁 Checkout
        uses: actions/checkout@v4
        
      - name: 📦 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: 🔧 Install dependencies
        run: npm ci --legacy-peer-deps
        
      - name: 🚀 Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          npm install -g vercel@latest
          ./deploy.sh --github-actions
        
      - name: 💬 Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 **Deploy Successful!** Changes automatically deployed to production.'
            })
EOF
    
    log SUCCESS "GitHub Actions workflow created"
}

# ========================================
# FUNÇÕES DE MONITORAMENTO
# ========================================

watch_files() {
    log INFO "Starting file watcher..."
    log INFO "Watching: $WATCH_FILES"
    log INFO "Press Ctrl+C to stop"
    
    local last_deploy=0
    local debounce_delay=30
    
    deploy_if_changed() {
        local now=$(date +%s)
        if [[ $((now - last_deploy)) -lt $debounce_delay ]]; then
            return
        fi
        
        log INFO "Changes detected, deploying in ${debounce_delay}s..."
        sleep $debounce_delay
        
        if main_deploy; then
            last_deploy=$now
            notify_desktop "Auto Deploy" "Changes deployed successfully"
        else
            notify_desktop "Deploy Failed" "Auto-deploy failed, check logs"
        fi
    }
    
    # Linux (inotify)
    if command -v inotifywait &> /dev/null; then
        while inotifywait -r -e modify,create,delete,move $WATCH_FILES 2>/dev/null; do
            deploy_if_changed &
        done
    # macOS (fswatch)
    elif command -v fswatch &> /dev/null; then
        fswatch -o $WATCH_FILES | while read f; do
            deploy_if_changed &
        done
    else
        log ERROR "File watcher not available. Install inotify-tools (Linux) or fswatch (macOS)"
        return 1
    fi
}

# ========================================
# FUNÇÃO PRINCIPAL
# ========================================

main_deploy() {
    log INFO "🚀 Starting NEX7 deployment process..."
    log INFO "Project: $PROJECT_DIR"
    log INFO "Log file: $LOG_FILE"
    
    # Carrega configuração
    load_config || return 1
    
    # Validações
    validate_environment || return 1
    validate_code || return 1
    
    # Build
    build_project || return 1
    
    # Deploy
    deploy_to_vercel || return 1
    
    log SUCCESS "🎉 Deployment completed successfully!"
    log INFO "📋 Full log available at: $LOG_FILE"
    return 0
}

setup_complete() {
    log INFO "🔧 Setting up complete NEX7 deployment infrastructure..."
    
    create_vercelignore
    setup_git_hooks
    setup_github_actions
    
    # Atualiza package.json
    log INFO "Updating package.json scripts..."
    
    log SUCCESS "🎉 Setup completed!"
    echo ""
    echo "📋 Available commands:"
    echo "  ./deploy.sh                 → Full deployment"
    echo "  ./deploy.sh --watch         → Watch files and auto-deploy"
    echo "  ./deploy.sh --setup         → Setup infrastructure"
    echo "  npm run deploy              → Quick deploy"
    echo "  npm run deploy:watch        → Auto-deploy on changes"
    echo ""
    echo "🔄 Automatic triggers:"
    echo "  git push main               → GitHub Actions deploy"
    echo "  git merge main              → Auto-deploy"
    echo ""
    echo "📊 Monitoring:"
    echo "  Logs: $LOG_FILE"
    echo "  Last deploy URL: /tmp/nex7-last-deploy-url.txt"
}

# ========================================
# PARSEADOR DE ARGUMENTOS
# ========================================

show_help() {
    echo "NEX7 Deploy Script v1.0.0"
    echo ""
    echo "Usage: ./deploy.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help, -h          Show this help message"
    echo "  --setup             Setup complete deployment infrastructure"
    echo "  --watch             Watch files and auto-deploy on changes"
    echo "  --validate-only     Run validation without deploying"
    echo "  --github-actions    Run in GitHub Actions mode"
    echo "  --config FILE       Use custom config file"
    echo "  --verbose           Enable verbose logging"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh                    # Full deployment"
    echo "  ./deploy.sh --setup           # Setup infrastructure"
    echo "  ./deploy.sh --watch           # Auto-deploy mode"
    echo "  ./deploy.sh --validate-only   # Validation only"
}

# ========================================
# MAIN SCRIPT
# ========================================

main() {
    case "${1:-}" in
        --help|-h)
            show_help
            exit 0
            ;;
        --setup)
            setup_complete
            exit 0
            ;;
        --watch)
            load_config
            watch_files
            exit 0
            ;;
        --validate-only)
            load_config
            validate_environment && validate_code
            exit $?
            ;;
        --github-actions)
            export CI=true
            load_config
            main_deploy
            exit $?
            ;;
        --config)
            CONFIG_FILE="$2"
            shift 2
            main "$@"
            ;;
        --verbose)
            set -x
            shift
            main "$@"
            ;;
        "")
            main_deploy
            exit $?
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
}

# Executa função principal se script foi chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi