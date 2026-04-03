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
    mergeObject(original: any, other: any) {
      return { ...original, ...other };
    },
    isNewerVersion() {
      return false;
    },
    randomID() {
      return Math.random().toString(36).substring(2, 18);
    },
  },
  applications: {
    api: {
      ApplicationV2: noopClass,
      HandlebarsApplicationMixin: (cls: any) => cls,
    },
    apps: {
      FilePicker: {
        implementation: noopClass,
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
(globalThis as any).game = {
  settings: {
    get: () => "OFF",
    set: () => {},
    register: () => {},
  },
  modules: {
    get: () => undefined,
  },
  user: { id: "testUser", isGM: true },
  packs: {
    get: () => undefined,
  },
  i18n: {
    localize: (s: string) => s,
    format: (s: string) => s,
  },
};

// -- CONFIG --
// Use the real DDB fallback config data for realistic test fixtures
import { fallbackDDBConfig } from "../../src/hooks/ready/fallbackConfig";

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
    rules: {},
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
  },
  DDB: fallbackDDBConfig,
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
  { parseHTML: () => [] },
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
