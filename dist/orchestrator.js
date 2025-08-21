"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Orchestrator = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const hook_collector_1 = require("./collectors/hook-collector");
const markdown_generator_1 = require("./generators/markdown-generator");
const site_generator_1 = require("./docusaurus/site-generator");
class Orchestrator {
    constructor(config) {
        this.config = config;
        this.workingDir = process.cwd();
    }
    /**
     * Run the complete documentation workflow
     */
    async run() {
        try {
            console.log('🚀 Starting documentation generation...');
            // Clean output if requested
            if (this.config.clean) {
                await this.cleanOutput();
            }
            // Collect hooks
            console.log('📦 Collecting hooks...');
            const collector = new hook_collector_1.HookCollector({
                input: this.config.input || '.',
                ignoreFiles: this.config.ignoreFiles || [],
                ignoreHooks: this.config.ignoreHooks || [],
                outputDir: this.config.outputDir || './wp-hooks-docs',
            });
            const hookData = await collector.collect();
            console.log(`✅ Found ${Object.keys(hookData.actions).length + Object.keys(hookData.filters).length} hooks`);
            // Generate markdown
            if (hookData) {
                console.log('📝 Generating markdown documentation...');
                const generator = new markdown_generator_1.MarkdownGenerator({
                    outputDir: this.config.outputDir || './wp-hooks-docs',
                    title: this.config.title || 'Plugin Hooks Documentation',
                    tagline: this.config.tagline || 'Hooks Documentation for Plugin',
                    githubSourceCodeUrl: this.config.githubSourceCodeUrl || '',
                });
                await generator.generate(hookData);
                console.log('✅ Markdown documentation generated');
            }
            // Build Docusaurus site
            console.log('🏗️  Building documentation site...');
            const siteGenerator = new site_generator_1.DocusaurusSiteGenerator({
                title: this.config.title || 'Plugin Hooks Documentation',
                tagline: this.config.tagline || 'Hooks Documentation for Plugin',
                url: this.config.url || 'https://example.com',
                baseUrl: this.config.baseUrl || '/',
                repoUrl: this.config.repoUrl || 'https://github.com/10up/wp-hooks-documentor',
                organizationName: this.config.organizationName,
                projectName: this.config.projectName,
                templatesDir: this.config.templatesDir,
                footerStyle: this.config.footerStyle || 'dark',
                footerCopyright: this.config.footerCopyright ||
                    `Copyright © ${new Date().getFullYear().toString()} ${this.config.title || ''}. Built with WP Hooks Documentor.`,
            }, path_1.default.join(this.workingDir, this.config.outputDir));
            await siteGenerator.initializeSite();
            siteGenerator.buildSite();
            console.log('✅ Documentation site built');
            console.log('🎉 Documentation generation complete!');
        }
        catch (error) {
            console.error('❌ Error generating documentation:', error);
            throw error;
        }
    }
    /**
     * Clean output directories
     */
    async cleanOutput() {
        console.log('🧹 Cleaning output directories...');
        // Clean markdown output
        await fs_extra_1.default.remove(this.config.outputDir);
        // Clean Docusaurus site
        await fs_extra_1.default.remove(path_1.default.join(this.workingDir, 'docs-site'));
        console.log('✅ Output directories cleaned');
    }
}
exports.Orchestrator = Orchestrator;
