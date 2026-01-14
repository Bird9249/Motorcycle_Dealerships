#!/bin/bash
# Rollback script for Admin System deployment

set -e

# Configuration
APP_NAME="${APP_NAME:-admin}"
SERVER_ROOT="${SERVER_ROOT:-/opt/admin}"
API_SERVICE="${API_SERVICE:-admin}"
WORKER_SERVICE="${WORKER_SERVICE:-admin-worker}"

echo "🔄 Rolling back $APP_NAME..."

# Check if we have previous releases
PREVIOUS_RELEASES=$(ls -1 "$SERVER_ROOT/releases" | sort | tail -n 2 | head -n 1)

if [ -z "$PREVIOUS_RELEASES" ]; then
    echo "❌ No previous releases found for rollback"
    exit 1
fi

echo "📦 Rolling back to release: $PREVIOUS_RELEASES"

# Update symlinks
echo "🔗 Updating symlinks..."
sudo ln -sfn "$SERVER_ROOT/releases/$PREVIOUS_RELEASES" "$SERVER_ROOT/current"

# Restart services
echo "🔄 Restarting services..."
sudo systemctl restart "$API_SERVICE" "$WORKER_SERVICE"

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 5

# Check service status
API_STATUS=$(systemctl is-active "$API_SERVICE")
WORKER_STATUS=$(systemctl is-active "$WORKER_SERVICE")

if [ "$API_STATUS" = "active" ] && [ "$WORKER_STATUS" = "active" ]; then
    echo "✅ Rollback successful!"
    echo "📊 Service status:"
    echo "   API: $API_STATUS"
    echo "   Worker: $WORKER_STATUS"
else
    echo "❌ Rollback failed!"
    echo "📊 Service status:"
    echo "   API: $API_STATUS"
    echo "   Worker: $WORKER_STATUS"
    exit 1
fi


