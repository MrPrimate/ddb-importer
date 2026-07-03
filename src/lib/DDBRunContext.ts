export interface IDDBRunContextOptions {
  keyPostfix?: string | null;
  useLocal?: boolean;
  ignoreEnrichedImages?: boolean;
}

interface IDDBRunContextState {
  keyPostfix: string | null;
  useLocal: boolean;
  ignoreEnrichedImages: boolean;
}

const DEFAULT_STATE: IDDBRunContextState = {
  keyPostfix: null,
  useLocal: false,
  ignoreEnrichedImages: false,
};

let state: IDDBRunContextState = { ...DEFAULT_STATE };

/**
 * Ambient context for a character-scoped import/update run.
 *
 * Some deeply nested consumers (monster/vehicle factories, companion image
 * enrichment) need the per-character cobalt key postfix and local Patreon key
 * flag without them being threaded through every call. This replaces the old
 * pattern of mutating CONFIG.DDBI.keyPostfix / useLocal and manually deleting
 * them in finally blocks: runWith restores the previous state on exit
 * (exception-safe and nesting-safe).
 */
const DDBRunContext = {

  get keyPostfix(): string | null {
    return state.keyPostfix;
  },

  get useLocal(): boolean {
    return state.useLocal;
  },

  get ignoreEnrichedImages(): boolean {
    return state.ignoreEnrichedImages;
  },

  async runWith<T>(options: IDDBRunContextOptions, fn: () => Promise<T>): Promise<T> {
    const previous = state;
    state = { ...previous, ...options };
    try {
      return await fn();
    } finally {
      state = previous;
    }
  },

};

export default DDBRunContext;
