#!/bin/sh
set -eu

if [ -n "${VITE_API_BASE_URL:-}" ]; then
  printf 'window.CIVICPULSE_CONFIG = window.CIVICPULSE_CONFIG || {\n  apiBaseUrl: "%s"\n};\n' "$VITE_API_BASE_URL" > /usr/share/nginx/html/config.js
fi
