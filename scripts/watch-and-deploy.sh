#!/bin/bash
# scripts/watch-and-deploy.sh - Monitora mudanças e faz deploy automático

echo "👀 Starting file watcher for automatic deployment..."
echo "🔍 Watching: src/, components/, app/, lib/"
echo "⏰ Deploy delay: 30 seconds after last change"
echo "🛑 Press Ctrl+C to stop"

# Função de deploy com debounce
deploy_function() {
    echo ""
    echo "🚀 Changes detected! Starting automatic deployment..."
    echo "⏳ Waiting 30 seconds for additional changes..."
    
    sleep 30
    
    echo "📦 Running automatic deployment..."
    npm run deploy:auto
    
    if [ $? -eq 0 ]; then
        echo "✅ Automatic deployment successful!"
        # Notificação desktop (Linux/macOS)
        which notify-send > /dev/null && notify-send "Deploy Successful" "NEX7 deployed automatically"
        which osascript > /dev/null && osascript -e 'display notification "NEX7 deployed automatically" with title "Deploy Successful"'
    else
        echo "❌ Automatic deployment failed!"
        which notify-send > /dev/null && notify-send "Deploy Failed" "Check logs for details"
        which osascript > /dev/null && osascript -e 'display notification "Check logs for details" with title "Deploy Failed"'
    fi
    
    echo ""
    echo "👀 Resuming file watching..."
}

# Instala fswatch se não estiver disponível (macOS)
if ! command -v fswatch &> /dev/null; then
    if command -v brew &> /dev/null; then
        echo "📦 Installing fswatch via Homebrew..."
        brew install fswatch
    fi
fi

# Usa inotifywait (Linux) ou fswatch (macOS)
if command -v inotifywait &> /dev/null; then
    # Linux
    while inotifywait -r -e modify,create,delete,move src/ components/ app/ lib/ --exclude '\.(git|node_modules)' 2>/dev/null; do
        deploy_function
    done
elif command -v fswatch &> /dev/null; then
    # macOS
    fswatch -o src/ components/ app/ lib/ | while read f; do
        deploy_function
    done
else
    echo "❌ File watcher not available. Install inotify-tools (Linux) or fswatch (macOS)"
    exit 1
fi