#!/bin/bash

echo "Linear Markdown Extension Tester"
echo "--------------------------------"

# Check if VS Code is installed
if ! command -v code &> /dev/null; then
    echo "Error: VS Code is not installed or not in PATH"
    exit 1
fi

# Get the current directory
CURRENT_DIR=$(pwd)
PARENT_DIR=$(dirname "$CURRENT_DIR")

# Compile the extension if not already compiled
if [ ! -d "$PARENT_DIR/out" ]; then
    echo "Compiling extension..."
    cd "$PARENT_DIR"
    npm install
    npm run compile
    cd "$CURRENT_DIR"
fi

echo "Opening test workspace in VS Code with extension..."
code --new-window --extensionDevelopmentPath="$PARENT_DIR" "$CURRENT_DIR"

echo ""
echo "Instructions:"
echo "1. In VS Code, press Ctrl+Shift+P (Cmd+Shift+P on Mac) to open the Command Palette"
echo "2. Type 'Input Linear Key' and press Enter"
echo "3. Enter your Linear API key when prompted"
echo "4. Open one of the example markdown files"
echo "5. Update the Linear ID in the frontmatter with a real ID from your Linear account"
echo "6. Use the Command Palette again to run 'Sync Down from Linear' or 'Sync Up to Linear'"