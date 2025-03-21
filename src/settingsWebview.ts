import * as vscode from "vscode";

export class SettingsWebview {
  public static readonly viewType = "linearMdSettings";
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    // Check for existing panels - search through all webview panels
    const existingPanels = vscode.window.visibleTextEditors
      .filter((editor) => editor.document.uri.scheme === "vscode-webview")
      .filter((editor) => {
        const panelId = editor.document.uri.path;
        return panelId.includes(SettingsWebview.viewType);
      });

    if (existingPanels.length > 0) {
      // If we find an existing panel, reveal it
      vscode.commands.executeCommand("vscode-webview-panel.reveal");
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      SettingsWebview.viewType,
      "Linear Markdown Settings",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
      }
    );

    new SettingsWebview(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      (e) => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "saveSettings":
            this.saveSettings(message.settings);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  private saveSettings(settings: any) {
    const config = vscode.workspace.getConfiguration("linear-md");

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      config.update(key, value, vscode.ConfigurationTarget.Global);
    }

    vscode.window.showInformationMessage(
      "Linear Markdown settings updated successfully."
    );
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = "Linear Markdown Settings";
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the current settings
    const config = vscode.workspace.getConfiguration("linear-md");
    const enableCodeLens = config.get<boolean>("enableCodeLens", true);
    const filenameFormat = config.get<string>("filenameFormat", "${title}");
    const dateFormat = config.get<string>("dateFormat", "YMD");
    const createDirectory = config.get<boolean>("createDirectory", false);
    const directoryFormat = config.get<string>("directoryFormat", "none");
    const skipFrontmatter = config.get<boolean>("skipFrontmatter", false);
    const customFrontmatterFields = config.get<string[]>(
      "customFrontmatterFields",
      []
    );

    // Create the HTML content
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Linear Markdown Settings</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
                padding: 20px;
            }
            .form-group {
                margin-bottom: 15px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            select, input[type="text"], textarea {
                width: 100%;
                padding: 8px;
                border-radius: 3px;
                border: 1px solid var(--vscode-input-border);
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
            }
            input[type="checkbox"] {
                margin-right: 5px;
            }
            button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 16px;
                border-radius: 3px;
                cursor: pointer;
                margin-top: 10px;
            }
            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            .description {
                font-size: 0.9em;
                color: var(--vscode-descriptionForeground);
                margin-top: 4px;
            }
            .preset-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                margin-top: 5px;
            }
            .preset-button {
                font-size: 0.8em;
                padding: 4px 8px;
            }
            fieldset {
                border: 1px solid var(--vscode-panel-border);
                border-radius: 5px;
                padding: 10px;
                margin-bottom: 15px;
            }
            legend {
                font-weight: bold;
                padding: 0 5px;
            }
            .custom-fields {
                display: flex;
                align-items: center;
                margin-bottom: 5px;
            }
            .custom-fields input {
                flex-grow: 1;
                margin-right: 5px;
            }
            .remove-field {
                background-color: var(--vscode-errorForeground);
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                padding: 4px 8px;
            }
            #add-field {
                background-color: var(--vscode-extensionButton-prominentBackground);
                color: var(--vscode-extensionButton-prominentForeground);
            }
        </style>
    </head>
    <body>
        <h1>Linear Markdown Settings</h1>
        <form id="settings-form">
            <fieldset>
                <legend>Filename Settings</legend>
                <div class="form-group">
                    <label for="filenameFormat">Filename Format:</label>
                    <input type="text" id="filenameFormat" value="${filenameFormat}">
                    <div class="description">
                        Available variables: \${title}, \${id} (Linear ticket ID), \${type}, \${date}. Include the .md extension.
                    </div>
                    <div class="preset-buttons">
                        <button type="button" class="preset-button" data-preset="\${title}.md">Title</button>
                        <button type="button" class="preset-button" data-preset="\${id}.md">Ticket ID</button>
                        <button type="button" class="preset-button" data-preset="\${id}-\${title}.md">Ticket-Title</button>
                        <button type="button" class="preset-button" data-preset="\${date}-\${title}.md">Date-Title</button>
                        <button type="button" class="preset-button" data-preset="\${date}-\${id}-\${title}.md">Date-Ticket-Title</button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="dateFormat">Date Format:</label>
                    <select id="dateFormat">
                        <option value="ISO" ${
                          dateFormat === "ISO" ? "selected" : ""
                        }>ISO (2023-04-28)</option>
                        <option value="Short" ${
                          dateFormat === "Short" ? "selected" : ""
                        }>Short (230428)</option>
                        <option value="YMD" ${
                          dateFormat === "YMD" ? "selected" : ""
                        }>YMD (20230428)</option>
                        <option value="DMY" ${
                          dateFormat === "DMY" ? "selected" : ""
                        }>DMY (28042023)</option>
                        <option value="MDY" ${
                          dateFormat === "MDY" ? "selected" : ""
                        }>MDY (04282023)</option>
                    </select>
                </div>
            </fieldset>
            
            <fieldset>
                <legend>Directory Settings</legend>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="createDirectory" ${
                          createDirectory ? "checked" : ""
                        }>
                        Create Directory for each issue/document
                    </label>
                    <div class="description">Organize files into directories based on team or status</div>
                </div>
                
                <div class="form-group" id="directoryFormatGroup" ${
                  !createDirectory ? 'style="opacity: 0.5;"' : ""
                }>
                    <label for="directoryFormat">Directory Format:</label>
                    <select id="directoryFormat" ${
                      !createDirectory ? "disabled" : ""
                    }>
                        <option value="team" ${
                          directoryFormat === "team" ? "selected" : ""
                        }>By Team</option>
                        <option value="status" ${
                          directoryFormat === "status" ? "selected" : ""
                        }>By Status</option>
                        <option value="none" ${
                          directoryFormat === "none" ? "selected" : ""
                        }>No Subdirectories</option>
                    </select>
                </div>
            </fieldset>
            
            <fieldset>
                <legend>Frontmatter Settings</legend>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="skipFrontmatter" ${
                          skipFrontmatter ? "checked" : ""
                        }>
                        Skip generating YAML frontmatter (not recommended)
                    </label>
                </div>
                
                <div class="form-group" id="customFieldsGroup" ${
                  skipFrontmatter ? 'style="opacity: 0.5;"' : ""
                }>
                    <label>Custom Frontmatter Fields:</label>
                    <div id="custom-fields-container">
                        ${customFrontmatterFields
                          .map(
                            (field, index) => `
                            <div class="custom-fields">
                                <input type="text" class="custom-field" value="${field}">
                                <button type="button" class="remove-field">Remove</button>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                    <button type="button" id="add-field" ${
                      skipFrontmatter ? "disabled" : ""
                    }>Add Field</button>
                    <div class="description">Add custom fields from Linear to include in frontmatter (e.g., priority, assignee)</div>
                </div>
            </fieldset>
            
            <fieldset>
                <legend>Interface Settings</legend>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="enableCodeLens" ${
                          enableCodeLens ? "checked" : ""
                        }>
                        Enable CodeLens buttons at the top of markdown files
                    </label>
                </div>
            </fieldset>
            
            <button type="submit">Save Settings</button>
        </form>
        
        <script>
            (function() {
                const vscode = acquireVsCodeApi();
                
                // Handle form submission
                document.getElementById('settings-form').addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    // Collect settings
                    const settings = {
                        enableCodeLens: document.getElementById('enableCodeLens').checked,
                        filenameFormat: document.getElementById('filenameFormat').value,
                        dateFormat: document.getElementById('dateFormat').value,
                        createDirectory: document.getElementById('createDirectory').checked,
                        directoryFormat: document.getElementById('directoryFormat').value,
                        skipFrontmatter: document.getElementById('skipFrontmatter').checked,
                        customFrontmatterFields: Array.from(document.querySelectorAll('.custom-field')).map(field => field.value)
                    };
                    
                    // Send settings to extension
                    vscode.postMessage({
                        command: 'saveSettings',
                        settings: settings
                    });
                });
                
                // Toggle directory format settings based on createDirectory checkbox
                document.getElementById('createDirectory').addEventListener('change', function() {
                    const directoryFormatGroup = document.getElementById('directoryFormatGroup');
                    const directoryFormatSelect = document.getElementById('directoryFormat');
                    
                    directoryFormatGroup.style.opacity = this.checked ? '1' : '0.5';
                    directoryFormatSelect.disabled = !this.checked;
                });
                
                // Toggle custom fields settings based on skipFrontmatter checkbox
                document.getElementById('skipFrontmatter').addEventListener('change', function() {
                    const customFieldsGroup = document.getElementById('customFieldsGroup');
                    const addFieldButton = document.getElementById('add-field');
                    
                    customFieldsGroup.style.opacity = this.checked ? '0.5' : '1';
                    addFieldButton.disabled = this.checked;
                });
                
                // Add custom field
                document.getElementById('add-field').addEventListener('click', function() {
                    const container = document.getElementById('custom-fields-container');
                    const fieldDiv = document.createElement('div');
                    fieldDiv.className = 'custom-fields';
                    
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'custom-field';
                    
                    const removeButton = document.createElement('button');
                    removeButton.type = 'button';
                    removeButton.className = 'remove-field';
                    removeButton.textContent = 'Remove';
                    removeButton.addEventListener('click', function() {
                        container.removeChild(fieldDiv);
                    });
                    
                    fieldDiv.appendChild(input);
                    fieldDiv.appendChild(removeButton);
                    container.appendChild(fieldDiv);
                });
                
                // Remove custom field
                document.querySelectorAll('.remove-field').forEach(button => {
                    button.addEventListener('click', function() {
                        const fieldDiv = this.parentElement;
                        fieldDiv.parentElement.removeChild(fieldDiv);
                    });
                });
                
                // Preset filename formats
                document.querySelectorAll('.preset-button').forEach(button => {
                    button.addEventListener('click', function() {
                        document.getElementById('filenameFormat').value = this.dataset.preset;
                    });
                });
            })();
        </script>
    </body>
    </html>`;
  }

  public dispose() {
    // Clean up resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}
