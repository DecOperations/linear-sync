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
    echo "  $0                  # Auto-detect available IDEs"
    echo "  $0 -i cursor        # Run in Cursor"
    echo "  $0 -i vscode        # Run in VS Code"
    echo "  $0 -h               # Show this help message"
    exit 0
}

# Check if VS Code is installed
has_vscode=false
if command -v code &> /dev/null; then
    has_vscode=true
fi

# Check if Cursor is installed
has_cursor=false
if command -v cursor &> /dev/null; then
    has_cursor=true
fi

# Parse command line options
IDE="" # No default, will auto-detect
while getopts "i:h" opt; do
    case $opt in
        i) IDE="$OPTARG" ;;
        h) show_help ;;
        *) echo "Invalid option: -$OPTARG" >&2; show_help ;;
    esac
done

# If no IDE specified via flag, auto-detect and prompt if needed
if [ -z "$IDE" ]; then
    if $has_vscode && $has_cursor; then
        # Both are available, ask user for preference
        echo "Both VS Code and Cursor are available. Which one would you like to use?"
        echo "1) VS Code"
        echo "2) Cursor"
        read -p "Enter choice (1/2): " choice
        case $choice in
            1) IDE="vscode" ;;
            2) IDE="cursor" ;;
            *) echo "Invalid choice. Defaulting to VS Code."; IDE="vscode" ;;
        esac
        elif $has_vscode; then
        echo "VS Code detected, using it to open the extension."
        IDE="vscode"
        elif $has_cursor; then
        echo "Cursor detected, using it to open the extension."
        IDE="cursor"
    else
        echo "Neither VS Code nor Cursor were found. Please install one of them and try again."
        exit 1
    fi
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

# Launch in the appropriate IDE
if [ "$IDE" = "cursor" ]; then
    if ! $has_cursor; then
        echo "Error: Cursor is not installed or not in PATH"
        exit 1
    fi
    
    echo "Opening test workspace in Cursor with extension..."
    cursor --new-window --extensionDevelopmentPath="$PARENT_DIR" "$CURRENT_DIR"
    elif [ "$IDE" = "vscode" ]; then
    if ! $has_vscode; then
        echo "Error: VS Code is not installed or not in PATH"
        exit 1
    fi
    
    echo "Opening test workspace in VS Code with extension..."
    code --new-window --extensionDevelopmentPath="$PARENT_DIR" "$CURRENT_DIR"
else
    echo "Error: Unknown IDE specified. Use 'vscode' or 'cursor'."
    exit 1
fi

echo ""
echo "Instructions:"
echo "1. Press Ctrl+Shift+P (Cmd+Shift+P on Mac) to open the Command Palette"
echo "2. Type 'Input Linear Key' and press Enter"
echo "3. Enter your Linear API key when prompted"
echo "4. Open one of the example markdown files"
echo "5. Update the Linear ID in the frontmatter with a real ID from your Linear account"
echo "6. Use the Command Palette again to run 'Sync Down from Linear' or 'Sync Up to Linear'"