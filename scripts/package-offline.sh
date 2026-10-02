#!/usr/bin/env bash
# Package the full source for development and builds on the offline server.
# Run on a machine with internet and the same OS/CPU as the offline server
# (node_modules holds native binaries such as the SWC compiler).
#
# The archive holds the repo with .git, a complete node_modules, and the
# Node.js runtime this machine uses. Fonts are stored in src/app/fonts.
set -euo pipefail

cd "$(dirname "$0")/.."

node_version="$(node -v)"
case "$(uname -m)" in
  x86_64) arch=x64 ;;
  aarch64) arch=arm64 ;;
  *) echo "Unsupported CPU: $(uname -m)" >&2; exit 1 ;;
esac
node_dist="node-${node_version}-linux-${arch}"

npm ci

# Fail if the source still needs the network at build time.
if grep -rqE "next/font/google|fonts\.(googleapis|gstatic)\.com" src; then
  echo "src still loads Google Fonts. It will not build offline." >&2
  exit 1
fi

rm -rf dist
mkdir -p dist/management-app

tar -cf - \
  --exclude=./.next \
  --exclude=./dist \
  --exclude=./tsconfig.tsbuildinfo \
  . | tar -xf - -C dist/management-app

curl -fsSL "https://nodejs.org/dist/${node_version}/${node_dist}.tar.xz" -o "dist/${node_dist}.tar.xz"

tar -czf dist/management-app-offline.tar.gz -C dist management-app "${node_dist}.tar.xz"
rm -rf dist/management-app "dist/${node_dist}.tar.xz"
echo "Created dist/management-app-offline.tar.gz (source, node_modules, ${node_dist})"
