"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HookCollector = void 0;
const php_runner_1 = require("./php-runner");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const messages_1 = require("../utils/messages");
const { readJSON, ensureDir } = fs_extra_1.default;
class HookCollector {
    constructor(config) {
        this.config = config;
        this.phpRunner = new php_runner_1.PHPRunner();
    }
    async collect() {
        try {
            console.log(messages_1.MESSAGES.COLLECTING_HOOKS);
            // Ensure output directory exists
            await ensureDir(this.config.outputDir);
            // Generate hooks using wp-hooks/generator
            await this.phpRunner.generateHooks({
                input: this.config.input,
                output: path_1.default.join(this.config.outputDir, '.hooks-temp'),
                ignoreFiles: this.config.ignoreFiles,
                ignoreHooks: this.config.ignoreHooks,
            });
            console.log(messages_1.MESSAGES.PROCESSING_HOOKS);
            // Read and parse the generated files
            const actionsFile = path_1.default.join(this.config.outputDir, '.hooks-temp/actions.json');
            const filtersFile = path_1.default.join(this.config.outputDir, '.hooks-temp/filters.json');
            const [actions, filters] = await Promise.all([readJSON(actionsFile), readJSON(filtersFile)]);
            // Transform and deduplicate hooks
            const collection = this.transformHooks({ actions, filters });
            // Clean JSON files
            await fs_extra_1.default.remove(path_1.default.join(this.config.outputDir, '.hooks-temp'));
            console.log(messages_1.MESSAGES.HOOKS_GENERATED);
            return collection;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`${messages_1.MESSAGES.ERROR_PROCESS_HOOKS}: ${error.message}`);
            }
            throw new Error(messages_1.MESSAGES.ERROR_PROCESS_HOOKS);
        }
    }
    transformHooks(rawData) {
        // Helper function to merge hooks with the same name and transform them.
        const prepareHooks = (hooks) => {
            const hookMap = new Map();
            // Group hooks by name
            hooks.forEach((hook) => {
                const hookId = this.getHookId(this.escapeHookName(hook.name));
                if (!hookMap.has(hookId)) {
                    hookMap.set(hookId, []);
                }
                hookMap.get(hookId)?.push(hook);
            });
            // Merge and transform hooks
            return Array.from(hookMap.entries()).map(([_, hooks]) => {
                if (hooks.length === 1) {
                    return this.transformHook(hooks[0]);
                }
                // Merge multiple hooks with the same name
                const mergedHook = { ...hooks[0] };
                // Collect sources of all hooks.
                mergedHook.files = [];
                hooks.forEach((h) => {
                    const file = {
                        file: h.file || '',
                        line: h.line || 0,
                    };
                    mergedHook.files?.push(file);
                });
                return this.transformHook(mergedHook);
            });
        };
        return {
            actions: prepareHooks(rawData.actions.hooks),
            filters: prepareHooks(rawData.filters.hooks),
        };
    }
    escapeHookName(hookName) {
        let escapedHookName = hookName;
        /**
         * Replace PHP-style interpolations with {$var}_suffix
         * Example:
         * 'woocommerce_analytics_' . $field . '_' . $context
         * becomes
         * 'woocommerce_analytics_{$field}_$context'
         */
        escapedHookName = hookName.replace(/['"]\s*\.\s*(\$(?:[a-zA-Z_]\w*)(?:->\w+|\[[^\]]+\]|\(\))*((?:->\w+|\[[^\]]+\]|\(\)))*)\s*\.\s*['"]?_?([a-zA-Z0-9_]*)/g, (_, variable, rest, suffix) => `{${variable}${rest || ''}}${suffix ? `_${suffix}` : ''}`);
        /**
         * Handle trailing .$var without suffix
         * Example:
         * 'woocommerce_analytics_' . $field
         * becomes
         * 'woocommerce_analytics_{$field}'
         */
        escapedHookName = hookName.replace(/['"]\s*\.\s*(\$(?:[a-zA-Z_]\w*)(?:->\w+|\[[^\]]+\]|\(\))*((?:->\w+|\[[^\]]+\]|\(\)))*)/g, (_, variable, rest) => `{${variable}${rest || ''}}`);
        /**
         * Remove quotes from hook name
         */
        escapedHookName = hookName.replace(/['"]/g, '');
        return escapedHookName;
    }
    getHookId(hookName) {
        return hookName
            .replace(/[^a-zA-Z0-9\-_.~]/g, '')
            .replace(/^__/, '')
            .replace(/^_/, '');
    }
    transformHook(hook) {
        const hookName = this.escapeHookName(hook.name);
        const hookId = this.getHookId(hookName);
        return {
            id: hookId,
            name: hookName,
            type: hook.type,
            file: hook.file,
            files: hook.files || [],
            line: hook.line || 0,
            doc: {
                description: hook.doc?.description || '',
                long_description: hook.doc?.long_description || '',
                long_description_html: hook.doc?.long_description_html || '',
                since: hook.doc?.tags?.filter((tag) => tag.name === 'since') || [],
                params: hook.doc?.tags
                    ?.filter((tag) => tag.name === 'param')
                    ?.map((p) => ({
                    name: p.variable || '',
                    type: p.types?.join('|') || '',
                    description: p.content || '',
                })) || [],
                tags: hook.doc?.tags?.filter((tag) => tag.name !== 'param' && tag.name !== 'return' && tag.name !== 'since') || [],
                return: (hook.doc?.tags
                    ?.filter((tag) => tag.name === 'return')
                    ?.map((tag) => ({
                    type: tag.types?.join('|') || '',
                    description: tag.content || '',
                })) || [])[0] || null,
            },
            source: hook.source,
        };
    }
}
exports.HookCollector = HookCollector;
