#!/bin/bash
set -e

INSTALL_DIR="/usr/local/bin"
BINARY_NAME="lazynotes"

# Check if binary exists in current directory
if [ ! -f "./$BINARY_NAME" ]; then
    echo "Error: $BINARY_NAME binary not found in current directory"
    exit 1
fi

# Check if we need sudo
if [ -w "$INSTALL_DIR" ]; then
    cp "./$BINARY_NAME" "$INSTALL_DIR/$BINARY_NAME"
else
    echo "Installing to $INSTALL_DIR (requires sudo)..."
    sudo cp "./$BINARY_NAME" "$INSTALL_DIR/$BINARY_NAME"
fi

chmod +x "$INSTALL_DIR/$BINARY_NAME"

echo "Installed successfully! Run 'lazynotes' to start."
