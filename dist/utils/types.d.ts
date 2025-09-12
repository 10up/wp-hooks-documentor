export interface HookFile {
    file: string;
    line: number;
}
export interface Hook {
    id: string;
    name: string;
    type: string;
    file: string;
    files?: HookFile[];
    line?: number;
    doc: {
        description?: string;
        long_description?: string;
        long_description_html?: string;
        since?: Array<{
            name: string;
            content: string;
            description?: string;
        }>;
        tags?: Array<{
            name: string;
            content: string;
            types?: string[];
            variable?: string;
        }>;
        params?: {
            name: string;
            type: string;
            description: string;
        }[];
        return?: {
            type: string;
            description: string;
        };
    };
    source: string;
}
export interface HookCollection {
    actions: Hook[];
    filters: Hook[];
}
export interface PHPRunnerOptions {
    input: string;
    output: string;
    ignoreFiles?: string[];
    ignoreHooks?: string[];
}
export interface PHPResponse {
    success: boolean;
    message?: string;
    error?: string;
}
export interface RawHookData {
    hooks: Array<{
        name: string;
        type: string;
        file: string;
        files?: HookFile[];
        line?: number;
        doc?: {
            description?: string;
            long_description?: string;
            long_description_html?: string;
            tags?: Array<{
                name: string;
                content: string;
                types?: string[];
                variable?: string;
            }>;
        };
        source: string;
    }>;
}
export interface RawHookCollection {
    actions: RawHookData;
    filters: RawHookData;
}
export interface MarkdownGeneratorConfig {
    outputDir: string;
}
export interface DocusaurusConfig {
    title: string;
    tagline?: string;
    url: string;
    baseUrl: string;
    repoUrl: string;
    githubSourceCodeUrl?: string;
    organizationName?: string;
    projectName?: string;
    templatesDir?: string;
    staticAssetsDir?: string;
    customCss?: string;
    themeConfig?: {
        navbar?: {
            title?: string;
            logo?: {
                alt?: string;
                src?: string;
            };
            items?: Array<{
                to: string;
                label: string;
                position?: 'left' | 'right';
            }>;
        };
        footer?: {
            style?: 'dark' | 'light';
            links?: Array<{
                title: string;
                items: Array<{
                    label: string;
                    to: string;
                }>;
            }>;
            copyright?: string;
        };
    };
}
export interface WPHooksDocConfig {
    input: string;
    ignoreFiles: string[];
    ignoreHooks: string[];
    outputDir: string;
    title: string;
    tagline?: string;
    url: string;
    baseUrl: string;
    repoUrl: string;
    githubSourceCodeUrl?: string;
    organizationName?: string;
    projectName?: string;
    templatesDir?: string;
    footerStyle?: 'dark' | 'light';
    footerCopyright?: string;
    clean?: boolean;
}
export interface HookCollectorConfig {
    input: string;
    outputDir: string;
    ignoreFiles: string[];
    ignoreHooks: string[];
}
export interface CommandOptions {
    config?: string;
    verbose?: boolean;
}
