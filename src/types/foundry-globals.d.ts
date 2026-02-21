// Minimal type stubs for Foundry VTT globals used in the enrichers codebase.
// These are intentionally loose (`any`-heavy) to unblock the TypeScript migration
// without requiring full Foundry VTT type definitions.

declare const CONFIG: {
  Dice: {
    D20Roll: {
      ADV_MODE: {
        ADVANTAGE: number;
        DISADVANTAGE: number;
        NORMAL: number;
      };
    };
  };
  [key: string]: any;
};

declare const CONST: {
  ACTIVE_EFFECT_MODES: {
    ADD: number;
    MULTIPLY: number;
    OVERRIDE: number;
    UPGRADE: number;
    DOWNGRADE: number;
    CUSTOM: number;
    [key: string]: number;
  };
  [key: string]: any;
};

declare const game: {
  user: {
    isGM: boolean;
    [key: string]: any;
  };
  settings: {
    get(module: string, key: string): any;
    set(module: string, key: string, value: any): Promise<any>;
  };
  modules: Map<string, { active: boolean; [key: string]: any }>;
  i18n: {
    localize(key: string): string;
    format(key: string, data?: Record<string, any>): string;
  };
  [key: string]: any;
};

declare const foundry: {
  utils: {
    deepClone<T>(obj: T): T;
    mergeObject<T>(original: T, other: Partial<T>, options?: Record<string, any>): T;
    getProperty(obj: any, key: string): any;
    setProperty(obj: any, key: string, value: any): boolean;
    randomID(length?: number): string;
    [key: string]: any;
  };
  [key: string]: any;
};

declare const Hooks: {
  on(hook: string, callback: (...args: any[]) => any): number;
  once(hook: string, callback: (...args: any[]) => any): number;
  off(hook: string, id: number): void;
  callAll(hook: string, ...args: any[]): boolean;
  call(hook: string, ...args: any[]): boolean;
};

interface Window {
  DDBImporter: {
    lib: Record<string, any>;
    [key: string]: any;
  };
}

declare var DDBImporter: {
  lib: Record<string, any>;
  [key: string]: any;
};
