#!/bin/bash

echo "Linear Markdown Extension Tester"
echo "--------------------------------"

# Function to display help
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -i IDE     Specify IDE to use (vscode or cursor)"
    echo "  -h         Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0                  # Run in VS Code (default)"
    echo "  $0 -i cursor        # Run in Cursor"
    echo "  $0 -h               # Show this help message"
    exit 0
}

# Parse command line options
IDE="vscode" # Default to VS Code
while getopts "i:h" opt; do
    case $opt in
        i) IDE="$OPTARG" ;;
        h) show_help ;;
        *) echo "Invalid option: -$OPTARG" >&2; show_help ;;
    esac
done

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

# Launch in the appropriate IDE
if [ "$IDE" = "cursor" ]; then
    # Check if Cursor is installed
    if ! command -v cursor &> /dev/null; then
        echo "Error: Cursor is not installed or not in PATH"
        exit 1
    fi
    
    echo "Opening test workspace in Cursor with extension..."
    cursor --new-window --extensionDevelopmentPath="$PARENT_DIR" "$CURRENT_DIR"
else
    # Check if VS Code is installed
    if ! command -v code &> /dev/null; then
        echo "Error: VS Code is not installed or not in PATH"
        exit 1
    fi
    
    echo "Opening test workspace in VS Code with extension..."
    code --new-window --extensionDevelopmentPath="$PARENT_DIR" "$CURRENT_DIR"
fi

echo ""
echo "Instructions:"
echo "1. Press Ctrl+Shift+P (Cmd+Shift+P on Mac) to open the Command Palette"
echo "2. Type 'Input Linear Key' and press Enter"
echo "3. Enter your Linear API key when prompted"
echo "4. Open one of the example markdown files"
echo "5. Update the Linear ID in the frontmatter with a real ID from your Linear account"
echo "6. Use the Command Palette again to run 'Sync Down from Linear' or 'Sync Up to Linear'"