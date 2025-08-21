# WP Hooks Documentor

> A powerful tool to generate beautiful documentation for WordPress plugin hooks.

[![Support Level](https://img.shields.io/badge/support-beta-blueviolet.svg)](#support-level) [![Release Version](https://img.shields.io/github/release/10up/wp-hooks-documentor.svg)](https://github.com/10up/wp-hooks-documentor/releases/latest) [![MIT License](https://img.shields.io/github/license/10up/wp-hooks-documentor.svg)](https://github.com/10up/wp-hooks-documentor/blob/develop/LICENSE.md) [![CodeQL](https://github.com/10up/wp-hooks-documentor/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/10up/wp-hooks-documentor/actions/workflows/codeql-analysis.yml)

## Features

- 📦 Automatically collects action and filter hooks from your WordPress plugin
- 📝 Generates well-structured markdown documentation
- 🌐 Creates a beautiful documentation site using Docusaurus
- 🎨 Fully customizable theme
- 🔍 Built-in search functionality

## Requirements

- Node.js >= 20.0
- PHP >= 8.3

## Installation

```bash
npm install -g wp-hooks-documentor
```

## Quick Start

1. Initialize a new configuration file:

```bash
wp-hooks-documentor init
```

2. Edit the generated `wp-hooks-doc.json` file to match your project settings.

3. Generate documentation:

```bash
wp-hooks-documentor generate
```

## Configuration

The tool uses a single configuration file (`wp-hooks-doc.json`) to control all aspects of the documentation generation process. Here's a complete example with all available options:

```json
{
  "title": "Plugin Hooks Documentation",
  "tagline": "Hooks Documentation for the plugin",
  "url": "https://example.com",
  "baseUrl": "/",
  "repoUrl": "https://github.com/username/repo",
  "organizationName": "username",
  "projectName": "repo",
  "input": ".",
  "ignoreFiles": [],
  "ignoreHooks": [],
  "outputDir": "./wp-hooks-docs",
  "templatesDir": "./.wp-hooks-docs/template",
  "footerStyle": "dark",
  "footerCopyright": "Copyright © 2025. Built with WP Hooks Documentor."
}
```

### Configuration Options

- `title`: Site title
- `tagline`: Site tagline
- `url`: Production URL
- `baseUrl`: Base URL path
- `repoUrl`: GitHub repository URL
- `organizationName`: GitHub organization/username
- `projectName`: GitHub repository name
- `input`: Path to your WordPress plugin
- `ignoreFiles`: Files to ignore
- `ignoreHooks`: Hooks to ignore
- `outputDir`: Where to export documentation site
- `templatesDir`: Custom templates directory to customize overall documentation site.
- `footerStyle`: Footer style, eg: dark or light
- `footerCopyright`: Footer copyright text

## Commands

- `wp-hooks-documentor init`: Create a new configuration file
- `wp-hooks-documentor generate`: Generate complete documentation

## Customization

### Theme

The documentation site uses Docusaurus, which means you can fully customize the theme. See the [Docusaurus documentation](https://docusaurus.io/docs/styling-layout) for more details.


## Support Level

**Beta:** This project is quite new and we're not sure what our ongoing support level for this will be. Bug reports, feature requests, questions, and pull requests are welcome. If you like this project please let us know, but be cautious using this in a Production environment!

## Changelog

A complete listing of all notable changes to Repo Automator - GitHub Action are documented in [CHANGELOG.md](https://github.com/10up/wp-hooks-documentor/blob/develop/CHANGELOG.md).

## Contributing

Please read [CODE_OF_CONDUCT.md](https://github.com/10up/wp-hooks-documentor/blob/develop/CODE_OF_CONDUCT.md) for details on our code of conduct, [CONTRIBUTING.md](https://github.com/10up/wp-hooks-documentor/blob/develop/CONTRIBUTING.md) for details on the process for submitting pull requests to us, and [CREDITS.md](https://github.com/10up/wp-hooks-documentor/blob/develop/CREDITS.md) for a list of maintainers, contributors, and libraries used in this repository.

## Like what you see?

<a href="http://10up.com/contact/"><img src="https://github.com/10up/.github/blob/trunk/profile/10up-github-banner.jpg" width="850" alt="Work with the 10up WordPress Practice at Fueled"></a>
