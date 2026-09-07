// Mock the enricher/activity chain to avoid pulling in the full dependency tree
vi.mock("../../../src/parser/enrichers/mixins/DDBEnricherFactoryMixin", () => ({
  default: class {},
}));
vi.mock("../../../src/parser/activities/mixins/DDBActivityFactoryMixin", () => ({
  default: class {
    additionalActivities: any[] = [];
    documentType: any = null;
    useMidiAutomations = false;
    usesOnActivity = false;
    ignoreActivityGeneration = false;
    forceDefaultActionBuild = false;
    data: any = null;
    activityTypes: any[] = [];
    activities: any[] = [];
  },
}));
vi.mock("../../../src/parser/enrichers/DDBMonsterFeatureEnricher", () => ({
  default: class { init() {} load() {} },
}));
vi.mock("../../../src/parser/lib/_module", async (importOriginal) => {
  const actual = await importOriginal<Record<string, any>>();
  return {
    ...actual,
    DDBReferenceLinker: {
      ...actual.DDBReferenceLinker,
      // the real linker needs compendium indexes; the pin only cares that activity text
      // is put through it
      parseMonsterDescription: vi.fn(async ({ text }: { text: string }) => `linked(${text})`),
    },
  };
});
vi.mock("../../../src/parser/activities/_module", () => ({
  DDBMonsterFeatureActivity: class {},
}));

import DDBMonsterFeature from "../../../src/parser/monster/features/DDBMonsterFeature";

/**
 * Create a mock object with DDBMonsterFeature's prototype chain
 * so that methods calling other prototype methods (e.g. getRange → getReach) work.
 */
function makeFeatureMock(props: Record<string, any>) {
  const mock = Object.create(DDBMonsterFeature.prototype);
  Object.assign(mock, {
    actionData: {
      properties: {},
      range: { value: null, long: null, units: "", reach: null },
    },
    healingAction: false,
    meleeAttack: false,
    rangedAttack: false,
  }, props);
  return mock;
}

// =============================================================================
// getReach - regex extraction of weapon reach
// =============================================================================
describe("DDBMonsterFeature.prototype.getReach", () => {
  it("extracts 10 ft reach", () => {
    const mock = makeFeatureMock({ strippedHtml: "Melee Weapon Attack: +7 to hit, reach 10 ft., one target." });
    expect(mock.getReach()).toBe(10);
  });

  it("returns null for default 5 ft reach", () => {
    const mock = makeFeatureMock({ strippedHtml: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target." });
    expect(mock.getReach()).toBeNull();
  });

  it("returns null when no reach mentioned", () => {
    const mock = makeFeatureMock({ strippedHtml: "Ranged Weapon Attack: +4 to hit, range 80/320 ft." });
    expect(mock.getReach()).toBeNull();
  });

  it("extracts 15 ft reach", () => {
    const mock = makeFeatureMock({ strippedHtml: "Melee Weapon Attack: +11 to hit, reach 15 ft., one target." });
    expect(mock.getReach()).toBe(15);
  });

  it("handles extra spaces in reach notation", () => {
    const mock = makeFeatureMock({ strippedHtml: "reach  10  ft" });
    expect(mock.getReach()).toBe(10);
  });
});

// =============================================================================
// getRange - regex extraction of weapon range
// =============================================================================
describe("DDBMonsterFeature.prototype.getRange", () => {
  it("parses 'range 80/320 ft'", () => {
    const mock = makeFeatureMock({ strippedHtml: "Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target." });
    const range = mock.getRange();
    expect(range.value).toBe(80);
    expect(range.long).toBe(320);
    expect(range.units).toBe("ft");
  });

  it("parses 'range 30 ft./120 ft'", () => {
    const mock = makeFeatureMock({ strippedHtml: "Ranged Weapon Attack: +6 to hit, range 30 ft./120 ft., one target." });
    const range = mock.getRange();
    expect(range.value).toBe(30);
    expect(range.long).toBe(120);
    expect(range.units).toBe("ft");
  });

  it("parses 'range 60 ft' single range", () => {
    const mock = makeFeatureMock({ strippedHtml: "Ranged Spell Attack: +8 to hit, range 60 ft., one creature." });
    const range = mock.getRange();
    expect(range.value).toBe(60);
    expect(range.long).toBeNull();
    expect(range.units).toBe("ft");
  });

  it("parses 'reach 10 ft' weapon with rch property", () => {
    const mock = makeFeatureMock({
      strippedHtml: "Melee Weapon Attack: +7 to hit, reach 10 ft., one target.",
      templateType: "weapon",
    });
    const range = mock.getRange();
    expect(range.reach).toBe(10);
    expect(range.units).toBe("ft");
    expect(mock.actionData.properties.rch).toBe(true);
  });

  it("parses 'reach 5 ft' weapon without rch property", () => {
    const mock = makeFeatureMock({
      strippedHtml: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target.",
      templateType: "weapon",
    });
    const range = mock.getRange();
    expect(range.reach).toBe(5);
    expect(range.units).toBe("ft");
    expect(mock.actionData.properties.rch).toBeFalsy();
  });

  it("parses 'within 10 feet'", () => {
    const mock = makeFeatureMock({ strippedHtml: "each creature within 10 feet must succeed on a saving throw" });
    const range = mock.getRange();
    expect(range.value).toBe(10);
    expect(range.units).toBe("ft");
  });

  it("defaults to 5 ft for melee attack with no range text", () => {
    const mock = makeFeatureMock({ strippedHtml: "The creature slashes with its claws.", meleeAttack: true });
    const range = mock.getRange();
    expect(range.value).toBe(5);
    expect(range.units).toBe("ft");
  });

  it("returns empty range for non-melee with no range text", () => {
    const mock = makeFeatureMock({ strippedHtml: "The creature does something mysterious." });
    const range = mock.getRange();
    expect(range.value).toBeNull();
    expect(range.long).toBeNull();
    expect(range.units).toBe("");
  });
});

// =============================================================================
// getActionType - determines activation cost from type and text
// =============================================================================
describe("DDBMonsterFeature.prototype.getActionType", () => {
  it("detects 'as a bonus action'", () => {
    const mock = makeFeatureMock({ type: "action", strippedHtml: "The creature can use this as a bonus action." });
    expect(mock.getActionType()).toBe("bonus");
  });

  it("detects 'as a reaction'", () => {
    const mock = makeFeatureMock({ type: "action", strippedHtml: "The creature can use this as a reaction when hit." });
    expect(mock.getActionType()).toBe("reaction");
  });

  it("detects 'creature dies' as special", () => {
    const mock = makeFeatureMock({ type: "special", strippedHtml: "When the creature dies, it explodes in a burst of fire." });
    expect(mock.getActionType()).toBe("special");
  });

  it("detects 'as an action'", () => {
    const mock = makeFeatureMock({ type: "bonus", strippedHtml: "The creature can use this as an action." });
    expect(mock.getActionType()).toBe("action");
  });

  it("defaults to type when no text match", () => {
    const mock = makeFeatureMock({ type: "action", strippedHtml: "The creature makes two melee attacks." });
    expect(mock.getActionType()).toBe("action");
  });

  it("lair type overrides text match", () => {
    const mock = makeFeatureMock({ type: "lair", strippedHtml: "as a bonus action" });
    expect(mock.getActionType()).toBe("lair");
  });

  it("mythic type overrides", () => {
    const mock = makeFeatureMock({ type: "mythic", strippedHtml: "something happens" });
    expect(mock.getActionType()).toBe("mythic");
  });

  it("legendary type overrides", () => {
    const mock = makeFeatureMock({ type: "legendary", strippedHtml: "as a reaction" });
    expect(mock.getActionType()).toBe("legendary");
  });
});

// =============================================================================
// getTarget - template and creature targeting extraction
// =============================================================================
describe("DDBMonsterFeature.prototype.getTarget", () => {
  it("parses '60-foot cone'", () => {
    const mock = makeFeatureMock({ strippedHtml: "The dragon exhales fire in a 60-foot cone." });
    const target = mock.getTarget();
    expect(target.template.type).toBe("cone");
    expect(target.template.size).toBe("60");
    expect(target.template.units).toBe("ft");
  });

  it("parses '90-foot line'", () => {
    const mock = makeFeatureMock({ strippedHtml: "The creature emits a 90-foot line that is 10 feet wide." });
    const target = mock.getTarget();
    expect(target.template.type).toBe("line");
    expect(target.template.size).toBe("90");
  });

  it("parses '10-foot cube'", () => {
    const mock = makeFeatureMock({ strippedHtml: "A 10-foot cube of acid fills the area." });
    const target = mock.getTarget();
    expect(target.template.type).toBe("cube");
    expect(target.template.size).toBe("10");
  });

  it("parses '20-foot-radius sphere'", () => {
    const mock = makeFeatureMock({ strippedHtml: "Each creature in a 20-foot-radius sphere centered on the point." });
    const target = mock.getTarget();
    expect(target.template.type).toBe("sphere");
    expect(target.template.size).toBe("20");
  });

  it("parses 'one creature' target", () => {
    const mock = makeFeatureMock({ strippedHtml: "one creature within 60 feet must succeed on a saving throw." });
    const target = mock.getTarget();
    expect(target.affects.type).toBe("creature");
    expect(target.affects.count).toBe("1");
  });

  it("parses 'each creature' (no specific count)", () => {
    const mock = makeFeatureMock({ strippedHtml: "Each creature within 30 feet of the point must make a save." });
    const target = mock.getTarget();
    expect(target.affects.type).toBe("creature");
    expect(target.affects.count).toBe("");
  });

  it("melee attack defaults to 1 creature", () => {
    const mock = makeFeatureMock({
      strippedHtml: "Hit: 10 (2d6 + 3) slashing damage.",
      meleeAttack: true,
    });
    const target = mock.getTarget();
    expect(target.affects.type).toBe("creature");
    expect(target.affects.count).toBe("1");
  });

  // an eye ray table: the Disintegration Ray destroys "a 10-foot cube of it" (an object),
  // and the intro aims "at a target it can see within 120 feet of it" - neither is an area
  it("does not read the portion of an object a ray disintegrates as a cube", () => {
    const mock2024 = makeFeatureMock({
      strippedHtml: "If the target is a nonmagical object or a creation of magical force, a 10-foot Cube of it disintegrates into dust.",
    });
    expect(mock2024.getTarget().template.type).toBe("");
    const mock2014 = makeFeatureMock({
      strippedHtml: "If the target is a Huge or larger object or creation of magical force, this ray disintegrates a 10-foot cube of it.",
    });
    expect(mock2014.getTarget().template.type).toBe("");
  });

  it("does not read a range to an object as a radius or the portion destroyed as a cube", () => {
    const mock = makeFeatureMock({
      strippedHtml: "The rust monster corrodes a nonmagical ferrous metal object it can see within 5 feet of it."
        + " If the object isn't being worn or carried, the touch destroys a 1-foot cube of it.",
    });
    expect(mock.getTarget().template.type).toBe("");
  });

  it("does not read 'a target it can see within N feet of it' as a radius", () => {
    const mock = makeFeatureMock({
      strippedHtml: "The death tyrant randomly shoots one of the following magical rays at a target it can see within 120 feet of itself.",
    });
    const target = mock.getTarget();
    expect(target.template.type).toBe("");
    expect(target.template.size).toBe("");
  });

  it("reads a section's text instead of the feature's when given one", () => {
    const charmRay = "Charm Ray. The targeted creature must succeed on a DC 17 Wisdom saving throw or be charmed"
      + " by the tyrant for 1 hour, or until the beholder harms the creature.";
    const mock = makeFeatureMock({
      strippedHtml: `The dragon exhales fire in a 60-foot cone. ${charmRay}`,
    });
    const target = mock.getTarget({ text: charmRay });
    expect(target.template.type).toBe("");
    expect(target.affects.type).toBe("creature");
    expect(target.affects.count).toBe("1");
  });

  it("leaves the feature range alone when a section's area is centred on the monster", () => {
    const mock = makeFeatureMock({ strippedHtml: "irrelevant" });
    const text = "Each creature within 30 feet of you must make a DC 15 Constitution saving throw.";

    expect(mock.getTarget({ text, mutateRange: false }).template.type).toBe("radius");
    expect(mock.actionData.range.units).toBe("");
    // the feature-level read still rewrites it, as before
    expect(mock.getTarget({ text }).template.type).toBe("radius");
    expect(mock.actionData.range.units).toBe("self");
  });
});

// =============================================================================
// getOtherCastSpells - spells cast by non-Spellcasting features
// =============================================================================
describe("DDBMonsterFeature.prototype.getOtherCastSpells", () => {
  function makeCastMock(strippedHtml: string, usesMax = "") {
    return makeFeatureMock({
      strippedHtml,
      name: "Feature",
      ddbMonster: { name: "Monster" },
      data: { system: { uses: { max: usesMax } } },
    });
  }

  it("does not glue a cast count onto the last spell in a list", () => {
    const mock = makeCastMock(
      "The archmage casts Fireball, Ice Storm, or Lightning Bolt twice in any combination, using the same spellcasting ability as Spellcasting.",
      "1",
    );
    const spells = mock.getOtherCastSpells();
    expect(spells.map((s: any) => s.name)).toEqual(["Fireball", "Ice Storm", "Lightning Bolt"]);
    expect(spells.every((s: any) => s.consumeType === "itemUses")).toBe(true);
    expect(spells.every((s: any) => !s.ability)).toBe(true);
  });

  it("parses a level qualifier, a cast count and Material component wording", () => {
    const mock = makeCastMock(
      "The fiend casts Fireball (level 5 version) twice, requiring no Material components and using Charisma as the spellcasting ability (spell save DC 21).",
    );
    const spells = mock.getOtherCastSpells();
    expect(spells).toHaveLength(1);
    expect(spells[0]).toMatchObject({ name: "Fireball", level: "5", noComponents: true, ability: "Charisma" });
    expect(spells[0].extra).toBeUndefined();
  });

  it("accepts a named spellcasting feature as the ability source", () => {
    const mock = makeCastMock(
      "The knight casts Command (level 3 version), using the same spellcasting ability as Commanding Magic. The knight can't take this action again until the start of its next turn.",
    );
    const spells = mock.getOtherCastSpells();
    expect(spells).toHaveLength(1);
    expect(spells[0]).toMatchObject({ name: "Command", level: "3" });
    expect(spells[0].ability).toBeUndefined();
  });

  it("carries a (self only) qualifier through as a self target", () => {
    const mock = makeCastMock(
      "The fiend casts Dispel Magic, Invisibility (self only), Misty Step, or Suggestion, requiring no Material components and using the same spellcasting ability as Spellcasting.",
    );
    const spells = mock.getOtherCastSpells();
    expect(spells.map((s: any) => s.name)).toEqual(["Dispel Magic", "Invisibility", "Misty Step", "Suggestion"]);
    expect(spells[1]).toMatchObject({ targetSelf: true, extra: "self only", noComponents: true });
    expect(spells[0].targetSelf).toBeUndefined();
  });

  it("still parses a single spell with an explicit ability", () => {
    const mock = makeCastMock(
      "The drider casts Darkness, requiring no spell components and using Wisdom as the spellcasting ability (spell save DC 14).",
    );
    expect(mock.getOtherCastSpells()).toEqual([{ name: "Darkness", noComponents: true, ability: "Wisdom" }]);
  });

  it("still parses the on itself form", () => {
    const mock = makeCastMock(
      "The dragon casts Greater Invisibility on itself, requiring no spell components and using the same spellcasting ability as Spellcasting.",
    );
    const spells = mock.getOtherCastSpells();
    expect(spells).toHaveLength(1);
    expect(spells[0]).toMatchObject({ name: "Greater Invisibility", targetSelf: true, extra: "on itself", noComponents: true });
  });

  it("still parses the uses Spellcasting to cast form", () => {
    const mock = makeCastMock("The mage uses Spellcasting to cast Misty Step, and it can move up to 10 feet.");
    expect(mock.getOtherCastSpells().map((s: any) => s.name)).toEqual(["Misty Step"]);
  });

  it("returns nothing for text that does not cast a spell", () => {
    const mock = makeCastMock("The giant makes two greatsword attacks.");
    expect(mock.getOtherCastSpells()).toEqual([]);
  });
});
