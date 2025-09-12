#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { Orchestrator } from './orchestrator';
import { WPHooksDocConfig } from './utils/types';

const program = new Command();

const defaultConfig: WPHooksDocConfig = {
  input: '.',
  outputDir: './wp-hooks-docs',
  ignoreFiles: ['/tests/', '/vendor/', '/node_modules/'],
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
  .version('1.0.1');

program
  .command('generate')
  .description('Generate complete hook documentation')
  .option('-c, --config <path>', 'Path to configuration file', 'wp-hooks-doc.json')
  .action(async (options) => {
    try {
      const configPath = path.resolve(process.cwd(), options.config);

      if (!fs.existsSync(configPath)) {
        console.error(`❌ Configuration file not found: ${configPath}`);
        process.exit(1);
      }

      const givenConfig: WPHooksDocConfig = await fs.readJSON(configPath);
      const config = { ...defaultConfig, ...givenConfig }; // Override default config with given config
      const orchestrator = new Orchestrator(config);

      await orchestrator.run();
    } catch (error) {
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
      const configPath = path.resolve(process.cwd(), options.path);

      if (fs.existsSync(configPath)) {
        console.error(`❌ Configuration file already exists: ${configPath}`);
        process.exit(1);
      }

      await fs.writeJSON(configPath, defaultConfig, { spaces: 2 });
      console.log(`✅ Created configuration file: ${configPath}`);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

program.parse();
