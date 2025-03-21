import * as vscode from "vscode";
import Linear from "./linear";
import * as yaml from "js-yaml";
import { SettingsWebview } from "./settingsWebview";

const linearAPIStorageKey = "LINEAR_MD_API_STORAGE_KEY";

class LinearCodeLensProvider implements vscode.CodeLensProvider {
  private extractFrontMatter(content: string): any {
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontMatterRegex);
    if (match && match[1]) {
      try {
        return yaml.load(match[1]);
      } catch (e) {
        console.error("Error parsing front matter:", e);
      }
    }
    return null;
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const config = vscode.workspace.getConfiguration("linear-md");
    const enableCodeLens = config.get<boolean>("enableCodeLens", true);

    if (!enableCodeLens) {
      return [];
    }

    const text = document.getText();
    const frontMatter = this.extractFrontMatter(text);

    if (
      !frontMatter ||
      (!frontMatter["linear-issue-id"] && !frontMatter["linear-document-id"])
    ) {
      return [];
    }

    const firstLine = document.lineAt(0);
    return [
      new vscode.CodeLens(firstLine.range, {
        title: "Sync Up",
        command: "linear-md.sync-up",
      }),
      new vscode.CodeLens(firstLine.range, {
        title: "Sync Down",
        command: "linear-md.sync-down",
      }),
    ];
  }
}

export function activate(context: vscode.ExtensionContext) {
  let linear: Linear | undefined;

  const apiKey = context.globalState.get(linearAPIStorageKey);
  if (apiKey && (apiKey as string).startsWith("lin_api")) {
    linear = new Linear(apiKey as string);
  }

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "linear-md.input-linear-api-key",
      async () => {
        const input = await vscode.window.showInputBox({
          placeHolder: "lin_api_*",
          prompt: "Enter Linear API Key",
        });

        if (input && input.trim()) {
          try {
            linear = new Linear(input);
            await linear.init();
            context.globalState.update(linearAPIStorageKey, input);
            vscode.window.showInformationMessage(
              "Linear API key successfully set."
            );
          } catch (error) {
            vscode.window.showErrorMessage(
              "Failed to initialize Linear client. Please check your API key."
            );
          }
        } else {
          vscode.window.showErrorMessage(
            "No API key provided. Operation cancelled."
          );
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "linear-md.delete-linear-api-key",
      async () => {
        const confirmation = await vscode.window.showWarningMessage(
          "Are you sure you want to delete the Linear API key?",
          "Yes",
          "No"
        );

        if (confirmation === "Yes") {
          context.globalState.update(linearAPIStorageKey, undefined);
          linear = undefined;
          vscode.window.showInformationMessage(
            "Linear API key has been deleted."
          );
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("linear-md.sync-up", async () => {
      if (!linear) {
        vscode.window.showErrorMessage(
          'Linear API key not set. Please use the "Input Linear Key" command first.'
        );
        return;
      }
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor found.");
        return;
      }

      const document = editor.document;
      const filePath = document.uri.fsPath;

      try {
        await linear.syncUp(filePath);
        vscode.window.showInformationMessage(
          "Linear content successfully updated."
        );
      } catch (error) {
        if (error instanceof Error) {
          vscode.window.showErrorMessage(
            `Error updating the Linear content: ${error.message}`
          );
        } else {
          vscode.window.showErrorMessage("An unknown error occurred.");
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("linear-md.sync-down", async () => {
      if (!linear) {
        vscode.window.showErrorMessage(
          'Linear API key not set. Please use the "Input Linear Key" command first.'
        );
        return;
      }
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor found.");
        return;
      }

      const document = editor.document;
      const filePath = document.uri.fsPath;

      try {
        await linear.syncDown(filePath);
        vscode.window.showInformationMessage(
          "File successfully updated with Linear content."
        );
      } catch (error) {
        if (error instanceof Error) {
          vscode.window.showErrorMessage(
            `Error updating the file: ${error.message}`
          );
        } else {
          vscode.window.showErrorMessage("An unknown error occurred.");
        }
      }
    })
  );

  // Register command to open extension settings
  context.subscriptions.push(
    vscode.commands.registerCommand("linear-md.open-settings", () => {
      vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "linear-md"
      );
    })
  );

  // Register command to open visual settings editor
  context.subscriptions.push(
    vscode.commands.registerCommand("linear-md.open-visual-settings", () => {
      SettingsWebview.createOrShow(context.extensionUri);
    })
  );

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { language: "markdown" },
      new LinearCodeLensProvider()
    )
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
