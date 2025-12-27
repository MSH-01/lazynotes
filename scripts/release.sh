#!/bin/bash
set -e

VERSION=${1:-"v1.0.0"}

echo "Building binaries..."
npm run build:all

echo "Creating release packages..."
mkdir -p releases

# Package ARM64
cp dist/lazynotes-darwin-arm64 releases/lazynotes
cp install.sh releases/
cd releases
tar -czf "lazynotes-${VERSION}-darwin-arm64.tar.gz" lazynotes install.sh
rm lazynotes

# Package x64
cp ../dist/lazynotes-darwin-x64 lazynotes
tar -czf "lazynotes-${VERSION}-darwin-x64.tar.gz" lazynotes install.sh
rm lazynotes install.sh

cd ..
echo ""
echo "Release packages created in releases/:"
ls -lh releases/*.tar.gz
echo ""
echo "Upload with:"
echo "  gh release create ${VERSION} releases/*.tar.gz --title \"${VERSION}\""
