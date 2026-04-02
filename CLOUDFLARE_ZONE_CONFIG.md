# Cloudflare Zone Configuration for bsma.elfadil.com

## Overview

This document provides complete instructions for configuring the `elfadil.com` Cloudflare zone to support the Basma voice platform deployment across multiple subdomains.

## DNS Records Required

### A. BSMA Subdomains (Cloudflare Worker Routes)

The following subdomains will be managed via Cloudflare Workers routes in `wrangler.toml`:

| Subdomain | Service | Purpose | Zone ID Required |
|-----------|---------|---------|------------------|
| `api.bsma.elfadil.com` | API Worker (Production) | REST API endpoints | Yes |
| `voice.bsma.elfadil.com` | Voice Worker (Production) | WebSocket streaming, call handling | Yes |
| `webhooks.bsma.elfadil.com` | Voice Worker (Production) | Twilio webhook callbacks | Yes |
| `api-dev.bsma.elfadil.com` | API Worker (vLLM Dev) | Development REST API | Yes |
| `voice-dev.bsma.elfadil.com` | Voice Worker (vLLM Dev) | Development WebSocket | Yes |
| `webhooks-dev.bsma.elfadil.com` | Voice Worker (vLLM Dev) | Dev Twilio webhooks | Yes |

### B. BSMA Frontend (Vite App - Separate Deployment)

| Subdomain | Service | Purpose | Type |
|-----------|---------|---------|------|
| `app.bsma.elfadil.com` | Frontend (Vite) | BSMA Portal UI | CNAME to Pages |
| `bsma.elfadil.com` | Frontend (Vite) | Root redirect to app | CNAME to Pages |

## Step-by-Step Configuration

### Step 1: Gather Required Information

```bash
# Get your Cloudflare Account ID
wrangler whoami

# Get the Zone ID for elfadil.com
wrangler zones list

# Or fetch via API:
curl -X GET "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer YOUR_CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json"
```

Expected output should include:
```json
{
  "id": "your-cloudflare-zone-id",
  "name": "elfadil.com",
  "account": {
    "id": "your-account-id"
  }
}
```

### Step 2: Update wrangler.toml Files with Zone ID

Replace `your-cloudflare-zone-id` in both worker configurations:

**File:** `/Users/fadil369/apps/workers/api/wrangler.toml`
```toml
[[env.production.routes]]
pattern = "api.bsma.elfadil.com/*"
zone_id = "YOUR_ZONE_ID_HERE"  # Replace with actual zone ID

[[env.production.routes]]
pattern = "voice.bsma.elfadil.com/*"
zone_id = "YOUR_ZONE_ID_HERE"
```

**File:** `/Users/fadil369/apps/workers/voice/wrangler.toml`
```toml
[[env.production.routes]]
pattern = "voice.bsma.elfadil.com/*"
zone_id = "YOUR_ZONE_ID_HERE"

[[env.production.routes]]
pattern = "webhooks.bsma.elfadil.com/*"
zone_id = "YOUR_ZONE_ID_HERE"
```

### Step 3: Create DNS Records (via Cloudflare Dashboard)

Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Select `elfadil.com` → DNS Records

#### For Worker Routes (Auto-managed by Workers):
These will be created automatically when you deploy with `wrangler deploy`.

#### For Frontend (Manual DNS):

1. **CNAME Record for `app.bsma.elfadil.com`**
   - Type: `CNAME`
   - Name: `app.bsma`
   - Target: Your Cloudflare Pages deployment URL (e.g., `bsma-xyz.pages.dev`)
   - TTL: Auto
   - Proxy status: Proxied (Orange cloud)

2. **CNAME Record for `bsma.elfadil.com` (Root)**
   - Type: `CNAME`
   - Name: `bsma`
   - Target: `app.bsma.elfadil.com`
   - TTL: Auto
   - Proxy status: Proxied (Orange cloud)

### Step 4: Update Environment Variables in Workers

Set these secrets in each worker environment:

```bash
# For API Worker
wrangler secret put ANTHROPIC_API_KEY --env production
wrangler secret put OPENAI_API_KEY --env production
wrangler secret put JWT_SECRET --env production
wrangler secret put ENCRYPTION_KEY --env production

# For Voice Worker (same secrets)
cd ../voice
wrangler secret put ANTHROPIC_API_KEY --env production
wrangler secret put OPENAI_API_KEY --env production
wrangler secret put TWILIO_ACCOUNT_SID --env production
wrangler secret put TWILIO_AUTH_TOKEN --env production
wrangler secret put TWILIO_PHONE_NUMBER --env production
```

### Step 5: Configure Cloudflare Workers Settings

In the Cloudflare Dashboard → Workers & Pages → Settings:

1. **Subdomain Routing**: Leave as default (uses zone_id from wrangler.toml)
2. **Environment Variables**: Can be set via `wrangler.toml` or Dashboard
3. **Secrets**: Must be set via wrangler CLI for security
4. **Service Bindings**: Configure if using multiple workers
5. **Rate Limiting**: Configure at zone level if needed

### Step 6: SSL/TLS Configuration

In Cloudflare Dashboard → SSL/TLS → Edge Certificates:

- Minimum TLS Version: TLS 1.2 (or 1.3 recommended)
- Always HTTPS: ON
- Automatic HTTPS Rewrites: ON

### Step 7: Page Rules / Rules Configuration (Optional)

Create rules for rate limiting, caching, or WAF:

```
# Example: Cache API responses
Pattern: api.bsma.elfadil.com/v1/*
Action: Cache Level = Cache Everything, Browser Cache TTL = 1 hour

# Example: WAF Protection
Pattern: voice.bsma.elfadil.com/*
Action: Security Level = Under Attack
```

## Deployment Flow

### Pre-Deployment Checklist

```bash
# 1. Verify zone ID is correct
wrangler zones list | grep elfadil.com

# 2. Update wrangler.toml with zone ID
nano /Users/fadil369/apps/workers/api/wrangler.toml
nano /Users/fadil369/apps/workers/voice/wrangler.toml

# 3. Verify configuration syntax
wrangler deploy --dry-run --env production

# 4. Check environment variables
wrangler env list
```

### Deploy to Production

```bash
# Deploy API Worker
cd /Users/fadil369/apps/workers/api
wrangler deploy --env production

# Deploy Voice Worker
cd /Users/fadil369/apps/workers/voice
wrangler deploy --env production

# Verify routes are created
wrangler routes list --env production
```

### Verify Deployment

```bash
# Test API endpoint
curl -X GET https://api.bsma.elfadil.com/health

# Test Voice endpoint (WebSocket would require client)
curl -X GET https://voice.bsma.elfadil.com/health

# Test webhook endpoint
curl -X POST https://webhooks.bsma.elfadil.com/twilio/voice \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## SBS Integration Notes

Based on the review of `/Users/fadil369/sbs`:

### Existing SBS Deployments:
- **sbs-landing**: Deployed to `api.brainsait.cloud` using `[[routes]]` pattern
- **normalizer-service**: Containerized service with Durable Objects
- **Full stack**: Uses Kubernetes for production in `k8s-production/`

### Potential Integration Points:

If integrating BSMA with the larger SBS ecosystem:

```
Production:
├── api.brainsait.cloud         (SBS API)
├── api.bsma.elfadil.com        (BSMA API)
├── voice.bsma.elfadil.com      (BSMA Voice)
└── Other services...

Development/Staging:
├── preview.brainsait.cloud     (SBS Preview)
├── api-dev.bsma.elfadil.com    (BSMA Dev)
└── voice-dev.bsma.elfadil.com  (BSMA Dev Voice)
```

## Troubleshooting

### Route Not Working
- Verify Zone ID is correct: `wrangler zones list`
- Check pattern matches subdomain: `pattern = "api.bsma.elfadil.com/*"`
- Verify DNS records exist in Cloudflare Dashboard
- Check worker deployment status: `wrangler deployments list`

### SSL/TLS Certificate Issues
- Ensure "Always HTTPS" is enabled
- Check certificate status in Dashboard → SSL/TLS → Edge Certificates
- May take 5-15 minutes to propagate

### Performance Issues
- Check Worker CPU time: Dashboard → Workers Analytics
- Review rate limiting settings
- Verify database connections aren't timing out
- Monitor WebSocket connections for voice worker

## Security Considerations

1. **API Key Management**: Never commit secrets to git
   - Use `wrangler secret put` for all sensitive values
   - Rotate keys regularly
   - Use separate keys for prod vs dev

2. **CORS Configuration**: Update `ALLOWED_ORIGINS` for production
   ```toml
   [env.production.vars]
   ALLOWED_ORIGINS = "https://app.bsma.elfadil.com,https://bsma.elfadil.com"
   ```

3. **Rate Limiting**: Implement at Cloudflare level
   ```toml
   [limits]
   cpu_ms = 50
   max_request_size_mb = 100
   ```

4. **WAF Rules**: Consider enabling Cloudflare's managed rulesets
   - Enable "Definitely Evil" protection
   - Log 4xx/5xx errors
   - Block based on country if needed

## References

- [Wrangler Routes Documentation](https://developers.cloudflare.com/workers/configuration/routing/routes/)
- [Cloudflare Workers Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/cli/wrangler/commands/)
- [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)

---

**Last Updated**: April 3, 2026
**Status**: Ready for deployment
**Next Step**: Run `wrangler zones list` to get Zone ID and proceed with Step 2
