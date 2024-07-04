# Linear Markdown
A simple plugin to sync linear issues and docs to markdown files.


## Features

This extension allows you to synchronize Linear issues and documents with markdown files in your VS Code workspace. It provides two main functionalities:

1. **Sync Down**: Update your local markdown file with content from Linear.
2. **Sync Up**: Update Linear issue or document with content from your local markdown file.

## How to Use

### Setup

1. Install the extension.
2. Use the command "Input Linear Key" to set up your Linear API key.


### File Format

Your markdown files should include a YAML frontmatter with a Linear identifier:
```
---
linear-issue-id: 
---

or

---
linear-document-id: 
---
```


### Obtaining Linear IDs

#### For Issues:
To get the ID of a Linear issue:

1. Open the issue in Linear.
2. Look for the "Copy issue ID" button (usually near the issue title).
3. Click this button to copy the issue ID to your clipboard.
4. Use this ID in your markdown file's frontmatter.

#### For Documents:
To obtain the document ID of a Linear document:

1. Open the document in Linear.
2. Use the command menu (Ctrl + K or Cmd + K on Mac).
3. Type "Developer: Copy model UUID" and select it from the results.
4. The document ID will be copied to your clipboard, ready to use in your markdown file's frontmatter.


### Sync Commands

1. **Sync Down from Linear**: 
   - Fetches content from Linear to update your local markdown file.
   - Use: Open markdown file, run command from Command Palette.

2. **Sync Up to Linear**:
   - Updates Linear with content from your local markdown file.
   - Use: After editing markdown, run command to push changes to Linear.


### Filename Updating

When syncing down from Linear, the extension updates the local filename to match the Linear issue or document title. If the title has changed, a new file is created with the updated name, and the old file is deleted. This ensures your local files always reflect the current titles in Linear.





