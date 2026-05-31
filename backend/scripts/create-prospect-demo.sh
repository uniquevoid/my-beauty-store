#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <slug> <name> [branding-file.json]"
  exit 1
fi

SLUG="$1"
NAME="$2"
BRANDING_FILE="${3:-}"

cd "$(dirname "$0")/.."

ARGS=(run create-prospect -- --slug "$SLUG" --name "$NAME")
if [[ -n "$BRANDING_FILE" ]]; then
  ARGS+=(--branding-file "$BRANDING_FILE")
fi

echo "Provisioning prospect demo: $SLUG (includes 10 demo jobs)"
npm "${ARGS[@]}"

if [[ -n "${PLATFORM_DOMAIN:-}" ]]; then
  echo ""
  echo "Demo URL: https://${SLUG}.${PLATFORM_DOMAIN}"
  echo "Admin:    https://${SLUG}.${PLATFORM_DOMAIN}/admin  (admin / user)"
  echo "Candidate: https://${SLUG}.${PLATFORM_DOMAIN}/login  (candidate@demo.local / demo123!)"
else
  echo ""
  echo "Set PLATFORM_DOMAIN in backend .env to print the demo URL automatically."
  echo "Or use: ?tenant=${SLUG} on your frontend URL"
  echo "Admin:    /admin?tenant=${SLUG}  (admin / user)"
  echo "Candidate: /login?tenant=${SLUG}  (candidate@demo.local / demo123!)"
fi
