#!/usr/bin/env bash
set -euo pipefail

npm install --no-audit --no-fund
npm run build:shared
npm run prisma:generate

rm -rf packages/shared/dist packages/shared/tsconfig.tsbuildinfo