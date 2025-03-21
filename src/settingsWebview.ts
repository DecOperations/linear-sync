import * as vscode from "vscode";

export class SettingsWebview {
  public static readonly viewType = "linearMdSettings";
  private static panel: vscode.WebviewPanel | undefined;

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (SettingsWebview.panel) {
      SettingsWebview.panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    SettingsWebview.panel = vscode.window.createWebviewPanel(
      SettingsWebview.viewType,
      "Linear Markdown Settings",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
      }
    );

    // Listen for when the panel is disposed
    SettingsWebview.panel.onDidDispose(() => {
      SettingsWebview.panel = undefined;
    });

    // Handle messages from the webview
    SettingsWebview.panel.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "saveSettings") {
        await SettingsWebview.saveSettings(message.settings);
      }
    });

    // Set initial HTML content
    SettingsWebview.updateContent();
  }

  private static async saveSettings(settings: any) {
    try {
      const config = vscode.workspace.getConfiguration("linear-md");

      // Update each setting with global scope
      for (const [key, value] of Object.entries(settings)) {
        await config.update(key, value, vscode.ConfigurationTarget.Global);
        console.log(`Updated setting ${key} = ${JSON.stringify(value)}`);
      }

      // Display success message
      vscode.window.showInformationMessage(
        "Linear Markdown settings updated successfully. Changes will apply to new syncs."
      );

      // Update the webview content to reflect new settings
      SettingsWebview.updateContent();
    } catch (error) {
      console.error("Error saving settings:", error);
      vscode.window.showErrorMessage(
        `Failed to save settings: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private static updateContent() {
    if (!SettingsWebview.panel) {
      return;
    }

    const webview = SettingsWebview.panel.webview;
    webview.html = SettingsWebview.getWebviewContent();
  }

  private static getWebviewContent(): string {
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

    // Generate custom fields HTML
    const customFieldsHtml = customFrontmatterFields
      .map(
        (field) =>
          `<div class="custom-fields" draggable="true">
            <div class="drag-handle">≡</div>
            <input type="text" class="custom-field" value="${field}">
            <button type="button" class="remove-field">Remove</button>
         </div>`
      )
      .join("");

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
            background-color: var(--vscode-input-background);
            border-radius: 3px;
            padding: 3px;
            cursor: move;
        }
        .custom-fields:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        .custom-fields.dragging {
            opacity: 0.5;
            border: 1px dashed var(--vscode-focusBorder);
        }
        .custom-fields .drag-handle {
            padding: 4px 8px;
            margin-right: 5px;
            color: var(--vscode-descriptionForeground);
            cursor: grab;
        }
        .custom-fields.dragging .drag-handle {
            cursor: grabbing;
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
        .add-field-row {
            display: flex;
            gap: 8px;
            margin-bottom: 10px;
            align-items: center;
        }
        #field-selector {
            flex-grow: 1;
            height: 32px;
        }
        #add-selected-field {
            background-color: var(--vscode-extensionButton-prominentBackground);
            color: var(--vscode-extensionButton-prominentForeground);
            white-space: nowrap;
        }
        #add-field {
            white-space: nowrap;
            background-color: var(--vscode-button-background);
        }
        .custom-fields.drag-over {
            border: 2px dashed var(--vscode-focusBorder);
            background-color: var(--vscode-editor-hoverHighlightBackground);
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
            
            <div class="form-group" id="directoryFormatGroup" style="opacity: ${
              createDirectory ? "1" : "0.5"
            };">
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
            
            <div class="form-group" id="customFieldsGroup" style="opacity: ${
              skipFrontmatter ? "0.5" : "1"
            };">
                <label>Custom Frontmatter Fields:</label>
                <div id="custom-fields-container">
                    ${customFieldsHtml}
                </div>
                <div class="add-field-row">
                    <select id="field-selector">
                        <option value="">-- Select a field to add --</option>
                        <optgroup label="Issue Fields">
                            <option value="id">id</option>
                            <option value="title">title</option>
                            <option value="assignee">assignee</option>
                            <option value="priority">priority</option>
                            <option value="state">state</option>
                            <option value="team">team</option>
                            <option value="dueDate">dueDate</option>
                            <option value="estimate">estimate</option>
                            <option value="labels">labels</option>
                            <option value="project">project</option>
                            <option value="cycle">cycle</option>
                            <option value="subIssueSortOrder">subIssueSortOrder</option>
                            <option value="startedAt">startedAt</option>
                            <option value="completedAt">completedAt</option>
                            <option value="canceledAt">canceledAt</option>
                            <option value="autoClosedAt">autoClosedAt</option>
                            <option value="autoArchivedAt">autoArchivedAt</option>
                            <option value="slaStatus">slaStatus</option>
                            <option value="subscribers">subscribers</option>
                        </optgroup>
                        <optgroup label="Document Fields">
                            <option value="id">id</option>
                            <option value="title">title</option>
                            <option value="icon">icon</option>
                            <option value="color">color</option>
                            <option value="project">project</option>
                            <option value="lastUpdatedBy">lastUpdatedBy</option>
                        </optgroup>
                        <optgroup label="Common Fields">
                            <option value="createdAt">createdAt</option>
                            <option value="updatedAt">updatedAt</option>
                            <option value="creator">creator</option>
                            <option value="url">url</option>
                        </optgroup>
                    </select>
                    <button type="button" id="add-selected-field" ${
                      skipFrontmatter ? "disabled" : ""
                    }>Add Selected Field</button>
                    <button type="button" id="add-field" ${
                      skipFrontmatter ? "disabled" : ""
                    }>Add Custom Field</button>
                </div>
                <div class="description">Add custom fields from Linear to include in frontmatter. Selected fields will be added to the YAML frontmatter when syncing from Linear.</div>
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
            
            // Add selected field from dropdown
            document.getElementById('add-selected-field').addEventListener('click', function() {
                const selector = document.getElementById('field-selector');
                const selectedValue = selector.value;
                
                if (selectedValue) {
                    addCustomField(selectedValue);
                    // Reset the selector
                    selector.value = '';
                }
            });
            
            // Add empty custom field
            document.getElementById('add-field').addEventListener('click', function() {
                addCustomField('');
            });
            
            function addCustomField(fieldValue) {
                const container = document.getElementById('custom-fields-container');
                const fieldDiv = document.createElement('div');
                fieldDiv.className = 'custom-fields';
                fieldDiv.draggable = true;
                
                const dragHandle = document.createElement('div');
                dragHandle.className = 'drag-handle';
                dragHandle.textContent = '≡';
                
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'custom-field';
                input.value = fieldValue;
                
                const removeButton = document.createElement('button');
                removeButton.type = 'button';
                removeButton.className = 'remove-field';
                removeButton.textContent = 'Remove';
                removeButton.addEventListener('click', function() {
                    container.removeChild(fieldDiv);
                });
                
                fieldDiv.appendChild(dragHandle);
                fieldDiv.appendChild(input);
                fieldDiv.appendChild(removeButton);
                container.appendChild(fieldDiv);
                
                // Add drag event listeners
                setupDragAndDrop(fieldDiv);
            }
            
            // Set up drag-and-drop sorting
            function setupDragAndDrop(element) {
                element.addEventListener('dragstart', handleDragStart);
                element.addEventListener('dragover', handleDragOver);
                element.addEventListener('dragenter', handleDragEnter);
                element.addEventListener('dragleave', handleDragLeave);
                element.addEventListener('drop', handleDrop);
                element.addEventListener('dragend', handleDragEnd);
            }
            
            // Initialize existing fields with drag-and-drop
            document.querySelectorAll('.custom-fields').forEach(field => {
                setupDragAndDrop(field);
            });
            
            let dragSrcEl = null;
            
            function handleDragStart(e) {
                this.classList.add('dragging');
                
                dragSrcEl = this;
                
                // Required for drag & drop to work properly
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', this.outerHTML);
            }
            
            function handleDragOver(e) {
                if (e.preventDefault) {
                    e.preventDefault(); // Necessary to allow drop
                }
                e.dataTransfer.dropEffect = 'move';
                return false;
            }
            
            function handleDragEnter(e) {
                this.classList.add('drag-over');
            }
            
            function handleDragLeave(e) {
                this.classList.remove('drag-over');
            }
            
            function handleDrop(e) {
                if (e.stopPropagation) {
                    e.stopPropagation(); // Prevent browser from handling drop
                }
                
                // Don't do anything if dropping on the same item
                if (dragSrcEl !== this) {
                    const container = document.getElementById('custom-fields-container');
                    const allItems = Array.from(container.querySelectorAll('.custom-fields'));
                    const sourceIndex = allItems.indexOf(dragSrcEl);
                    const targetIndex = allItems.indexOf(this);
                    
                    // If target is below source, insert after; otherwise, insert before
                    if (sourceIndex < targetIndex) {
                        this.parentNode.insertBefore(dragSrcEl, this.nextSibling);
                    } else {
                        this.parentNode.insertBefore(dragSrcEl, this);
                    }
                }
                
                return false;
            }
            
            function handleDragEnd(e) {
                document.querySelectorAll('.custom-fields').forEach(field => {
                    field.classList.remove('dragging');
                    field.classList.remove('drag-over');
                });
            }
            
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
}
