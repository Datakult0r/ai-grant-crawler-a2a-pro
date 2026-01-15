#!/bin/bash
# =============================================================================
# AI Grant Crawler - Backend Startup Script
# =============================================================================
# This script verifies the environment setup before starting the Express server.
# It ensures all required environment variables are configured correctly.
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=============================================="
echo "  AI Grant Crawler - Backend Startup"
echo "=============================================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Change to root directory
cd "$ROOT_DIR"

echo -e "${YELLOW}Step 1: Running environment verification...${NC}"
echo ""

# Run the verify script
if npm run verify; then
    echo ""
    echo -e "${GREEN}Environment verification passed!${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}=============================================="
    echo "  STARTUP ABORTED"
    echo "=============================================="
    echo ""
    echo "Environment verification failed."
    echo "Please fix the errors above before starting the server."
    echo ""
    echo "Quick fix:"
    echo "  1. Copy backend/.env.example to backend/.env"
    echo "  2. Fill in your API keys"
    echo "  3. Run this script again"
    echo "=============================================="
    echo -e "${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 2: Starting Express server...${NC}"
echo ""

# Change to backend directory and start the server
cd "$ROOT_DIR/backend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
    echo ""
fi

# Start the server
echo -e "${GREEN}Starting server on port ${PORT:-3000}...${NC}"
echo ""
npm start
