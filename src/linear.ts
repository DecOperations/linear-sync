import {
  LinearClient,
  User
} from "@linear/sdk";

const fs = require('fs');
const path = require('path');


export default class Linear {
  linearClient: LinearClient;
  me: User = {} as User;

  constructor(apiKey: string) {
    this.linearClient = new LinearClient({ apiKey });
  }

  async init() {
    this.me = await this.linearClient.viewer;
  }

  async syncDown(filePath: string) {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const match = fileContent.match(/linear-(issue|document)-id:\s*([\w-]+)/);
    if (!match) {
      throw new Error('Linear ID not found in the file');
    }
    const contentType = match[1];
    const identifier = match[2];

    const yamlMatch = fileContent.match(/---([\s\S]*?)---/);
    if (!yamlMatch) {
      throw new Error('YAML Frontmatter not found in the file');
    }
    const yamlContent = yamlMatch[1].trim();

    let newContent = '';
    let newTitle = '';

    if (contentType === 'issue') {
      const issue = await this.linearClient.issue(identifier);
      if (!issue) {
        throw new Error(`Issue ${identifier} not found`);
      }
      newContent = `---\n${yamlContent}\n---\n\n${issue.description || ''}`;
      newTitle = issue.title;
    } else if (contentType === 'document') {
      const document = await this.linearClient.document(identifier);
      if (!document) {
        throw new Error(`Document ${identifier} not found`);
      }
      newContent = `---\n${yamlContent}\n---\n\n${document.content || ''}`;
      newTitle = document.title;
    } else {
      throw new Error('Invalid content type');
    }

    const newFilePath = path.join(path.dirname(filePath), `${newTitle}.md`);
    fs.writeFileSync(newFilePath, newContent, 'utf8');
    console.log(`Updated ${newFilePath} with content from Linear ${contentType} ${identifier}`);

    if (newFilePath !== filePath) {
      fs.unlinkSync(filePath);
      console.log(`Deleted old file ${filePath}`);
    }
  }

  async syncUp(filePath: string) {
    let fileContent = fs.readFileSync(filePath, 'utf8');
  
    const match = fileContent.match(/linear-(issue|document)-id:\s*([\w-]+)/);
    if (!match) {
      throw new Error('Linear ID not found in the file');
    }
    const contentType = match[1];
    const identifier = match[2];
  
    const yamlMatch = fileContent.match(/---([\s\S]*?)---/);
    if (!yamlMatch) {
      throw new Error('YAML Frontmatter not found in the file');
    }
  
    const contentMatch = fileContent.match(/---\n([\s\S]*?)\n---\n([\s\S]*)/);
    if (!contentMatch) {
      throw new Error('Content after YAML frontmatter not found in the file');
    }
    const localContent = contentMatch[2].trim();
  
    const fileName = path.basename(filePath, path.extname(filePath));

    if (contentType === 'issue') {
      const issue = await this.linearClient.issue(identifier);
      if (!issue) {
        throw new Error(`Issue ${identifier} not found`);
      }
      await this.linearClient.updateIssue(issue.id, {
        title: fileName,
        description: localContent
      });
      console.log(`Updated issue ${identifier} with content from ${filePath}`);
    } else if (contentType === 'document') {
      const document = await this.linearClient.document(identifier);
      if (!document) {
        throw new Error(`Document ${identifier} not found`);
      }
      await this.linearClient.updateDocument(document.id, {
        title: fileName,
        content: localContent
      });
      console.log(`Updated document ${identifier} with content from ${filePath}`);
    } else {
      throw new Error('Invalid content type');
    }
  }
}

