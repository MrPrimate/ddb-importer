// @vitest-environment jsdom
import DDBCompanion2024 from "../../../src/parser/companions/DDBCompanion2024";

// The 2024 stat block format puts damage and condition immunities on a single
// "Immunities" line, so the parser has to sort them itself.
function makeCompanion(immunities: string, options: Record<string, any> = {}) {
  const block = `<div><p><strong>Immunities</strong> ${immunities}</p></div>`;
  const companion = new DDBCompanion2024(block as unknown as HTMLElement, options);
  (companion as any).npc = {
    name: "Test Companion",
    system: { traits: {} },
  };
  return companion;
}

async function parseImmunities(immunities: string, options: Record<string, any> = {}) {
  const companion = makeCompanion(immunities, options);
  await (companion as any)._generate();
  return (companion as any).npc.system.traits;
}

describe("DDBCompanion2024 immunities", () => {

  it("sorts capitalised damage types into damage immunities, not custom conditions", async () => {
    // Renanimated Companion: DDB writes the damage types capitalised
    const traits = await parseImmunities("Lightning, Poison; Exhaustion, Poisoned");

    expect(traits.di.value).toEqual(expect.arrayContaining(["lightning", "poison"]));
    expect(traits.di.custom).toBe("");
    expect(traits.ci.value).toEqual(expect.arrayContaining(["exhaustion", "poisoned"]));
    expect(traits.ci.custom).toBe("");
  });

  it("sorts lowercase damage types into damage immunities", async () => {
    const traits = await parseImmunities("necrotic, poison; charmed, frightened");

    expect(traits.di.value).toEqual(expect.arrayContaining(["necrotic", "poison"]));
    expect(traits.di.custom).toBe("");
    expect(traits.ci.value).toEqual(expect.arrayContaining(["charmed", "frightened"]));
    expect(traits.ci.custom).toBe("");
  });

  it("keeps unknown entries as custom condition immunities", async () => {
    const traits = await parseImmunities("Poison; Rugpulling");

    expect(traits.di.value).toEqual(["poison"]);
    expect(traits.ci.value).toEqual([]);
    expect(traits.ci.custom).toBe("Rugpulling");
  });

  it("filters subtype gated damage immunities on a capitalised line", async () => {
    const traits = await parseImmunities("Poison; Fire (Fire only)", { subType: "Fire" });

    expect(traits.di.value).toEqual(expect.arrayContaining(["poison", "fire"]));
  });

  it("drops subtype gated damage immunities for other subtypes", async () => {
    const traits = await parseImmunities("Poison; Fire (Fire only)", { subType: "Water" });

    expect(traits.di.value).toEqual(["poison"]);
    expect(traits.di.value).not.toContain("fire");
  });

});

// Hit dice that scale with a class or spell level: dnd5e reads the die from the HP formula and the
// summon activity's hd bonus adds the count, so the formula carries the die with no dice of its own.
function hitDiceFor(hpString: string) {
  const companion = new DDBCompanion2024("<div></div>" as unknown as HTMLElement, {});
  (companion as any).npc = { name: "Test Companion", system: { attributes: { hp: {} } } };
  (companion as any)._handleHitPoints(hpString);
  (companion as any)._handleHitDice(hpString);
  return {
    formula: (companion as any).npc.system.attributes.hp.formula,
    hd: (companion as any).summons.bonuses.hd,
  };
}

describe("DDBCompanion hit dice", () => {

  it("scales a vestige's d6s with the warlock level", () => {
    // Vestige Companion: DDB capitalises the class
    expect(hitDiceFor("4 + four times your Warlock level (the vestige has a number of Hit Dice [d6s] equal to your Warlock level)"))
      .toEqual({ formula: "0d6 + 4", hd: "@classes.warlock.levels" });
  });

  it("reads a two digit die", () => {
    expect(hitDiceFor("5 + five times your ranger level (the beast has a number of Hit Dice [d10s] equal to your ranger level)"))
      .toEqual({ formula: "0d10 + 5", hd: "@classes.ranger.levels" });
  });

  it("slugs a multi-word class", () => {
    expect(hitDiceFor("5 + your Blood Hunter level (the creature has a number of Hit Dice [d8s] equal to your Blood Hunter level)").hd)
      .toBe("@classes.blood-hunter.levels");
  });

  it.each([
    "40 + 10 for each spell level above 5th (the spirit has a number of Hit Dice [d10s] equal to the spell’s level)",
    "40 + 10 for each spell level above 5th (the spirit has a number of Hit Dice [d10s] equal to the spell's level)",
    "40 + 10 for each spell level above 5th (the spirit has a number of Hit Dice [d10s] equal to the level of the spell)",
  ])("scales with the spell level: %s", (hpString) => {
    expect(hitDiceFor(hpString)).toEqual({ formula: "0d10 + 40", hd: "@item.level" });
  });

  it("leaves a companion without scaling hit dice alone", () => {
    expect(hitDiceFor("30 + 10 for each spell level above 3rd")).toEqual({ formula: undefined, hd: "" });
  });

});

describe("DDBCompanionMixin.PROFICIENCY_BOND", () => {
  it.each([
    "Bond. Add your Proficiency Bonus to any ability check or saving throw the widget makes.",
    "Bond. Add your Proficiency Bonus to any ability check, attack roll, or saving throw the clockwork hound makes.",
    "Bond. Add your proficiency bonus to any ability check or saving throw that the sprite makes.",
  ])("matches %s", (text) => {
    expect(DDBCompanion2024.PROFICIENCY_BOND.test(text)).toBe(true);
  });

  it.each([
    "Add your Proficiency Bonus to any ability check you make that uses the widget.",
    "Add your Proficiency Bonus to Wisdom saving throws for the duration.",
  ])("does not match %s", (text) => {
    expect(DDBCompanion2024.PROFICIENCY_BOND.test(text)).toBe(false);
  });
});
