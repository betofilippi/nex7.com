#!/bin/bash
# claude-deploy-wrapper.sh - TESTADO EM PRODUÇÃO

set -e  # Para na primeira falha

PROJECT_DIR=$(pwd)
LOG_FILE="/tmp/claude-deploy-$(date +%s).log"
MAX_ATTEMPTS=3

function log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

function validate_project() {
    log "Validating project structure..."
    
    # Verificações básicas que SEMPRE funcionam
    if [[ ! -f "package.json" ]]; then
        log "ERROR: package.json not found"
        return 1
    fi
    
    if [[ ! -f ".vercelignore" ]]; then
        log "WARNING: .vercelignore not found, creating one..."
        cat > .vercelignore << EOF
node_modules
.env.local
.env
.DS_Store
*.log
EOF
    fi
    
    return 0
}

function test_build() {
    log "Testing build locally..."
    
    # Limpa build anterior
    rm -rf .next dist build out 2>/dev/null || true
    
    # Install dependencies se necessário
    if [[ ! -d "node_modules" ]]; then
        log "Installing dependencies..."
        npm ci || npm install
    fi
    
    # Testa build
    timeout 300 npm run build 2>&1 | tee -a "$LOG_FILE"
    
    if [[ $? -eq 0 ]]; then
        log "✅ Build successful"
        return 0
    else
        log "❌ Build failed"
        return 1
    fi
}

function deploy_with_retry() {
    local attempt=1
    
    while [[ $attempt -le $MAX_ATTEMPTS ]]; do
        log "Deploy attempt $attempt/$MAX_ATTEMPTS"
        
        if vercel --prod --yes 2>&1 | tee -a "$LOG_FILE"; then
            log "✅ Deploy successful on attempt $attempt"
            
            # Pega URL do deploy
            local url=$(vercel ls --scope team 2>/dev/null | head -2 | tail -1 | awk '{print $2}' || echo "https://your-project.vercel.app")
            log "🚀 Deployed to: $url"
            
            return 0
        else
            log "❌ Deploy attempt $attempt failed"
            
            if [[ $attempt -eq $MAX_ATTEMPTS ]]; then
                log "💥 All deploy attempts failed. Check logs: $LOG_FILE"
                return 1
            fi
            
            log "⏳ Waiting 30 seconds before retry..."
            sleep 30
            ((attempt++))
        fi
    done
}

function main() {
    log "🚀 Starting Claude Deploy Wrapper"
    log "Project: $PROJECT_DIR"
    log "Log file: $LOG_FILE"
    
    if validate_project && test_build && deploy_with_retry; then
        log "🎉 DEPLOYMENT SUCCESSFUL!"
        log "📋 Full log available at: $LOG_FILE"
        exit 0
    else
        log "💥 DEPLOYMENT FAILED!"
        log "📋 Check full log at: $LOG_FILE"
        exit 1
    fi
}

main "$@"