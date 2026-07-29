/**
 * Minimal Foundry VTT global stubs for test environment.
 *
 * Most Foundry globals are only accessed inside function bodies at runtime,
 * not at module-load time. However, the barrel re-exports in _module.ts mean
 * that importing *any* lib file triggers loading of all lib files, and a few
 * of those have top-level references:
 *
 *   - FileHelper.ts: `foundry.applications.apps.FilePicker.implementation`
 *   - Crosshairs.ts: `foundry.canvas?.placeables?.MeasuredTemplate ?? MeasuredTemplate`
 *   - Logger.ts: `game.settings.get(...)` (inside try/catch, safe)
 *
 * These stubs make imports succeed. They do NOT need to replicate real behavior.
 */

// -- foundry namespace --
const noopClass = class {};

(globalThis as any).foundry = {
  utils: {
    getProperty(obj: any, key: string) {
      if (!obj || !key) return undefined;
      return key.split(".").reduce((o, k) => o?.[k], obj);
    },
    setProperty(obj: any, key: string, value: any) {
      const parts = key.split(".");
      const last = parts.pop()!;
      const target = parts.reduce((o, k) => {
        if (o[k] === undefined) o[k] = {};
        return o[k];
      }, obj);
      target[last] = value;
      return true;
    },
    hasProperty(obj: any, key: string) {
      return foundry.utils.getProperty(obj, key) !== undefined;
    },
    deepClone(obj: any) {
      return JSON.parse(JSON.stringify(obj));
    },
    // Mirrors foundry's isEmpty: undefined/null are empty, as are zero-length
    // arrays/strings and objects/Sets/Maps with no entries.
    isEmpty(value: any) {
      if (value === undefined || value === null) return true;
      if (Array.isArray(value) || typeof value === "string") return !value.length;
      if (value instanceof Set || value instanceof Map) return !value.size;
      if (typeof value === "object") return !Object.keys(value).length;
      return false;
    },
    expandObject(obj: any): any {
      const expanded: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const inner = value !== null && typeof value === "object" && !Array.isArray(value)
          ? foundry.utils.expandObject(value)
          : value;
        foundry.utils.setProperty(expanded, key, inner);
      }
      return expanded;
    },
    duplicate(obj: any) {
      return JSON.parse(JSON.stringify(obj));
    },
    // Deep, dot-path-aware merge following classic Foundry semantics
    // (insertKeys/insertValues/overwrite/recursive/inplace, "-=key" deletions).
    mergeObject(
      original: any,
      other: any = {},
      {
        insertKeys = true,
        insertValues = true,
        overwrite = true,
        recursive = true,
        inplace = true,
        performDeletions = false,
      }: Record<string, boolean> = {},
      _d = 0,
    ): any {
      if (!(original instanceof Object) || !(other instanceof Object)) {
        throw new Error("One of original or other are not Objects!");
      }
      const options = { insertKeys, insertValues, overwrite, recursive, inplace, performDeletions };

      if (_d === 0) {
        if (Object.keys(other).some((k) => k.includes("."))) other = foundry.utils.expandObject(other);
        if (Object.keys(original).some((k) => k.includes("."))) {
          const expanded = foundry.utils.expandObject(original);
          if (inplace) {
            Object.keys(original).forEach((k) => delete original[k]);
            Object.assign(original, expanded);
          } else {
            original = expanded;
          }
        } else if (!inplace) {
          original = foundry.utils.deepClone(original);
        }
      }

      for (let k of Object.keys(other)) {
        const v = (other as any)[k];
        let isDelete = false;
        if (k.startsWith("-=")) {
          k = k.slice(2);
          isDelete = true;
        }
        const has = Object.prototype.hasOwnProperty.call(original, k);
        if (isDelete) {
          if (performDeletions) delete original[k];
          else original[k] = v;
          continue;
        }
        if (has) {
          const x = original[k];
          const bothObjects = v !== null && typeof v === "object" && !Array.isArray(v)
            && x !== null && typeof x === "object" && !Array.isArray(x);
          if (bothObjects && recursive) {
            foundry.utils.mergeObject(x, v, { ...options, inplace: true }, _d + 1);
          } else if (overwrite) {
            original[k] = v !== null && typeof v === "object" ? foundry.utils.deepClone(v) : v;
          }
        } else {
          const canInsert = (_d === 0 && insertKeys) || (_d > 0 && insertValues);
          if (canInsert) {
            original[k] = v !== null && typeof v === "object" ? foundry.utils.deepClone(v) : v;
          }
        }
      }
      return original;
    },
    isNewerVersion() {
      return false;
    },
    randomID() {
      return Math.random().toString(36).substring(2, 18);
    },
    Semaphore: class Semaphore {
      max: number;
      _active = 0;
      _queue: Array<() => void> = [];
      constructor(max = 1) {
        this.max = max;
      }
      get active() {
        return this._active;
      }
      get remaining() {
        return this._queue.length;
      }
      add(fn: (...a: any[]) => any, ...args: any[]) {
        return new Promise((resolve, reject) => {
          const run = () => {
            this._active++;
            Promise.resolve()
              .then(() => fn(...args))
              .then(resolve, reject)
              .finally(() => {
                this._active--;
                this._next();
              });
          };
          if (this._active < this.max) run();
          else this._queue.push(run);
        });
      }
      _next() {
        if (this._active < this.max && this._queue.length) this._queue.shift()!();
      }
      clear() {
        this._queue = [];
      }
    },
  },
  applications: {
    api: {
      ApplicationV2: noopClass,
      HandlebarsApplicationMixin: (cls: any) => cls,
      // Minimal DialogV2 stub. `wait` resolves undefined by default; tests spy on
      // it to capture the config passed and to drive button/close callbacks.
      DialogV2: class DialogV2 {
        static async wait(_config: any): Promise<any> {
          return undefined;
        }
      },
    },
    apps: {
      FilePicker: {
        implementation: noopClass,
      },
    },
    handlebars: {
      renderTemplate: async (_path: string, _data: any) => "",
    },
    ux: {
      FormDataExtended: class FormDataExtended {
        object: Record<string, any>;
        constructor(_form: any) {
          this.object = {};
        }
      },
    },
  },
  canvas: {
    placeables: {
      MeasuredTemplate: noopClass,
    },
  },
  data: {
    fields: {
      BooleanField: noopClass,
      SchemaField: noopClass,
      StringField: noopClass,
      NumberField: noopClass,
    },
  },
  CONST: {
    DEFAULT_TOKEN: "icons/svg/mystery-man.svg",
  },
};

// -- game --
// Settings: configurable per-key map. Unset keys keep the historic "OFF" default
// (truthy!) that existing tests rely on; new tests opt into real values via
// setMockSettings and the global afterEach below resets between tests.
const mockSettings = new Map<string, unknown>();

export function setMockSettings(overrides: Record<string, unknown>, moduleId = "ddb-importer"): void {
  for (const [key, value] of Object.entries(overrides)) {
    mockSettings.set(key.includes(".") ? key : `${moduleId}.${key}`, value);
  }
}

export function resetMockSettings(): void {
  mockSettings.clear();
}

// Modules: configurable map of module id -> module stub ({ active: true, ... }).
const mockModules = new Map<string, unknown>();

export function setMockModules(overrides: Record<string, unknown>): void {
  for (const [id, value] of Object.entries(overrides)) {
    mockModules.set(id, value);
  }
}

export function resetMockModules(): void {
  mockModules.clear();
}

afterEach(() => {
  resetMockSettings();
  resetMockModules();
});

// dnd5e system stub: data models return an item/actor system template, and the
// advancement classes mimic the real toObject()/updateSource() surface used by
// AdvancementWrapper.
function systemTemplate(): Record<string, any> {
  return {
    description: { value: "", chat: "" },
    source: {},
    type: { value: "", subtype: "" },
    activities: {},
    uses: { spent: 0, max: "", recovery: [] },
    damage: { parts: [] },
    properties: [],
    activation: {},
    duration: {},
    range: {},
    target: {},
    identifier: "",
    prerequisites: {},
    requirements: "",
    proficient: 0,
    equipped: false,
    rarity: "",
    identified: true,
    advancement: [],
  };
}

const dnd5eDataModel: any = new Proxy({}, { get: () => ({ schema: { getInitialValue: systemTemplate } }) });

function makeFakeAdvancement(type: string) {
  return class FakeAdvancement {
    _data: Record<string, any>;

    constructor(data: Record<string, any> = {}) {
      this._data = {
        _id: foundry.utils.randomID(),
        type,
        configuration: {},
        value: {},
        ...data,
      };
    }

    toObject() {
      return foundry.utils.duplicate(this._data);
    }

    updateSource(changes: Record<string, any>) {
      foundry.utils.mergeObject(this._data, changes);
    }
  };
}

(globalThis as any).game = {
  settings: {
    get: (moduleId: string, key: string) => {
      const namespaced = `${moduleId}.${key}`;
      return mockSettings.has(namespaced) ? mockSettings.get(namespaced) : "OFF";
    },
    set: () => {},
    register: () => {},
  },
  modules: {
    get: (id: string) => mockModules.get(id),
  },
  user: { id: "testUser", isGM: true },
  packs: {
    get: (): undefined => undefined,
  },
  i18n: {
    localize: (s: string) => s,
    format: (s: string) => s,
  },
  dnd5e: {
    dataModels: { actor: dnd5eDataModel, item: dnd5eDataModel },
    documents: {
      advancement: {
        AbilityScoreImprovementAdvancement: makeFakeAdvancement("AbilityScoreImprovement"),
        HitPointsAdvancement: makeFakeAdvancement("HitPoints"),
        ItemChoiceAdvancement: makeFakeAdvancement("ItemChoice"),
        ItemGrantAdvancement: makeFakeAdvancement("ItemGrant"),
        ScaleValueAdvancement: makeFakeAdvancement("ScaleValue"),
        SizeAdvancement: makeFakeAdvancement("Size"),
        SubclassAdvancement: makeFakeAdvancement("Subclass"),
        TraitAdvancement: makeFakeAdvancement("Trait"),
      },
    },
    utils: {
      staticID: (id: string) => (id.length >= 16 ? id.substring(0, 16) : id.padEnd(16, "0")),
    },
  },
};

// -- CONFIG --
// Use the real DDB fallback config data for realistic test fixtures.
// The typed assignments double as compile-time checks that the shipped JSON
// assets still match IDDBConfig / IDDBRuleData.
import fallbackConfigJson from "../../data/fallback-config.json";
import fallbackRulesJson from "../../data/fallback-rules.json";

const fallbackDDBConfig: IDDBConfig = fallbackConfigJson;
const fallbackRuleData: IDDBRuleData = fallbackRulesJson;

(globalThis as any).CONFIG = {
  debug: {},
  DND5E: {
    spellPreparationStates: {
      prepared: { value: 1 },
      unprepared: { value: 0 },
      always: { value: 2 },
    },
    languages: {},
    weaponIds: {},
    armorIds: {},
    toolIds: {},
    defaultArtwork: {
      Actor: {},
      Item: {},
    },
    // Small real slice of the dnd5e rules map (slug -> journal page uuid) for
    // DDBReferenceLinker / rule-tag tests.
    rules: {
      advantage: "Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.lvs9RRDi1UA1Lff8",
      disadvantage: "Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.fFrHBgqKUMY0Nnco",
      attack: "Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.f4fZHwBvpbpzRyn4",
      cover: "Compendium.dnd5e.content24.JournalEntry.phbAppendixDRule.JournalEntryPage.W7f7PcRubNUMIq2S",
      darkness: "Compendium.dnd5e.content24.JournalEntry.phbAppendixDRule.JournalEntryPage.4dfREIDjG5N4fvxd",
      dash: "Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.6l6nBKip4LqB1sCU",
      disengage: "Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.w1AGsemFERfjqWNx",
      dodge: "Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.3YJIuyCMmuUrfmuX",
      hide: "Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.rqhOsUY4wWa1oHTy",
      opportunityattacks: "Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.eNvzQabiTqTtfzis",
      grappling: "Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.YSLWJcQCP6kzsPql",
      escapingagrapple: "Compendium.dnd5e.content24.JournalEntry.phbAppendixDRule.JournalEntryPage.2TZKy9YbMN3ZY3h8",
      difficultterrain: "Compendium.dnd5e.content24.JournalEntry.phbAppendixDRule.JournalEntryPage.6tqz947qO8vPyxvD",
      shortrest: "Compendium.dnd5e.content24.JournalEntry.phbAppendixDRule.JournalEntryPage.1s2swI3UsjUUgbt2",
      longrest: "Compendium.dnd5e.content24.JournalEntry.phbAppendixDRule.JournalEntryPage.6cLtjbHn4KV2R7G9",
      beingprone: "Compendium.dnd5e.content24.JournalEntry.phbAppendixDRule.JournalEntryPage.bV8akkBdVUUG21CO",
      droppingprone: "Compendium.dnd5e.content24.JournalEntry.phbAppendixDRule.JournalEntryPage.hwTLpAtSS5OqQsI1",
    },
    sourceBooks: {},
    creatureTypes: {
      aberration: { label: "Aberration" },
      beast: { label: "Beast" },
      celestial: { label: "Celestial" },
      construct: { label: "Construct" },
      dragon: { label: "Dragon" },
      elemental: { label: "Elemental" },
      fey: { label: "Fey" },
      fiend: { label: "Fiend" },
      giant: { label: "Giant" },
      humanoid: { label: "Humanoid" },
      monstrosity: { label: "Monstrosity" },
      ooze: { label: "Ooze" },
      plant: { label: "Plant" },
      undead: { label: "Undead" },
    },
    conditionTypes: {
      blinded: { label: "Blinded", icon: "systems/dnd5e/icons/svg/statuses/blinded.svg" },
      charmed: { label: "Charmed", icon: "systems/dnd5e/icons/svg/statuses/charmed.svg" },
      deafened: { label: "Deafened", icon: "systems/dnd5e/icons/svg/statuses/deafened.svg" },
      exhaustion: { label: "Exhaustion", icon: "systems/dnd5e/icons/svg/statuses/exhaustion.svg" },
      frightened: { label: "Frightened", icon: "systems/dnd5e/icons/svg/statuses/frightened.svg" },
      grappled: { label: "Grappled", icon: "systems/dnd5e/icons/svg/statuses/grappled.svg" },
      incapacitated: { label: "Incapacitated", icon: "systems/dnd5e/icons/svg/statuses/incapacitated.svg" },
      invisible: { label: "Invisible", icon: "systems/dnd5e/icons/svg/statuses/invisible.svg" },
      paralyzed: { label: "Paralyzed", icon: "systems/dnd5e/icons/svg/statuses/paralyzed.svg" },
      petrified: { label: "Petrified", icon: "systems/dnd5e/icons/svg/statuses/petrified.svg" },
      poisoned: { label: "Poisoned", icon: "systems/dnd5e/icons/svg/statuses/poisoned.svg" },
      prone: { label: "Prone", icon: "systems/dnd5e/icons/svg/statuses/prone.svg" },
      restrained: { label: "Restrained", icon: "systems/dnd5e/icons/svg/statuses/restrained.svg" },
      stunned: { label: "Stunned", icon: "systems/dnd5e/icons/svg/statuses/stunned.svg" },
      unconscious: { label: "Unconscious", icon: "systems/dnd5e/icons/svg/statuses/unconscious.svg" },
    },
    damageTypes: {
      acid: { label: "Acid" },
      bludgeoning: { label: "Bludgeoning" },
      cold: { label: "Cold" },
      fire: { label: "Fire" },
      force: { label: "Force" },
      lightning: { label: "Lightning" },
      necrotic: { label: "Necrotic" },
      piercing: { label: "Piercing" },
      poison: { label: "Poison" },
      psychic: { label: "Psychic" },
      radiant: { label: "Radiant" },
      slashing: { label: "Slashing" },
      thunder: { label: "Thunder" },
    },
    dieSteps: [4, 6, 8, 10, 12, 20, 100],
  },
  DDB: { ...fallbackDDBConfig, RULE_DATA: fallbackRuleData },
  DDBI: {
    POPUPS: {},
    DEV: { enabled: false },
    EFFECT_CONFIG: {
      MODULES: {},
    },
  },
};

// -- CONST --
(globalThis as any).CONST = {
  DEFAULT_TOKEN: "icons/svg/mystery-man.svg",
};

// -- Roll --
(globalThis as any).Roll = class Roll {
  formula: string;
  total: number;

  constructor(formula: string) {
    this.formula = formula;
    this.total = 0;
  }

  async evaluate() {
    return this;
  }

  static validate() {
    return true;
  }
};

// -- canvas (top-level global) --
// Functions like resolveSceneGridImageSource read `canvas?.scene` / `canvas?.level`.
// Optional chaining does not guard an *undeclared* global (that throws ReferenceError),
// so a default stub must exist. Tests override it via vi.stubGlobal("canvas", ...).
(globalThis as any).canvas = { scene: null, level: null };

// -- UI globals --
(globalThis as any).ui = {
  notifications: { warn: () => {}, error: () => {}, info: () => {} },
};

// -- jQuery stub --
(globalThis as any).$ = Object.assign(
  () => ({
    text: () => {},
    css: () => {},
    val: () => "",
    find: () => ({ val: () => "" }),
    length: 0,
    append: () => {},
  }),
  { parseHTML: (): unknown[] => [] },
);

// -- Dialog --
(globalThis as any).Dialog = class Dialog {
  constructor() {}
  render() { return this; }
};

// -- Document classes --
(globalThis as any).Item = class Item {};
(globalThis as any).Actor = class Actor {};
(globalThis as any).MeasuredTemplate = class MeasuredTemplate {};
(globalThis as any).FormApplication = class FormApplication {};
(globalThis as any).Application = class Application {};

// -- String.prototype.slugify (Foundry adds this to String prototype) --
if (!String.prototype.slugify) {
  (String.prototype as any).slugify = function ({ strict = false } = {}) {
    let slug = this.toLowerCase()
      .replace(/['']/g, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "");
    if (strict) {
      slug = slug.replace(/[^a-z0-9-]/g, "");
    }
    return slug;
  };
}
