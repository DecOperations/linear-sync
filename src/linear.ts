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
    const config = vscode.workspace.getConfiguration("linear-md");
    const filenameFormat = config.get<string>("filenameFormat", "${title}");

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
      .replace(/\${ticket}/g, ticketId);

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

    // Start with the existing YAML content
    let frontmatter = existingYaml;

    // Make sure the essential Linear ID is present
    if (!frontmatter.includes(`linear-${contentType}-id:`)) {
      frontmatter += `\nlinear-${contentType}-id: ${identifier}`;
    }

    // Add custom fields if they exist on the item
    for (const field of customFields) {
      if (field in item && !frontmatter.includes(`${field}:`)) {
        // @ts-ignore - we're checking dynamically if the field exists
        const value = item[field];
        if (value !== undefined && value !== null) {
          frontmatter += `\n${field}: ${value}`;
        }
      }
    }

    return frontmatter.trim();
  }

  async syncDown(filePath: string) {
    const fileContent = fs.readFileSync(filePath, "utf8");

    const match = fileContent.match(/linear-(issue|document)-id:\s*([\w-]+)/);
    if (!match) {
      throw new Error("Linear ID not found in the file");
    }
    const contentType = match[1] as "issue" | "document";
    const identifier = match[2];

    const yamlMatch = fileContent.match(/---([\s\S]*?)---/);
    if (!yamlMatch) {
      throw new Error("YAML Frontmatter not found in the file");
    }
    const yamlContent = yamlMatch[1].trim();

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

    // Generate new filename and directory path
    const baseDir = path.dirname(filePath);
    const dirPath = this.getDirectoryPath(item, baseDir);
    const filename = this.generateFilename(item, identifier, contentType);
    const newFilePath = path.join(dirPath, filename);

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

    const match = fileContent.match(/linear-(issue|document)-id:\s*([\w-]+)/);
    if (!match) {
      throw new Error("Linear ID not found in the file");
    }
    const contentType = match[1] as "issue" | "document";
    const identifier = match[2];

    const yamlMatch = fileContent.match(/---([\s\S]*?)---/);
    if (!yamlMatch) {
      throw new Error("YAML Frontmatter not found in the file");
    }

    const contentMatch = fileContent.match(/---\n([\s\S]*?)\n---\n([\s\S]*)/);
    if (!contentMatch) {
      throw new Error("Content after YAML frontmatter not found in the file");
    }
    const localContent = contentMatch[2].trim();

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
