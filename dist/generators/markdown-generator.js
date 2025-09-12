"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownGenerator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const sanitize_html_1 = __importDefault(require("sanitize-html"));
class MarkdownGenerator {
    constructor(config) {
        this.config = config;
    }
    /**
     * Generates markdown documentation from the hook collection
     */
    async generate(hookCollection) {
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
    async generateHookFile(hook, type) {
        const content = [];
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
                content.push(`| ${this.sanitizeContent(param.name)} | \`${this.sanitizeContent(param.type)}\` | ${this.sanitizeContent(param.description, true)} |`);
            });
            content.push('');
        }
        // Add since and source info
        if (hook.doc.since && hook.doc.since.length > 0) {
            content.push('### Since\n');
            hook.doc.since.forEach((tag) => {
                if (tag?.description) {
                    content.push(`- ${tag.content}: ${this.sanitizeContent(tag.description, true)}`);
                }
                else {
                    content.push(`- ${tag.content}`);
                }
            });
        }
        if (hook.files && hook.files.length > 0) {
            content.push('### Source\n');
            hook.files.forEach((file) => {
                if (file.line && file.line > 0 && this.config.githubSourceCodeUrl) {
                    content.push(`- Defined in [\`${file.file}\` at line ${file.line}](${this.config.githubSourceCodeUrl}/${file.file}#L${file.line})`);
                }
                else if (file.line && file.line > 0) {
                    content.push(`- Defined in \`${file.file}\` at line ${file.line}`);
                }
                else {
                    content.push(`- Defined in \`${file.file}\``);
                }
            });
        }
        else if (hook.file) {
            content.push('### Source\n');
            if (hook.line && hook.line > 0 && this.config.githubSourceCodeUrl) {
                content.push(`Defined in [\`${hook.file}\` at line ${hook.line}](${this.config.githubSourceCodeUrl}/${hook.file}#L${hook.line})`);
            }
            else if (hook.line && hook.line > 0) {
                content.push(`Defined in \`${hook.file}\` at line ${hook.line}`);
            }
            else {
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
        await fs.promises.writeFile(path.join(this.config.outputDir, 'hooks', type === 'Action' ? 'Actions' : 'Filters', fileName), content.join('\n'));
    }
    /**
     * Generates the main index file
     */
    async generateMainIndex(hookCollection) {
        const content = [];
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
                content.push(`- [${this.sanitizeHookName(hook.name)}](./Actions/${hook.id}.md) - ${hook.doc.description || ''}`);
            });
            content.push('');
        }
        // Add filters section
        if (hookCollection.filters.length > 0) {
            content.push('### Filters\n');
            hookCollection.filters.forEach((hook) => {
                content.push(`- [${this.sanitizeHookName(hook.name)}](./Filters/${hook.id}.md) - ${hook.doc.description || ''}`);
            });
            content.push('');
        }
        // Write to file
        await fs.promises.writeFile(path.join(this.config.outputDir, 'hooks', 'index.md'), content.join('\n'));
    }
    sanitizeContent(content, removeNewLines = false) {
        let sanitized = (0, sanitize_html_1.default)(content, {
            disallowedTagsMode: 'recursiveEscape',
        });
        if (removeNewLines) {
            sanitized = sanitized.replace(/\n/g, '');
        }
        return sanitized.replace(/[{}|]/g, (match) => `\\${match}`);
    }
    sanitizeHookName(hookName) {
        return hookName.replace(/[{}]/g, (match) => `\\${match}`);
    }
}
exports.MarkdownGenerator = MarkdownGenerator;
