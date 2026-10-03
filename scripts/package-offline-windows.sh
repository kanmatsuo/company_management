#!/usr/bin/env bash
# Package the committed source for the WINDOWS offline kit (development and builds on an
# offline Windows 10/11 PC). Runs here on Linux with internet: npm installs the Windows (win32-x64)
# builds of the native packages (Next.js compiler, Tailwind, lightningcss, sharp, ...) into a
# separate copy, so this checkout's own node_modules is not touched.
#
#   scripts/package-offline-windows.sh
#
# Output: dist/management-app-offline-windows.tar.gz with
#   management-app/                 a clone of the repo (committed code, full history) with
#                                   a complete Windows node_modules
#   node-<version>-win-x64.zip      the Node.js runtime this machine uses, for Windows
#
# node_modules/.bin folders are left out: they hold links Windows can't unpack. The
# installer runs `npm rebuild --ignore-scripts --offline`, which makes them again (as .cmd).
set -euo pipefail

cd "$(dirname "$0")/.."

node_version="$(node -v)"
node_dist="node-${node_version}-win-x64"
stage="dist/windows-stage"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "NOTE: uncommitted changes are NOT packaged (only the committed code, $(git rev-parse --short HEAD))." >&2
fi

rm -rf "$stage" dist/management-app-offline-windows.tar.gz
mkdir -p "$stage"
# A clone of the committed code: the full history (for the development copy and offline/main)
# and nothing that isn't committed (work in progress, .env.local, build output).
git clone -q --no-hardlinks . "$stage/management-app"
origin="$(git remote get-url origin 2>/dev/null || true)"
if [[ -n "$origin" ]]; then git -C "$stage/management-app" remote set-url origin "$origin"; fi
# Fail if the source still needs the network at build time.
if grep -rqE "next/font/google|fonts\.(googleapis|gstatic)\.com" "$stage/management-app/src"; then
  echo "src still loads Google Fonts. It will not build offline." >&2
  exit 1
fi

echo "==> npm ci for Windows (win32-x64)"
(cd "$stage/management-app" && npm ci --os=win32 --cpu=x64 --no-audit --no-fund)

for pkg in @next/swc-win32-x64-msvc @tailwindcss/oxide-win32-x64-msvc lightningcss-win32-x64-msvc \
           @unrs/resolver-binding-win32-x64-msvc; do
  [[ -d "$stage/management-app/node_modules/$pkg" ]] || { echo "Missing Windows package: $pkg" >&2; exit 1; }
done
find "$stage/management-app/node_modules" -type d -name .bin -prune -exec rm -rf {} +
links=$(find "$stage/management-app" -type l | head -5)
if [[ -n "$links" ]]; then
  echo "Symbolic links left (Windows can't unpack them):" >&2
  echo "$links" >&2
  exit 1
fi

echo "==> Node.js ${node_version} for Windows"
curl -fsSL "https://nodejs.org/dist/${node_version}/${node_dist}.zip" -o "$stage/${node_dist}.zip"
curl -fsSL "https://nodejs.org/dist/${node_version}/SHASUMS256.txt" \
  | grep " ${node_dist}.zip\$" | (cd "$stage" && sha256sum --check --quiet -) \
  || { echo "Node.js download doesn't match its published checksum." >&2; exit 1; }

tar -czf dist/management-app-offline-windows.tar.gz -C "$stage" management-app "${node_dist}.zip"
rm -rf "$stage"
echo "Created dist/management-app-offline-windows.tar.gz (source, Windows node_modules, ${node_dist})"
