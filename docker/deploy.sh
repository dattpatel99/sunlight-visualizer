#!/usr/bin/env bash
# =============================================================================
# sunlight-visualizer / deploy.sh
# Builds, tags, and optionally pushes the Docker image.
# =============================================================================

set -euo pipefail

REGISTRY="${REGISTRY:-ghcr.io}"
IMAGE_NAME="${IMAGE_NAME:-dattpatel99/sunlight-visualizer}"
TAG="${TAG:-latest}"

# Full image reference
IMAGE="${REGISTRY}/${IMAGE_NAME}:${TAG}"

echo "============================================"
echo "  Sunlight Visualizer — Docker Deploy"
echo "============================================"
echo "  Registry : $REGISTRY"
echo "  Image    : $IMAGE_NAME"
echo "  Tag      : $TAG"
echo "============================================"

# 1. Build
echo "[1/3] Building Docker image..."
docker build \
  -f docker/Dockerfile \
  -t "$IMAGE" \
  . 

# 2. Tag as 'latest' for convenience
echo "[2/3] Tagging..."
docker tag "$IMAGE" "${REGISTRY}/${IMAGE_NAME}:latest"

# 3. Push (only if REGISTRY is set and not 'local')
if [[ "$REGISTRY" != "local" ]]; then
  echo "[3/3] Pushing to ${REGISTRY}..."
  docker push "$IMAGE"
  docker push "${REGISTRY}/${IMAGE_NAME}:latest"
  echo "✅ Pushed: $IMAGE"
  echo "✅ Pull with: docker pull $IMAGE"
else
  echo "[3/3] Skipping push (local mode)."
  echo "✅ Build complete: $IMAGE"
  echo "   Run with: docker run -p 3007:8080 $IMAGE"
fi

echo ""
echo "--- DEPLOYMENT CHEATSHEET ---"
echo ""
echo "  # Pull (on your Umbrel host):"
echo "  docker pull $IMAGE"
echo ""
echo "  # Run:"
echo "  docker run -d --name sunlight-visualizer \\"
echo "    -p 3007:8080 \\"
echo "    --restart unless-stopped \\"
echo "    $IMAGE"
echo ""
echo "  # Or with docker-compose on Umbrel host:"
echo "  docker compose -f docker/docker-compose.yml up -d"
echo ""
echo "  # Verify:"
echo "  curl http://localhost:3007/health"
