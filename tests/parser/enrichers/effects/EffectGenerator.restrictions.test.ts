import EffectGenerator from "../../../../src/parser/enrichers/effects/EffectGenerator";
import RestrictionRules from "../../../../src/parser/enrichers/effects/RestrictionRules";
import { installActivityConfigStubs } from "../../../_fixtures/ddb/stubs";

// DDB puts the "when" of a modifier in a free-text restriction and the generator drops every
// restricted modifier. RestrictionRules is the reviewed list of strings dnd5e 6.0 can express:
// concentration saves have a native field, and a class-scoped spell attack advantage is a rule
// gated on the rolled spell. Everything else must stay dropped.

beforeAll(() => {
  installActivityConfigStubs();
});

const ddb: any = {
  character: {
    classes: [],
    modifiers: { class: [], race: [], background: [], feat: [], item: [], condition: [] },
    optionalClassFeatures: [],
    options: { class: [] },
    choices: { class: [] },
  },
};

const buildGenerator = (grantedModifiers: any[], type = "feature"): any => {
  return new (EffectGenerator as any)({
    ddb,
    character: { flags: {}, system: {} },
    ddbItem: {
      definition: { name: "Test Feature", grantedModifiers, isConsumable: false, canEquip: true, canAttune: false },
    },
    document: { name: "Test Feature", effects: [], flags: {} },
    type,
    isCompendiumItem: true,
    separateACEffects: false,
  });
};

const modifier = (type: string, subType: string, restriction = "", value: number | null = null, extra: Record<string, any> = {}): any => ({
  type,
  subType,
  restriction,
  bonusTypes: [],
  fixedValue: value,
  value,
  dice: null,
  modifierTypeId: null,
  statId: null,
  ...extra,
});

describe("RestrictionRules table", () => {
  it("recognises every concentration wording seen in the fixtures", () => {
    for (const rule of RestrictionRules.RULES) {
      for (const seen of rule.seen) {
        expect(RestrictionRules.match(seen)?.id).toBe(rule.id);
      }
    }
  });

  it("maps a class spell attack restriction to the class filter and rejects unknown classes", () => {
    expect(RestrictionRules.match("Advantage on Sorcerer Spell Attacks")?.conditions).toEqual([
      { k: "roll.item.classIdentifier", o: "exact", v: "sorcerer" },
    ]);
    expect(RestrictionRules.match("Advantage on Fighter Spell Attacks")).toBeNull();
  });

  it("has nothing for a restriction that names game state the rules cannot see", () => {
    expect(RestrictionRules.match("while Rage is active.")).toBeNull();
    expect(RestrictionRules.match("Against being Frightened")).toBeNull();
    expect(RestrictionRules.match("")).toBeNull();
    expect(RestrictionRules.match(null)).toBeNull();
  });
});

describe("EffectGenerator concentration restrictions", () => {
  it("routes concentration advantage to the native concentration roll mode", () => {
    // Eldritch Mind, Swarmsense, Uncanny Focus
    const generator = buildGenerator([modifier("advantage", "constitution-saving-throws", "to maintain Concentration.")]);
    generator.generateGenericEffects();
    expect(generator.effect.system.changes).toEqual([
      { key: "system.attributes.concentration.roll.mode", type: "upgrade", value: "1", priority: 20 },
    ]);
  });

  it("routes a concentration bonus to the concentration roll bonus, not the Con save bonus", () => {
    // Orb of Skoraeus: +2 to Con saves to maintain concentration
    const generator = buildGenerator([modifier("bonus", "constitution-saving-throws", "to maintain your concentration on a spell", 2)]);
    generator.generateGenericEffects();
    const keys = generator.effect.system.changes.map((c: any) => c.key);
    expect(keys).toEqual(["system.attributes.concentration.roll.bonus"]);
    expect(generator.effect.system.changes[0].value).toBe("2");
  });

  it("keeps a plain Con save advantage on the ability save", () => {
    const generator = buildGenerator([modifier("advantage", "constitution-saving-throws")]);
    generator.generateGenericEffects();
    expect(generator.effect.system.changes.map((c: any) => c.key)).toEqual(["system.abilities.con.save.roll.mode"]);
  });

  it("still generates when concentration is the only modifier", () => {
    const generator = buildGenerator([modifier("advantage", "saving-throws", "made to maintain your concentration on a spell when you take damage")]);
    expect(generator.noGenerate).toBe(false);
  });
});

describe("EffectGenerator attack roll mode rules", () => {
  it("emits an unrestricted spell attack advantage as a classification-gated rule", () => {
    // Refined Delerium Dust
    const generator = buildGenerator([modifier("advantage", "spell-attacks")]);
    generator._addAttackRollModeRules();
    const [change] = generator.effect.system.changes;
    expect(change).toMatchObject({ key: "attack", type: "dnd5e.advantage", value: "1" });
    expect(JSON.parse(change.conditions)).toEqual([{ k: "roll.attack.classification", o: "exact", v: "spell" }]);
  });

  it("adds the class filter for a class spell attack restriction", () => {
    // Innate Sorcery's option modifier
    const generator = buildGenerator([modifier("advantage", "spell-attacks", "Advantage on Sorcerer Spell Attacks")]);
    generator._addAttackRollModeRules();
    expect(JSON.parse(generator.effect.system.changes[0].conditions)).toEqual([
      { k: "roll.attack.classification", o: "exact", v: "spell" },
      { k: "roll.item.classIdentifier", o: "exact", v: "sorcerer" },
    ]);
  });

  it("drops a restricted attack modifier the table cannot express", () => {
    // Giant Femur Club: "Against Giants only"
    const generator = buildGenerator([modifier("advantage", "melee-attacks", "Against Giants only")]);
    generator._addAttackRollModeRules();
    expect(generator.effect.system.changes).toEqual([]);
  });

  it("emits weapon disadvantage with both classification and attack type clauses", () => {
    // Potion of Malice / Straitjacket
    const generator = buildGenerator([modifier("disadvantage", "melee-weapon-attacks")]);
    generator._addAttackRollModeRules();
    const [change] = generator.effect.system.changes;
    expect(change).toMatchObject({ key: "attack", type: "dnd5e.advantage", value: "-1" });
    expect(JSON.parse(change.conditions)).toEqual([
      { k: "roll.attack.classification", o: "exact", v: "weapon" },
      { k: "roll.attack.type", o: "exact", v: "melee" },
    ]);
  });

  it("emits one rule when several modifiers resolve to the same scope", () => {
    const generator = buildGenerator([modifier("advantage", "melee-attacks"), modifier("advantage", "melee-attacks")]);
    generator._addAttackRollModeRules();
    expect(generator.effect.system.changes).toHaveLength(1);
  });
});
