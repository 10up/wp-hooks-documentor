import { Hook, HookCollection } from '../utils/types';
import * as fs from 'fs';
import * as path from 'path';
import sanitizeHtml from 'sanitize-html';

export interface MarkdownGeneratorConfig {
  /**
   * The output directory for the markdown files
   */
  outputDir: string;

  /**
   * Plugin name for documentation
   * @default 'Plugin Hooks Documentation'
   */
  title?: string;

  /**
   * Plugin description for documentation
   * @default ''
   */
  tagline?: string;

  /**
   * Github source code url for the plugin
   * @default ''
   */
  githubSourceCodeUrl?: string;
}

export class MarkdownGenerator {
  private config: MarkdownGeneratorConfig;

  constructor(config: MarkdownGeneratorConfig) {
    this.config = config;
  }

  /**
   * Generates markdown documentation from the hook collection
   */
  public async generate(hookCollection: HookCollection): Promise<void> {
    // Ensure output directory exists
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }

    // Ensure output directories exist
    if (!fs.existsSync(path.join(this.config.outputDir, 'hooks'))) {
      fs.mkdirSync(path.join(this.config.outputDir, 'hooks'), { recursive: true });
    }
    if (!fs.existsSync(path.join(this.config.outputDir, 'hooks/Actions'))) {
      fs.mkdirSync(path.join(this.config.outputDir, 'hooks/Actions'), { recursive: true });
    }
    if (!fs.existsSync(path.join(this.config.outputDir, 'hooks/Filters'))) {
      fs.mkdirSync(path.join(this.config.outputDir, 'hooks/Filters'), { recursive: true });
    }

    // Generate individual hook files
    for (const hook of hookCollection.actions) {
      await this.generateHookFile(hook, 'Action');
    }
    for (const hook of hookCollection.filters) {
      await this.generateHookFile(hook, 'Filter');
    }

    // Generate index file
    await this.generateMainIndex(hookCollection);
  }

  /**
   * Generates documentation for a single hook
   */
  private async generateHookFile(hook: Hook, type: 'Action' | 'Filter'): Promise<void> {
    const content: string[] = [];

    // Add frontmatter
    content.push('---');
    content.push(`id: ${hook.id}`);
    content.push(`title: "${type} - ${hook.name}"`);
    content.push(`sidebar_label: "${hook.name}"`);
    content.push('---\n');

    // Add hook name and description
    content.push(`# ${type}: ${this.sanitizeHookName(hook.name)}\n`);
    if (hook.doc.description) {
      content.push(`${this.sanitizeContent(hook.doc.description, true)}\n`);
    }
    if (hook.doc.long_description) {
      content.push(`${this.sanitizeContent(hook.doc.long_description, true)}\n`);
    }

    // Add parameters section if there are parameters
    if (hook.doc.params && hook.doc.params.length > 0) {
      content.push('## Parameters\n');
      content.push('| Name | Type | Description |');
      content.push('|------|------|-------------|');
      hook.doc.params.forEach((param) => {
        content.push(
          `| ${this.sanitizeContent(param.name)} | \`${this.sanitizeContent(param.type)}\` | ${this.sanitizeContent(param.description, true)} |`
        );
      });
      content.push('');
    }

    // Add since and source info
    if (hook.doc.since && hook.doc.since.length > 0) {
      content.push('### Since\n');
      hook.doc.since.forEach((tag) => {
        if (tag?.description) {
          content.push(`- ${tag.content}: ${this.sanitizeContent(tag.description, true)}`);
        } else {
          content.push(`- ${tag.content}`);
        }
      });
    }

    if (hook.file) {
      content.push('### Source\n');
      if (hook.line && hook.line > 0 && this.config.githubSourceCodeUrl) {
        content.push(
          `Defined in [\`${hook.file}\` at line ${hook.line}](${this.config.githubSourceCodeUrl}/${hook.file}#L${hook.line})`
        );
      } else if (hook.line && hook.line > 0) {
        content.push(`Defined in \`${hook.file}\` at line ${hook.line}`);
      } else {
        content.push(`Defined in \`${hook.file}\``);
      }
      content.push('\n');
    }

    // Add returns section for filters only
    if (type === 'Filter' && hook.doc.return) {
      content.push('## Returns');
      content.push(this.sanitizeContent(hook.doc.return.description, true));
      content.push('');
      if (hook.doc.return.type) {
        content.push(`Type: ${hook.doc.return.type}`);
        content.push('');
      }
    }

    // Write to file
    const fileName = `${hook.id}.md`;
    await fs.promises.writeFile(
      path.join(
        this.config.outputDir,
        'hooks',
        type === 'Action' ? 'Actions' : 'Filters',
        fileName
      ),
      content.join('\n')
    );
  }

  /**
   * Generates the main index file
   */
  private async generateMainIndex(hookCollection: HookCollection): Promise<void> {
    const content: string[] = [];

    // Add frontmatter
    content.push('---');
    content.push('id: index');
    content.push(`title: ${this.config.title}`);
    content.push('sidebar_label: Hooks');
    content.push('---\n');

    // Add title and description
    content.push(`# ${this.config.title}\n`);
    if (this.config.tagline) {
      content.push(`${this.config.tagline}\n`);
    }

    // Add available hooks section
    content.push('## Available Hooks\n');
    content.push(`This plugin provides the following hooks:\n`);

    // Add actions section
    if (hookCollection.actions.length > 0) {
      content.push('### Actions\n');
      hookCollection.actions.forEach((hook) => {
        content.push(
          `- [${this.sanitizeHookName(hook.name)}](./Actions/${hook.id}.md) - ${
            hook.doc.description || ''
          }`
        );
      });
      content.push('');
    }

    // Add filters section
    if (hookCollection.filters.length > 0) {
      content.push('### Filters\n');
      hookCollection.filters.forEach((hook) => {
        content.push(
          `- [${this.sanitizeHookName(hook.name)}](./Filters/${hook.id}.md) - ${
            hook.doc.description || ''
          }`
        );
      });
      content.push('');
    }

    // Write to file
    await fs.promises.writeFile(
      path.join(this.config.outputDir, 'hooks', 'index.md'),
      content.join('\n')
    );
  }

  private sanitizeContent(content: string, removeNewLines: boolean = false): string {
    let sanitized = sanitizeHtml(content, {
      disallowedTagsMode: 'recursiveEscape',
    });
    if (removeNewLines) {
      sanitized = sanitized.replace(/\n/g, '');
    }

    return sanitized.replace(/[{}|]/g, (match) => `\\${match}`);
  }

  private sanitizeHookName(hookName: string): string {
    return hookName.replace(/[{}]/g, (match) => `\\${match}`);
  }
}
