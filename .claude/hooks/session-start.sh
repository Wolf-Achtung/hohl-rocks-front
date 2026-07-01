#!/bin/bash
# Installs the Railway CLI so `railway` commands (whoami/variables/logs/...)
# are available in Claude Code on the web sessions for this repo. Auth is
# handled separately via a RAILWAY_TOKEN environment variable configured in
# the environment settings - this hook only ensures the binary is present.
set -uo pipefail

if command -v railway >/dev/null 2>&1; then
  echo "[session-start] Railway CLI already installed ($(railway --version 2>/dev/null || echo present))"
  exit 0
fi

# Only touch global npm packages in the remote web environment, never on a
# developer's local machine running Claude Code against this repo.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "[session-start] Installing Railway CLI..."
if npm install -g @railway/cli >/tmp/railway-cli-install.log 2>&1; then
  echo "[session-start] Railway CLI installed ($(railway --version 2>/dev/null || echo ok))"
else
  echo "[session-start] WARNING: Railway CLI install failed, continuing without it (see /tmp/railway-cli-install.log)." >&2
fi

exit 0
