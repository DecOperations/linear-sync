# Using Linear Markdown with Cursor

This guide explains how to run and test the Linear Markdown extension with Cursor.

## Method 1: Using the Setup Script

The easiest way to test the extension with Cursor is to use the provided setup script:

```bash
./setup.sh -i cursor
```

This will:

1. Compile the extension if needed
2. Launch Cursor with the extension loaded
3. Open this test workspace

## Method 2: Manual Launch

You can manually launch Cursor with the extension loaded:

```bash
cursor --new-window --extensionDevelopmentPath=/absolute/path/to/linear-sync /absolute/path/to/linear-sync/test-workspace
```

Replace the paths with the appropriate absolute paths on your system.

## Method 3: Using VS Code's Debug Configuration

1. Open the parent directory (linear-sync) in Cursor
2. Go to the Run and Debug view (Ctrl+Shift+D or Cmd+Shift+D on Mac)
3. Select "Extension with Test Workspace (Cursor)" from the dropdown
4. Press F5 to start debugging

## Troubleshooting

If you encounter issues with Cursor not finding the extension:

1. Make sure you have the latest version of Cursor installed
2. Ensure the extension is properly compiled (`npm run compile` in the parent directory)
3. Check that the extension manifest (package.json) is correctly formatted
4. Verify that your Cursor installation supports loading VS Code extensions

## Note

Cursor is built on the VS Code engine, so it should be compatible with most VS Code extensions. However, some extensions might have specific dependencies or assumptions about the VS Code environment that could cause issues.
