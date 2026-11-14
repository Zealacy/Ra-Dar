#!/usr/bin/env bash
# Publishes the website to Vercel from a cloud session, then checks that the live site serves the new files.
# Run from anywhere: bash tools/deploy.sh   (only after the checks in CLAUDE.md "Publishing" have passed)
#
# - Copies ONLY the site files into a scratch folder (never CLAUDE.md, README.md, tools/ or .git).
# - Looks up the Vercel team and project IDs from the API each time. Never write those IDs into the repo.
# - The real Vercel token is a network secret on the Ra-Dar environment; the proxy swaps it in for the
#   placeholder below. (The CLI rejects placeholders that contain "-".)
# - The Auto-mode safety check may block this; if so, ask the owner to say "publish it". Don't work around it.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
WORK=${WORK:-${TMPDIR:-/tmp}/ra-dar-deploy}
SITE_FILES="index.html style.css app.js week.js preseason.js mountains.js icon.svg icon-180.png preview.png"
LIVE=https://ra-dar-alpha.vercel.app
AUTH="Authorization: Bearer proxyinjectedplaceholder"

for f in app.js week.js preseason.js mountains.js; do node --check "$ROOT/$f"; done
rm -rf "$WORK/site"; mkdir -p "$WORK/site"
for f in $SITE_FILES; do cp "$ROOT/$f" "$WORK/site/"; done
(cd "$WORK/site" && sha256sum $SITE_FILES > "$WORK/sums.txt")

if [ ! -x "$WORK/cli/node_modules/.bin/vercel" ]; then
  mkdir -p "$WORK/cli"; (cd "$WORK/cli" && npm install --silent --no-audit --no-fund vercel >/dev/null)
fi
T=$(curl -sS https://api.vercel.com/v2/teams -H "$AUTH" | python3 -c "import json,sys;print(json.load(sys.stdin)['teams'][0]['id'])")
P=$(curl -sS "https://api.vercel.com/v9/projects/ra-dar?teamId=$T" -H "$AUTH" | python3 -c "import json,sys;print(json.load(sys.stdin)['id'])")
[ -n "$T" ] && [ -n "$P" ] || { echo "Could not look up the Vercel team or project"; exit 1; }

cd "$WORK/site"
VERCEL_TELEMETRY_DISABLED=1 VERCEL_ORG_ID=$T VERCEL_PROJECT_ID=$P \
  "$WORK/cli/node_modules/.bin/vercel" deploy --prod --yes --token proxyinjectedplaceholder > "$WORK/deploy.log" 2>&1 \
  || { tail -20 "$WORK/deploy.log"; exit 1; }
rm -rf "$WORK/site/.vercel"   # the CLI's local link file (holds the IDs); never copy it anywhere

echo "Deployed. Checking $LIVE ..."
sleep 20
bad=0
for f in $SITE_FILES; do
  a=$(curl -sS "$LIVE/$f?nc=$RANDOM$RANDOM" | sha256sum | cut -c1-64)
  b=$(grep " $f\$" "$WORK/sums.txt" | cut -c1-64)
  if [ "$a" = "$b" ]; then echo "  $f matches"; else echo "  $f DIFFERENT (wait a minute and re-check)"; bad=1; fi
done
[ $bad = 0 ] && echo "Live site serves the new files. Now run the browser test against $LIVE/."
