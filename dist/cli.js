#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const orchestrator_1 = require("./orchestrator");
const program = new commander_1.Command();
const defaultConfig = {
    input: '.',
    outputDir: './wp-hooks-docs',
    ignoreFiles: [],
    ignoreHooks: [],
    title: 'Plugin Hooks Documentation',
    tagline: 'Documentation for the plugin hooks',
    url: 'https://example.com',
    baseUrl: '/',
    repoUrl: 'https://github.com/username/repo',
    organizationName: 'username',
    projectName: 'repo',
    footerStyle: 'dark',
    clean: true,
};
program
    .name('wp-hooks-documentor')
    .description('Generate documentation for Plugin hooks')
    .version('1.0.0');
program
    .command('generate')
    .description('Generate complete hook documentation')
    .option('-c, --config <path>', 'Path to configuration file', 'wp-hooks-doc.json')
    .action(async (options) => {
    try {
        const configPath = path_1.default.resolve(process.cwd(), options.config);
        if (!fs_extra_1.default.existsSync(configPath)) {
            console.error(`❌ Configuration file not found: ${configPath}`);
            process.exit(1);
        }
        const givenConfig = await fs_extra_1.default.readJSON(configPath);
        const config = { ...defaultConfig, ...givenConfig }; // Override default config with given config
        const orchestrator = new orchestrator_1.Orchestrator(config);
        await orchestrator.run();
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
});
program
    .command('init')
    .description('Create a new configuration file')
    .option('-p, --path <path>', 'Path to create configuration file', 'wp-hooks-doc.json')
    .action(async (options) => {
    try {
        const configPath = path_1.default.resolve(process.cwd(), options.path);
        if (fs_extra_1.default.existsSync(configPath)) {
            console.error(`❌ Configuration file already exists: ${configPath}`);
            process.exit(1);
        }
        await fs_extra_1.default.writeJSON(configPath, defaultConfig, { spaces: 2 });
        console.log(`✅ Created configuration file: ${configPath}`);
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
});
program.parse();
