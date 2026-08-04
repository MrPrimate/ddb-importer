/**
 * Runtime stubs shared by the feature parser tests.
 *
 * These extend the global test environment (see tests/_setup/foundryMocks.ts)
 * with the pieces the activity generation pipeline needs:
 * CONFIG.DND5E.activityTypes documentClass stubs and CONFIG.DND5E.abilities.
 */

/**
 * utils.stripHtml relies on DOM document.createElement, which the node test
 * environment does not provide. Install a minimal tag-stripping stand-in.
 */
export function installDocumentStub(): void {
  if ((globalThis as any).document) return;
  (globalThis as any).document = {
    createElement: () => {
      const el: any = { textContent: "", innerText: "" };
      Object.defineProperty(el, "innerHTML", {
        set(html: string) {
          const stripped = String(html).replace(/<[^>]*>/g, "");
          el.textContent = stripped;
          el.innerText = stripped;
        },
      });
      return el;
    },
  };
}

/** Mimics the dnd5e activity document class surface used by DDBBasicActivity. */
class FakeActivityDocument {
  name: string | null;

  type: string;

  constructor({ name = null, type }: { name?: string | null; type: string }) {
    this.name = name;
    this.type = type;
  }

  toObject(): Record<string, any> {
    return {
      name: this.name,
      type: this.type,
      activation: {},
      consumption: { targets: [], scaling: { allowed: false, max: "" } },
      description: {},
      duration: {},
      effects: [],
      range: {},
      target: {},
      uses: { spent: null, max: "", recovery: [] },
    };
  }
}

const ACTIVITY_TYPE_KEYS = [
  "attack",
  "cast",
  "check",
  "damage",
  "ddbmacro",
  "enchant",
  "forward",
  "heal",
  "save",
  "summon",
  "transform",
  "utility",
];

/**
 * Under vitest the parser/enrichers module cycle can leave the
 * DDBEnricherData.AutoEffects / ChangeHelper static initialisers undefined
 * (the effects barrel is still in TDZ when the class evaluates). Re-point
 * them at the loaded modules so loaded enrichers behave as in production.
 */
export async function repairEnricherDataStatics(): Promise<void> {
  const { default: DDBEnricherData } = await import("../../../src/parser/enrichers/data/DDBEnricherData");
  const effects = await import("../../../src/parser/enrichers/effects/_module");
  if (!DDBEnricherData.AutoEffects) (DDBEnricherData as any).AutoEffects = effects.AutoEffects;
  if (!DDBEnricherData.ChangeHelper) (DDBEnricherData as any).ChangeHelper = effects.ChangeHelper;
}

/**
 * Adds activityTypes/abilities stubs to the global CONFIG.DND5E from
 * foundryMocks. Call from beforeAll in tests that run activity generation.
 */
export function installActivityConfigStubs(): void {
  const config = (globalThis as any).CONFIG;
  // EffectGenerator._addAbilityAdvantageEffect reads the dnd5e D20Roll modes
  config.Dice ??= {};
  config.Dice.D20Roll ??= { ADV_MODE: { NORMAL: 0, ADVANTAGE: 1, DISADVANTAGE: -1 } };
  const dnd5e = (globalThis as any).CONFIG.DND5E;
  dnd5e.activityTypes ??= {};
  for (const type of ACTIVITY_TYPE_KEYS) {
    dnd5e.activityTypes[type] ??= { documentClass: FakeActivityDocument };
  }
  dnd5e.dieSteps ??= [4, 6, 8, 10, 12, 20, 100];
  dnd5e.abilities ??= {
    str: { label: "Strength" },
    dex: { label: "Dexterity" },
    con: { label: "Constitution" },
    int: { label: "Intelligence" },
    wis: { label: "Wisdom" },
    cha: { label: "Charisma" },
  };
}
