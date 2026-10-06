import EffectGenerator from "../../../../src/parser/enrichers/effects/EffectGenerator";
import { installActivityConfigStubs } from "../../../_fixtures/ddb/stubs";

// Fizban's hoard items tag each modifier's restriction with the stage that grants it. Every
// restriction filter used to drop those modifiers, so Scaled Ornament (Stirring) came through with
// no +1 AC or immunities and Dragon-Touched Focus with no initiative advantage.

const ddb: any = {
  character: {
    classes: [],
    modifiers: { class: [], race: [], background: [], feat: [], item: [], condition: [] },
    optionalClassFeatures: [],
    options: { class: [] },
    choices: { class: [] },
  },
};

const modifier = (type: string, subType: string, restriction: string | null, value: number | null = null): any => ({
  type,
  subType,
  restriction,
  bonusTypes: [],
  fixedValue: value,
  value,
  dice: null,
  duration: null,
  modifierTypeId: 1,
});

// a wondrous item is trinket equipment, the only equipment that takes AC bonus changes
const generateEffects = (grantedModifiers: any[]): any[] => {
  const document: any = {
    name: "Scaled Ornament (Stirring)",
    type: "equipment",
    effects: [],
    flags: {},
    system: { source: { rules: "2014" }, type: { value: "trinket" } },
  };
  const generator = new (EffectGenerator as any)({
    ddb,
    character: { flags: {}, system: {} },
    ddbItem: {
      definition: {
        name: document.name,
        grantedModifiers,
        isConsumable: false,
        canEquip: true,
        canAttune: true,
      },
    },
    document,
    type: "item",
    isCompendiumItem: true,
  });
  generator.generate();
  return document.effects;
};

const generateChanges = (grantedModifiers: any[]): { key: string; value: string }[] =>
  generateEffects(grantedModifiers).flatMap((effect: any) => effect.system?.changes ?? effect.changes ?? []);

describe("EffectGenerator hoard item stage tags", () => {
  beforeAll(() => {
    // generate() reaches EffectGenerator._addAbilityAdvantageEffect, which reads CONFIG.Dice.D20Roll
    installActivityConfigStubs();
  });

  it("strips a trailing stage tag from copies of the modifiers", () => {
    const source = [
      modifier("bonus", "armor-class", "(Stirring)", 1),
      modifier("set", "innate-speed-flying", "can hover (Ascendant)"),
      modifier("bonus", "armor-class", "while wearing heavy armor", 1),
    ];
    const result = EffectGenerator.withoutHoardStageTags(source);

    expect(result.map((m) => m.restriction)).toEqual(["", "can hover", "while wearing heavy armor"]);
    expect(source[0].restriction).toBe("(Stirring)");
    expect(result[2]).toBe(source[2]);
  });

  it("keeps a stage name that is not a trailing tag", () => {
    const [result] = EffectGenerator.withoutHoardStageTags([modifier("bonus", "armor-class", "(Stirring) while attuned", 1)]);
    expect(result.restriction).toBe("(Stirring) while attuned");
  });

  it("builds the Stirring ornament's AC bonus and immunities", () => {
    const changes = generateChanges([
      modifier("bonus", "armor-class", "(Stirring)", 1),
      modifier("immunity", "charmed", "(Stirring)"),
      modifier("immunity", "frightened", "(Stirring)"),
    ]);
    const keys = changes.map((change) => `${change.key}=${change.value}`);

    expect(keys).toContain("system.attributes.ac.bonus=1");
    expect(keys).toEqual(expect.arrayContaining([
      "system.traits.ci.value=charmed",
      "system.traits.ci.value=frightened",
    ]));
  });

  it("folds the AC changes into the generic effect, each change once", () => {
    const effects = generateEffects([
      modifier("bonus", "armor-class", "(Stirring)", 1),
      modifier("immunity", "charmed", "(Stirring)"),
    ]);

    expect(effects).toHaveLength(1);
    expect(effects[0].system.changes.map((change: any) => `${change.key}=${change.value}`).sort()).toEqual([
      "system.attributes.ac.bonus=1",
      "system.traits.ci.value=charmed",
    ]);
  });

  it("builds the Slumbering focus's initiative advantage", () => {
    const changes = generateChanges([modifier("advantage", "initiative", "(Slumbering)")]);
    expect(changes.map((change) => change.key)).toContain("flags.dnd5e.initiativeAdv");
  });
});
