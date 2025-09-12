import { HookCollection, HookCollectorConfig } from '../utils/types';
export declare class HookCollector {
    private config;
    private phpRunner;
    constructor(config: HookCollectorConfig);
    collect(): Promise<HookCollection>;
    private transformHooks;
    private escapeHookName;
    private getHookId;
    private transformHook;
}
