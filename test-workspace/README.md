# Linear Markdown Test Workspace

This is a test workspace for trying out the Linear Markdown extension.

## Directory Structure

- `/issues`: Contains example markdown files with Linear issue IDs
- `/documents`: Contains example markdown files with Linear document IDs

## How to Test

### Using the Setup Script

The easiest way to get started is to use the provided setup script:

```bash
# To auto-detect available IDEs (will prompt if both are available)
./setup.sh

# To specifically use VS Code
./setup.sh -i vscode

# To specifically use Cursor
./setup.sh -i cursor

# To view help and options
./setup.sh -h
```

### Manual Setup

1. Get your Linear API key
2. Open this workspace in VS Code or Cursor
   - VS Code: `code --new-window --extensionDevelopmentPath=../ ./`
   - Cursor: `cursor --new-window --extensionDevelopmentPath=../ ./`
3. Run the "Input Linear Key" command and enter your API key
4. Update the example files with real Linear issue and document IDs
5. Try out the sync commands:
   - "Sync Down from Linear" to fetch content from Linear to your local files
   - "Sync Up to Linear" to update Linear with content from your local files

### Using Launch Configurations

The workspace includes launch configurations for both VS Code and Cursor:

1. Open the parent directory in VS Code or Cursor
2. Press F5 and select either:
   - "Extension with Test Workspace (VS Code)"
   - "Extension with Test Workspace (Cursor)"

## Testing Workflow

1. Create an issue or document in Linear
2. Copy its ID and add it to the corresponding example file's frontmatter
3. Use the sync commands to test syncing in both directions
4. Observe how content and filenames get updated based on Linear data
