#!/usr/bin/env bash
# After product LLM translate finishes: SEO per locale, KV sync, wrangler deploy.
set -euo pipefail
cd /Users/volkan/domain
LOG=.tmp/publish-after-translate.log
mkdir -p .tmp

say() { echo "[publish $(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$LOG"; }

TRANSLATE_TERM="${TRANSLATE_TERM:-/Users/volkan/.cursor/projects/Users-volkan-domain/terminals/396918.txt}"

say "waiting for translate to finish ($TRANSLATE_TERM)"
while grep -q '^status: running' "$TRANSLATE_TERM" 2>/dev/null; do
  sleep 20
done
say "translate finished — starting SEO"

export LLM_DELAY_MS="${LLM_DELAY_MS:-0}"
export CF_AI_TIMEOUT_MS="${CF_AI_TIMEOUT_MS:-120000}"
npm run llm-seo -- --provider=workers --concurrency=8 >>"$LOG" 2>&1
say "seo done"

npm run sync-kv >>"$LOG" 2>&1
say "sync-kv done"

npm run deploy >>"$LOG" 2>&1
say "deploy done"
echo "PUBLISH_OK" >>"$LOG"
