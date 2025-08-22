import { PHPRunner } from './php-runner';
import {
  HookCollection,
  Hook,
  RawHookCollection,
  RawHookData,
  HookCollectorConfig,
} from '../utils/types';
import fsExtra from 'fs-extra';
import path from 'path';
import { MESSAGES } from '../utils/messages';

const { readJSON, ensureDir } = fsExtra;

export class HookCollector {
  private phpRunner: PHPRunner;

  constructor(private config: HookCollectorConfig) {
    this.phpRunner = new PHPRunner();
  }

  async collect(): Promise<HookCollection> {
    try {
      console.log(MESSAGES.COLLECTING_HOOKS);

      // Ensure output directory exists
      await ensureDir(this.config.outputDir);

      // Generate hooks using wp-hooks/generator
      await this.phpRunner.generateHooks({
        input: this.config.input,
        output: path.join(this.config.outputDir, '.hooks-temp'),
        ignoreFiles: this.config.ignoreFiles,
        ignoreHooks: this.config.ignoreHooks,
      });

      console.log(MESSAGES.PROCESSING_HOOKS);

      // Read and parse the generated files
      const actionsFile = path.join(this.config.outputDir, '.hooks-temp/actions.json');
      const filtersFile = path.join(this.config.outputDir, '.hooks-temp/filters.json');

      const [actions, filters] = await Promise.all([readJSON(actionsFile), readJSON(filtersFile)]);

      // Transform and deduplicate hooks
      const collection = this.transformHooks({ actions, filters });

      // Clean JSON files
      await fsExtra.remove(path.join(this.config.outputDir, '.hooks-temp'));

      console.log(MESSAGES.HOOKS_GENERATED);

      return collection;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`${MESSAGES.ERROR_PROCESS_HOOKS}: ${error.message}`);
      }
      throw new Error(MESSAGES.ERROR_PROCESS_HOOKS);
    }
  }

  private transformHooks(rawData: RawHookCollection): HookCollection {
    // Helper function to merge hooks with the same name and transform them.
    const prepareHooks = (hooks: RawHookData['hooks']): Hook[] => {
      const hookMap = new Map<string, RawHookData['hooks'][0][]>();

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

  private escapeHookName(hookName: string): string {
    let escapedHookName = hookName;
    /**
     * Replace PHP-style interpolations with {$var}_suffix
     * Example:
     * 'woocommerce_analytics_' . $field . '_' . $context
     * becomes
     * 'woocommerce_analytics_{$field}_$context'
     */
    escapedHookName = hookName.replace(
      /['"]\s*\.\s*(\$(?:[a-zA-Z_]\w*)(?:->\w+|\[[^\]]+\]|\(\))*((?:->\w+|\[[^\]]+\]|\(\)))*)\s*\.\s*['"]?_?([a-zA-Z0-9_]*)/g,
      (_, variable, rest, suffix) => `{${variable}${rest || ''}}${suffix ? `_${suffix}` : ''}`
    );

    /**
     * Handle trailing .$var without suffix
     * Example:
     * 'woocommerce_analytics_' . $field
     * becomes
     * 'woocommerce_analytics_{$field}'
     */
    escapedHookName = hookName.replace(
      /['"]\s*\.\s*(\$(?:[a-zA-Z_]\w*)(?:->\w+|\[[^\]]+\]|\(\))*((?:->\w+|\[[^\]]+\]|\(\)))*)/g,
      (_, variable, rest) => `{${variable}${rest || ''}}`
    );

    /**
     * Remove quotes from hook name
     */
    escapedHookName = hookName.replace(/['"]/g, '');

    return escapedHookName;
  }

  private getHookId(hookName: string): string {
    return hookName
      .replace(/[^a-zA-Z0-9\-_.~]/g, '')
      .replace(/^__/, '')
      .replace(/^_/, '');
  }

  private transformHook(hook: RawHookData['hooks'][0]): Hook {
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
        params:
          hook.doc?.tags
            ?.filter((tag) => tag.name === 'param')
            ?.map((p) => ({
              name: p.variable || '',
              type: p.types?.join('|') || '',
              description: p.content || '',
            })) || [],
        tags:
          hook.doc?.tags?.filter(
            (tag) => tag.name !== 'param' && tag.name !== 'return' && tag.name !== 'since'
          ) || [],
        return:
          (hook.doc?.tags
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
