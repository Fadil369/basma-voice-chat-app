#!/bin/bash

#####################################################################
# Basma vLLM + Cloudflare Deployment Setup Script
# This script prepares the deployment for bsma.elfadil.com
#####################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="elfadil.com"
BSMA_DOMAIN="bsma.elfadil.com"
API_WORKER_PATH="/Users/fadil369/apps/workers/api"
VOICE_WORKER_PATH="/Users/fadil369/apps/workers/voice"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Basma vLLM + Cloudflare Deployment Setup                    ║${NC}"
echo -e "${BLUE}║   Target Domain: ${BSMA_DOMAIN}                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

#####################################################################
# SECTION 1: Verify Prerequisites
#####################################################################

echo -e "${YELLOW}[1/5] Verifying Prerequisites...${NC}"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}✗ wrangler CLI not found. Install with: npm install -g @cloudflare/wrangler${NC}"
    exit 1
fi
echo -e "${GREEN}✓ wrangler CLI installed${NC}"

# Check if user is authenticated
if ! wrangler whoami &> /dev/null 2>&1; then
    echo -e "${RED}✗ Not authenticated with Cloudflare. Run: wrangler login${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Authenticated with Cloudflare${NC}"

# Check if required files exist
if [ ! -f "$API_WORKER_PATH/wrangler.toml" ]; then
    echo -e "${RED}✗ API worker wrangler.toml not found at $API_WORKER_PATH${NC}"
    exit 1
fi
echo -e "${GREEN}✓ API worker configuration found${NC}"

if [ ! -f "$VOICE_WORKER_PATH/wrangler.toml" ]; then
    echo -e "${RED}✗ Voice worker wrangler.toml not found at $VOICE_WORKER_PATH${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Voice worker configuration found${NC}"

#####################################################################
# SECTION 2: Fetch Cloudflare Zone ID
#####################################################################

echo ""
echo -e "${YELLOW}[2/5] Fetching Cloudflare Zone ID for ${DOMAIN}...${NC}"

# Get zones
ZONES=$(wrangler zones list 2>/dev/null)

# Extract zone ID for elfadil.com
ZONE_ID=$(echo "$ZONES" | grep "$DOMAIN" | awk '{print $1}' | head -1)

if [ -z "$ZONE_ID" ]; then
    echo -e "${RED}✗ Zone not found for ${DOMAIN}${NC}"
    echo ""
    echo "Available zones:"
    echo "$ZONES"
    echo ""
    echo -e "${YELLOW}Please ensure ${DOMAIN} is set up in Cloudflare and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found Zone ID: ${ZONE_ID}${NC}"

#####################################################################
# SECTION 3: Update wrangler.toml Files
#####################################################################

echo ""
echo -e "${YELLOW}[3/5] Updating wrangler.toml files with Zone ID...${NC}"

# Backup original files
cp "$API_WORKER_PATH/wrangler.toml" "$API_WORKER_PATH/wrangler.toml.backup"
cp "$VOICE_WORKER_PATH/wrangler.toml" "$VOICE_WORKER_PATH/wrangler.toml.backup"
echo -e "${GREEN}✓ Created backup files (.backup)${NC}"

# Update API worker
sed -i '' "s/zone_id = \"your-cloudflare-zone-id\"/zone_id = \"$ZONE_ID\"/g" "$API_WORKER_PATH/wrangler.toml"
echo -e "${GREEN}✓ Updated API worker wrangler.toml${NC}"

# Update Voice worker
sed -i '' "s/zone_id = \"your-cloudflare-zone-id\"/zone_id = \"$ZONE_ID\"/g" "$VOICE_WORKER_PATH/wrangler.toml"
echo -e "${GREEN}✓ Updated Voice worker wrangler.toml${NC}"

#####################################################################
# SECTION 4: Validate Configuration
#####################################################################

echo ""
echo -e "${YELLOW}[4/5] Validating Configuration...${NC}"

# Check if zone IDs were updated
API_ZONE=$(grep -A 1 "env.production.routes" "$API_WORKER_PATH/wrangler.toml" | grep zone_id | head -1 | grep -o '"[^"]*"' | head -1 | tr -d '"')
VOICE_ZONE=$(grep -A 1 "env.production.routes" "$VOICE_WORKER_PATH/wrangler.toml" | grep zone_id | head -1 | grep -o '"[^"]*"' | head -1 | tr -d '"')

if [ "$API_ZONE" = "$ZONE_ID" ] && [ "$VOICE_ZONE" = "$ZONE_ID" ]; then
    echo -e "${GREEN}✓ Zone IDs updated correctly in both workers${NC}"
else
    echo -e "${RED}✗ Zone ID update verification failed${NC}"
    exit 1
fi

# Verify routes configuration
echo ""
echo -e "${BLUE}Route Configuration Summary:${NC}"
echo ""
echo "API Worker Routes:"
grep -A 1 "pattern = \".*\.bsma\.elfadil\.com" "$API_WORKER_PATH/wrangler.toml" | head -4
echo ""
echo "Voice Worker Routes:"
grep -A 1 "pattern = \".*\.bsma\.elfadil\.com" "$VOICE_WORKER_PATH/wrangler.toml" | head -4

#####################################################################
# SECTION 5: Deployment Checklist
#####################################################################

echo ""
echo -e "${YELLOW}[5/5] Pre-Deployment Checklist${NC}"

# Check for placeholder values
PLACEHOLDER_COUNT=$(grep -r "your-" "$API_WORKER_PATH/wrangler.toml" "$VOICE_WORKER_PATH/wrangler.toml" | grep -c "database_id\|kv" || true)

if [ "$PLACEHOLDER_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Warning: Found $PLACEHOLDER_COUNT placeholder values (database IDs, KV namespaces)${NC}"
    echo -e "${YELLOW}  These need to be updated before deployment:${NC}"
    grep -n "your-" "$API_WORKER_PATH/wrangler.toml" | sed 's/^/    /'
    grep -n "your-" "$VOICE_WORKER_PATH/wrangler.toml" | sed 's/^/    /'
    echo ""
fi

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Setup Complete! Ready for Deployment                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Update placeholder values in wrangler.toml files:"
echo "   - database_id values for D1"
echo "   - kv namespace IDs"
echo "   - API keys and secrets (via 'wrangler secret put')"
echo ""
echo "2. Set required secrets:"
echo "   ${BLUE}API Worker:${NC}"
echo "   cd $API_WORKER_PATH"
echo "   wrangler secret put ANTHROPIC_API_KEY --env production"
echo "   wrangler secret put OPENAI_API_KEY --env production"
echo "   wrangler secret put JWT_SECRET --env production"
echo ""
echo "   ${BLUE}Voice Worker:${NC}"
echo "   cd $VOICE_WORKER_PATH"
echo "   wrangler secret put ANTHROPIC_API_KEY --env production"
echo "   wrangler secret put OPENAI_API_KEY --env production"
echo "   wrangler secret put TWILIO_ACCOUNT_SID --env production"
echo "   wrangler secret put TWILIO_AUTH_TOKEN --env production"
echo "   wrangler secret put TWILIO_PHONE_NUMBER --env production"
echo ""
echo "3. Deploy to production:"
echo "   ${BLUE}API Worker:${NC}"
echo "   cd $API_WORKER_PATH && wrangler deploy --env production"
echo ""
echo "   ${BLUE}Voice Worker:${NC}"
echo "   cd $VOICE_WORKER_PATH && wrangler deploy --env production"
echo ""
echo "4. Verify deployment:"
echo "   curl -v https://api.bsma.elfadil.com/health"
echo "   curl -v https://voice.bsma.elfadil.com/health"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "   See /Users/fadil369/CLOUDFLARE_ZONE_CONFIG.md for detailed configuration guide"
echo ""
