#!/bin/bash
set -euo pipefail

echo "==> Pulling latest code..."
git pull origin main

echo "==> Building app image..."
docker compose build app

echo "==> Restarting services..."
docker compose up -d

echo "==> Cleaning up old images..."
docker image prune -f

echo "==> Deploy complete."
docker compose ps
