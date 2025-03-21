import {
  LinearClient,
  User,
  Issue,
  Document as LinearDocument,
} from "@linear/sdk";
import * as vscode from "vscode";

const fs = require("fs");
const path = require("path");

export default class Linear {
  linearClient: LinearClient;
  me: User = {} as User;

  constructor(apiKey: string) {
    this.linearClient = new LinearClient({ apiKey });
  }

  async init() {
    this.me = await this.linearClient.viewer;
  }

  // Method to reload configuration when settings change
  reloadConfig() {
    console.log("Reloading Linear Markdown configuration");
    // Clear any cached settings - for future expansion
    // This method is called when configuration changes are detected
  }

  // Format a date according to the configuration
  private formatDate(date: Date): string {
    const config = vscode.workspace.getConfiguration("linear-md");
    const dateFormat = config.get<string>("dateFormat", "YMD");

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    switch (dateFormat) {
      case "ISO":
        return `${year}-${month}-${day}`;
      case "Short":
        return `${year.toString().slice(2)}${month}${day}`;
      case "DMY":
        return `${day}${month}${year}`;
      case "MDY":
        return `${month}${day}${year}`;
      case "YMD":
      default:
        return `${year}${month}${day}`;
    }
  }

  // Generate a filename based on Linear item and configuration
  private generateFilename(
    item: Issue | LinearDocument,
    identifier: string,
    contentType: "issue" | "document"
  ): string {
    // Always get a fresh configuration to avoid using cached values
    const config = vscode.workspace.getConfiguration("linear-md", null);
    // Use default that includes .md extension
    const filenameFormat = config.get<string>("filenameFormat", "${title}.md");

    console.log(`Using filename format: ${filenameFormat}`); // Debug logging

    // Get the issue identifier (like ABC-123) if this is an issue
    let ticketId = "";
    if (
      contentType === "issue" &&
      item instanceof Object &&
      "identifier" in item
    ) {
      ticketId = item.identifier as string;
    }

    const now = new Date();

    // Replace variables in the filename format
    let filename = filenameFormat
      .replace(/\${title}/g, item.title || "Untitled")
      .replace(/\${id}/g, ticketId || identifier)
      .replace(/\${type}/g, contentType)
      .replace(/\${date}/g, this.formatDate(now))
      .replace(/\${ticket}/g, ticketId); // Keep for backward compatibility

    // Sanitize the filename (remove characters that aren't valid in filenames)
    filename = filename.replace(/[/\\?%*:|"<>]/g, "-");

    // Ensure the filename ends with .md
    if (!filename.toLowerCase().endsWith(".md")) {
      filename = `${filename}.md`;
    }

    return filename;
  }

  // Create directory for the file if needed based on config
  private getDirectoryPath(
    item: Issue | LinearDocument,
    basePath: string
  ): string {
    const config = vscode.workspace.getConfiguration("linear-md");
    const createDirectory = config.get<boolean>("createDirectory", false);
    const directoryFormat = config.get<string>("directoryFormat", "none");

    if (!createDirectory || directoryFormat === "none") {
      return basePath;
    }

    let dirName = "";

    if (
      directoryFormat === "team" &&
      item instanceof Object &&
      "team" in item &&
      item.team
    ) {
      // Access team name safely
      const teamName =
        typeof item.team === "object" && item.team && "name" in item.team
          ? (item.team.name as string)
          : "Unknown Team";
      dirName = teamName.replace(/[/\\?%*:|"<>]/g, "-");
    } else if (
      directoryFormat === "status" &&
      item instanceof Object &&
      "state" in item &&
      item.state
    ) {
      // Access state name safely
      const stateName =
        typeof item.state === "object" && item.state && "name" in item.state
          ? (item.state.name as string)
          : "Unknown Status";
      dirName = stateName.replace(/[/\\?%*:|"<>]/g, "-");
    }

    if (dirName) {
      const dirPath = path.join(basePath, dirName);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      return dirPath;
    }

    return basePath;
  }

  // Generate frontmatter with custom fields if configured
  private generateFrontmatter(
    item: Issue | LinearDocument,
    identifier: string,
    contentType: "issue" | "document",
    existingYaml: string
  ): string {
    const config = vscode.workspace.getConfiguration("linear-md");
    const skipFrontmatter = config.get<boolean>("skipFrontmatter", false);

    if (skipFrontmatter) {
      return "";
    }

    const customFields = config.get<string[]>("customFrontmatterFields", []);

    // Start with the essential Linear ID
    let frontmatter = `linear-${contentType}-id: ${identifier}`;

    // Add custom fields if they exist on the item
    for (const field of customFields) {
      // Skip if this is the linear ID field we already added
      if (field === `linear-${contentType}-id`) continue;

      try {
        // Handle nested fields (e.g., "team.name")
        const fieldPath = field.split(".");
        let value = item as any;

        for (const part of fieldPath) {
          if (value === null || value === undefined) break;
          value = value[part];
        }

        // Add the field if it has a value
        if (value !== undefined && value !== null) {
          // Format the value based on type
          let formattedValue = value;

          // Handle dates with ISO format
          if (value instanceof Date) {
            formattedValue = value.toISOString();
          }
          // Handle objects by using their name or id if available
          else if (typeof value === "object" && value !== null) {
            if ("name" in value) {
              formattedValue = value.name;
            } else if ("id" in value) {
              formattedValue = value.id;
            } else {
              // Try to stringify if we can't get a simple property
              try {
                formattedValue = JSON.stringify(value);
              } catch (e) {
                formattedValue = "[Complex Object]";
              }
            }
          }

          // Add the field to frontmatter
          frontmatter += `\n${field}: ${formattedValue}`;
        }
      } catch (error) {
        console.error(`Error processing field ${field}:`, error);
      }
    }

    // Preserve existing fields from the YAML that weren't overwritten
    if (existingYaml) {
      const existingLines = existingYaml.split("\n");
      for (const line of existingLines) {
        // Skip empty lines
        if (!line.trim()) continue;

        const colonIndex = line.indexOf(":");
        if (colonIndex > 0) {
          const fieldName = line.substring(0, colonIndex).trim();

          // Only add if not already in our frontmatter
          if (!frontmatter.includes(`${fieldName}:`)) {
            frontmatter += `\n${line}`;
          }
        }
      }
    }

    return frontmatter.trim();
  }

  // Extract Linear ID from filename
  private extractLinearIdFromFilename(
    filePath: string
  ): { contentType: "issue" | "document"; identifier: string } | null {
    const fileName = path.basename(filePath);

    // Match ticket identifiers like ABC-123 or DEF-456
    const ticketIdMatch = fileName.match(/([A-Z]+-\d+)/);
    if (ticketIdMatch && ticketIdMatch[1]) {
      return {
        contentType: "issue",
        identifier: ticketIdMatch[1],
      };
    }

    // For document IDs, we would need a specific pattern to recognize them
    // This is a simplified approach - documents typically have UUIDs
    // We can add more specific pattern matching if needed

    return null;
  }

  // Detect if content has frontmatter
  private hasFrontmatter(content: string): boolean {
    return /^---\s*\n[\s\S]*?\n---\s*\n/.test(content);
  }

  // Create frontmatter if it doesn't exist
  private ensureFrontmatter(
    content: string,
    contentType: "issue" | "document",
    identifier: string
  ): string {
    if (this.hasFrontmatter(content)) {
      return content.endsWith("\n") ? content : content + "\n";
    }

    // Ensure content ends with a newline
    if (!content.endsWith("\n")) {
      content += "\n";
    }

    return `---\nlinear-${contentType}-id: ${identifier}\n---\n\n${content}`;
  }

  async syncDown(filePath: string) {
    const fileContent = fs.readFileSync(filePath, "utf8");
    let contentType: "issue" | "document";
    let identifier: string;
    let yamlContent = "";

    // Try to find Linear ID in frontmatter
    const frontmatterMatch = fileContent.match(
      /linear-(issue|document)-id:\s*([\w-]+)/
    );

    if (frontmatterMatch) {
      // Extract from frontmatter
      contentType = frontmatterMatch[1] as "issue" | "document";
      identifier = frontmatterMatch[2];

      // Extract YAML content if available
      const yamlMatch = fileContent.match(/---([\s\S]*?)---/);
      if (yamlMatch) {
        yamlContent = yamlMatch[1].trim();
      }
    } else {
      // Try to extract from filename
      const filenameInfo = this.extractLinearIdFromFilename(filePath);

      if (!filenameInfo) {
        throw new Error("Linear ID not found in file frontmatter or filename");
      }

      contentType = filenameInfo.contentType;
      identifier = filenameInfo.identifier;
    }

    let newContent = "";
    let item: Issue | LinearDocument;

    if (contentType === "issue") {
      const issue = await this.linearClient.issue(identifier);
      if (!issue) {
        throw new Error(`Issue ${identifier} not found`);
      }
      item = issue;
      const frontmatter = this.generateFrontmatter(
        issue,
        identifier,
        contentType,
        yamlContent
      );
      newContent = frontmatter
        ? `---\n${frontmatter}\n---\n\n${issue.description || ""}`
        : issue.description || "";
    } else if (contentType === "document") {
      const document = await this.linearClient.document(identifier);
      if (!document) {
        throw new Error(`Document ${identifier} not found`);
      }
      item = document;
      const frontmatter = this.generateFrontmatter(
        document,
        identifier,
        contentType,
        yamlContent
      );
      newContent = frontmatter
        ? `---\n${frontmatter}\n---\n\n${document.content || ""}`
        : document.content || "";
    } else {
      throw new Error("Invalid content type");
    }

    // Get fresh configuration and generate filename
    const config = vscode.workspace.getConfiguration("linear-md", null);
    console.log(
      "Current filename format:",
      config.get<string>("filenameFormat", "${title}.md")
    );

    // Generate new filename and directory path
    const baseDir = path.dirname(filePath);
    const dirPath = this.getDirectoryPath(item, baseDir);
    const filename = this.generateFilename(item, identifier, contentType);
    const newFilePath = path.join(dirPath, filename);

    console.log(`Generated filename: ${filename}`);
    console.log(`New file path: ${newFilePath}`);

    // Ensure content ends with a newline
    if (!newContent.endsWith("\n")) {
      newContent += "\n";
    }

    fs.writeFileSync(newFilePath, newContent, "utf8");
    console.log(
      `Updated ${newFilePath} with content from Linear ${contentType} ${identifier}`
    );

    if (newFilePath !== filePath) {
      fs.unlinkSync(filePath);
      console.log(`Deleted old file ${filePath}`);
    }
  }

  async syncUp(filePath: string) {
    let fileContent = fs.readFileSync(filePath, "utf8");
    let contentType: "issue" | "document";
    let identifier: string;
    let localContent: string;

    // Try to find Linear ID in frontmatter
    const frontmatterMatch = fileContent.match(
      /linear-(issue|document)-id:\s*([\w-]+)/
    );

    if (frontmatterMatch) {
      // Extract from frontmatter
      contentType = frontmatterMatch[1] as "issue" | "document";
      identifier = frontmatterMatch[2];

      // Extract content after frontmatter
      const contentMatch = fileContent.match(/---\n[\s\S]*?\n---\n([\s\S]*)/);
      if (contentMatch) {
        localContent = contentMatch[1].trim();
      } else {
        throw new Error("Content after YAML frontmatter not found in the file");
      }
    } else {
      // Try to extract from filename
      const filenameInfo = this.extractLinearIdFromFilename(filePath);

      if (!filenameInfo) {
        throw new Error("Linear ID not found in file frontmatter or filename");
      }

      contentType = filenameInfo.contentType;
      identifier = filenameInfo.identifier;

      // The entire file content is the document content
      localContent = fileContent.trim();

      // Add frontmatter to the file for future use
      fileContent = this.ensureFrontmatter(
        fileContent,
        contentType,
        identifier
      );

      // Ensure content ends with a newline
      if (!fileContent.endsWith("\n")) {
        fileContent += "\n";
      }

      fs.writeFileSync(filePath, fileContent, "utf8");
    }

    const fileName = path.basename(filePath, path.extname(filePath));

    if (contentType === "issue") {
      const issue = await this.linearClient.issue(identifier);
      if (!issue) {
        throw new Error(`Issue ${identifier} not found`);
      }
      await this.linearClient.updateIssue(issue.id, {
        title: fileName,
        description: localContent,
      });
      console.log(`Updated issue ${identifier} with content from ${filePath}`);
    } else if (contentType === "document") {
      const document = await this.linearClient.document(identifier);
      if (!document) {
        throw new Error(`Document ${identifier} not found`);
      }
      await this.linearClient.updateDocument(document.id, {
        title: fileName,
        content: localContent,
      });
      console.log(
        `Updated document ${identifier} with content from ${filePath}`
      );
    } else {
      throw new Error("Invalid content type");
    }
  }
}
