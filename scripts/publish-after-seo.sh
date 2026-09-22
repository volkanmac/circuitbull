#!/usr/bin/env bash
set -euo pipefail
cd /Users/volkan/domain
LOG=.tmp/publish-after-seo.log
TERM_FILE="${SEO_TERM:-/Users/volkan/.cursor/projects/Users-volkan-domain/terminals/575661.txt}"
say() { echo "[publish-seo $(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$LOG"; }

say "waiting for SEO ($TERM_FILE)"
while grep -q '^status: running' "$TERM_FILE" 2>/dev/null; do
  sleep 20
done
say "SEO finished — sync-kv"

npm run sync-kv >>"$LOG" 2>&1
say "sync-kv done"

export CLOUDFLARE_EMAIL
export CLOUDFLARE_API_KEY
export CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_EMAIL="$(node --input-type=module -e 'import "dotenv/config"; process.stdout.write(process.env.CF_AUTH_EMAIL||"")')"
CLOUDFLARE_API_KEY="$(node --input-type=module -e 'import "dotenv/config"; process.stdout.write(process.env.CF_GLOBAL_API_KEY||"")')"
CLOUDFLARE_ACCOUNT_ID="$(node --input-type=module -e 'import "dotenv/config"; process.stdout.write(process.env.CF_ACCOUNT_ID||"")')"
unset CF_API_TOKEN CLOUDFLARE_API_TOKEN
npx wrangler deploy >>"$LOG" 2>&1
say "deploy done"

node scripts/submit-sitemap.mjs >>"$LOG" 2>&1
say "sitemap submitted"
echo PUBLISH_SEO_OK >>"$LOG"
