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

## Configuration Options

The Linear Markdown extension is highly configurable. You can set these options in your VS Code or Cursor settings:

### File Naming

- `linear-md.filenameFormat`: Controls how markdown files are named when syncing from Linear

  - Default: `${title}`
  - Supported variables:
    - `${title}`: The title of the Linear issue/document
    - `${id}`: The internal Linear ID
    - `${ticket}`: The Linear ticket ID (e.g., ABC-123)
    - `${type}`: Either "issue" or "document"
    - `${date}`: Current date formatted according to dateFormat setting

- `linear-md.dateFormat`: Date format used when ${date} is in the filename
  - Options: "ISO" (2023-04-28), "Short" (230428), "YMD" (20230428), "DMY" (28042023), "MDY" (04282023)

### Directory Structure

- `linear-md.createDirectory`: Whether to create directories for organizing files

  - When enabled, files will be organized into subdirectories

- `linear-md.directoryFormat`: How to organize files if createDirectory is enabled
  - "team": Create directories based on team names
  - "status": Create directories based on issue statuses
  - "none": Don't create directories (default)

### Frontmatter Options

- `linear-md.skipFrontmatter`: Set to true to skip adding frontmatter (not recommended)

- `linear-md.customFrontmatterFields`: List of additional fields to include in frontmatter
  - Example: ["priority", "assignee", "dueDate", "estimate"]

### CodeLens

- `linear-md.enableCodeLens`: Show or hide the "Sync Up" and "Sync Down" buttons at the top of markdown files

### Example Configuration

A sample `.vscode/settings.json` is included in this test workspace. Open it to see example configurations.

## Features

### New: Optional Frontmatter

The extension now supports files without YAML frontmatter by detecting Linear ticket IDs in filenames:

1. **Automatic Detection**: Files named like `ABC-123.md` or containing `ABC-123` in the filename will be recognized as Linear issues
2. **Automatic Frontmatter**: When syncing, the extension will add the appropriate frontmatter if missing
3. **Flexible Workflow**: Start with a simple file named after a Linear ticket and the extension will handle the rest

This makes it easier to quickly create files for Linear tickets without having to manually add frontmatter.
