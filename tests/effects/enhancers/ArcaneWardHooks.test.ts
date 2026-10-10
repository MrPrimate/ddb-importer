import ArcaneWard from "../../../src/effects/enhancers/ClassFeatures/Wizard/ArcaneWard";

/**
 * The cast level of a spell use moved between dnd5e versions: 5.2 flags it on the usage message,
 * 5.3 stores it on the message system data, and 6.0 records neither, leaving the chosen slot.
 */
describe("ArcaneWard.spellLevelFromUse", () => {
  const activity = { actor: { system: { spells: { spell3: { level: 3 }, pact: { level: 2 } } } } };

  it("reads the level dnd5e 5.3 stores on the message system data", () => {
    expect(ArcaneWard.spellLevelFromUse(activity, {}, { data: { system: { spellLevel: 4 } } })).toBe(4);
  });

  it("reads the usage flag dnd5e 5.2 sets", () => {
    expect(ArcaneWard.spellLevelFromUse(activity, {}, { data: { flags: { dnd5e: { use: { spellLevel: 2 } } } } })).toBe(2);
  });

  it("falls back to the level of the chosen slot", () => {
    expect(ArcaneWard.spellLevelFromUse(activity, { spell: { slot: "spell3" } }, { data: {} })).toBe(3);
    expect(ArcaneWard.spellLevelFromUse(activity, { spell: { slot: "pact" } }, { data: {} })).toBe(2);
  });

  it("has no level without a slot", () => {
    expect(ArcaneWard.spellLevelFromUse(activity, {}, { data: {} })).toBeUndefined();
  });
});

describe("ArcaneWard.preUpdateActorHook", () => {
  it("leaves a rest's temp HP reset alone", async () => {
    const getEnricher = vi.spyOn(ArcaneWard, "getEnricher");
    const subject = { classes: { wizard: { subclass: { name: "School of Abjuration" } } } };
    const update = { system: { attributes: { hp: { temp: 0 } } } };
    await expect(ArcaneWard.preUpdateActorHook(subject, update, { isRest: true }, "user")).resolves.toBe(true);
    expect(getEnricher).not.toHaveBeenCalled();
    getEnricher.mockRestore();
  });
});
