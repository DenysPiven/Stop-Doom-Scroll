#!/bin/sh
# Package the extension into dist/stop-doom-scroll-<version>.zip
set -e
cd "$(dirname "$0")"
VERSION=$(sed -n 's/.*"version": "\(.*\)".*/\1/p' manifest.json)
TMP=$(mktemp -d)
mkdir "$TMP/stop-doom-scroll"
cp -R manifest.json rules.json background.js blocked.html blocked.css blocked.js content icons "$TMP/stop-doom-scroll/"
mkdir -p dist
rm -f "dist/stop-doom-scroll-$VERSION.zip"
(cd "$TMP" && zip -qr - stop-doom-scroll) > "dist/stop-doom-scroll-$VERSION.zip"
rm -rf "$TMP"
echo "dist/stop-doom-scroll-$VERSION.zip"
