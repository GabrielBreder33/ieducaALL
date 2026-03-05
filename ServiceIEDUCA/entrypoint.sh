#!/bin/sh
set -eu

# Prefer Docker Swarm secrets when available; fallback to pre-defined env vars.
if [ -f /run/secrets/deepseek_api_key ]; then
  export DeepSeek__ApiKey="$(tr -d '\r\n' < /run/secrets/deepseek_api_key)"
fi

if [ -f /run/secrets/db_connection_string ]; then
  export ConnectionStrings__DefaultConnection="$(tr -d '\r\n' < /run/secrets/db_connection_string)"
fi

exec dotnet ServiceIEDUCA.dll