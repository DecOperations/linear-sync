# Linear Markdown Test Workspace

This is a test workspace for trying out the Linear Markdown extension.

## Directory Structure

- `/issues`: Contains example markdown files with Linear issue IDs
- `/documents`: Contains example markdown files with Linear document IDs

## How to Test

1. Get your Linear API key
2. Open this workspace in VS Code
3. Run the "Input Linear Key" command and enter your API key
4. Update the example files with real Linear issue and document IDs
5. Try out the sync commands:
   - "Sync Down from Linear" to fetch content from Linear to your local files
   - "Sync Up to Linear" to update Linear with content from your local files

## Testing Workflow

1. Create an issue or document in Linear
2. Copy its ID and add it to the corresponding example file's frontmatter
3. Use the sync commands to test syncing in both directions
4. Observe how content and filenames get updated based on Linear data
