// @vitest-environment jsdom
// Pins the hand-written class and subclass scale values in the _fixes chains that no DDB
// levelScale drives, now built through AdvancementHelper.buildNumberScale / buildDiceScale.

// the class parsers sit in an import cycle with AdvancementHelper; loading the feature
// factory first resolves it the way the production entry point does
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBClass from "../../../src/parser/classes/DDBClass";
import DDBSubClass from "../../../src/parser/classes/DDBSubClass";
import AdvancementHelper from "../../../src/parser/advancements/AdvancementHelper";

function makeStub(name: string, { is2014 = false } = {}): any {
  const stub: any = {
    data: { name, system: { advancement: {} } },
    is2014,
    is2024: !is2014,
  };
  Object.defineProperty(stub, "_advancementData", {
    get() {
      return stub.data.system.advancement;
    },
  });
  stub._addAdvancement = DDBSubClass.prototype._addAdvancement;
  stub._addAdvancements = DDBSubClass.prototype._addAdvancements;
  return stub;
}

function scales(stub: any): Record<string, any> {
  return Object.fromEntries(
    (Object.values(stub.data.system.advancement) as any[])
      .filter((a) => a.type === "ScaleValue")
      .map((a) => [a.configuration.identifier, { name: a.name, type: a.configuration.type, scale: a.configuration.scale }]),
  );
}

describe("DDBClass scale fixes", () => {
  it("gives the 2024 rogue its Cunning Strike uses and Sneak Attack dice", () => {
    const stub = makeStub("Rogue");
    DDBClass.prototype._rogueFixes.call(stub);
    const result = scales(stub);
    expect(Object.keys(result)).toEqual(["cunning-strike-uses", "sneak-attack"]);
    expect(result["cunning-strike-uses"]).toEqual({ name: "Cunning Strike Uses", type: "number", scale: { 5: { value: 1 }, 11: { value: 2 } } });
    expect(result["sneak-attack"].type).toBe("dice");
    expect(result["sneak-attack"].scale["1"]).toEqual({ number: 1, faces: 6 });
    expect(result["sneak-attack"].scale["19"]).toEqual({ number: 10, faces: 6 });
    expect(Object.keys(result["sneak-attack"].scale)).toHaveLength(10);
  });

  it("does nothing for the 2014 rogue or another class", () => {
    const legacy = makeStub("Rogue", { is2014: true });
    DDBClass.prototype._rogueFixes.call(legacy);
    expect(legacy.data.system.advancement).toEqual({});
    const other = makeStub("Fighter");
    DDBClass.prototype._rogueFixes.call(other);
    expect(other.data.system.advancement).toEqual({});
  });

  it("builds one Focus Point per monk level from 2 to 20, named Ki Points in 2014", () => {
    const modern = makeStub("Monk");
    DDBClass.prototype._monkFixes.call(modern);
    const focus = scales(modern).focus;
    expect(focus.name).toBe("Focus Points");
    expect(Object.keys(focus.scale)).toHaveLength(19);
    expect(focus.type).toBe("usage");
    expect(focus.scale["2"]).toEqual({ value: 2, period: "sr" });
    expect(focus.scale["20"]).toEqual({ value: 20 });

    const legacy = makeStub("Monk", { is2014: true });
    DDBClass.prototype._monkFixes.call(legacy);
    expect(scales(legacy)["ki-points"].name).toBe("Ki Points");
  });

  it("adds Rage Damage only when the class did not already generate it", () => {
    const stub = makeStub("Barbarian", { is2014: true });
    DDBClass.prototype._barbarianFixes.call(stub);
    expect(scales(stub)["rage-damage"]).toEqual({ name: "Rage Damage", type: "number", scale: { 1: { value: 2 }, 9: { value: 3 }, 16: { value: 4 } } });

    const already = makeStub("Barbarian", { is2014: true });
    already._addAdvancement({ _id: "existingRage0000", type: "ScaleValue", name: "Rage Damage", configuration: { identifier: "rage-damage", type: "number", scale: {} } });
    DDBClass.prototype._barbarianFixes.call(already);
    expect(Object.keys(already.data.system.advancement)).toEqual(["existingRage0000"]);
  });

  it("builds the Bardic Inspiration die progression and the Pugilist Moxie pool", () => {
    const bard = makeStub("Bard");
    DDBClass.prototype._bardFixes.call(bard);
    expect(scales(bard)["inspiration"].scale).toEqual({
      1: { number: 1, faces: 6 }, 5: { number: 1, faces: 8 }, 10: { number: 1, faces: 10 }, 15: { number: 1, faces: 12 },
    });
    const pugilist = makeStub("Pugilist");
    DDBClass.prototype._pugilistFixes.call(pugilist);
    const moxie = scales(pugilist)["moxie"];
    expect(moxie.name).toBe("Moxie");
    expect(moxie.scale["2"]).toEqual({ value: 2 });
    expect(moxie.scale["20"]).toEqual({ value: 12 });
  });
});

describe("DDBSubClass scale fixes", () => {
  it("gives the Profane Soul its pact slot and pact level scales", () => {
    const stub = makeStub("Order of the Profane Soul");
    DDBSubClass.prototype._bloodHunterFixes.call(stub);
    const result = scales(stub);
    expect(result["pact-slots"]).toEqual({ name: "Pact Slots", type: "number", scale: { 3: { value: 1 }, 6: { value: 2 } } });
    expect(result["pact-level"]).toEqual({ name: "Pact Level", type: "number", scale: { 3: { value: 1 }, 7: { value: 2 }, 13: { value: 3 } } });
  });

  it("gives the Storm Herald its three aura scales with the sea aura as dice", () => {
    const stub = makeStub("Path of the Storm Herald");
    DDBSubClass.prototype._barbarianFixes.call(stub);
    const result = scales(stub);
    expect(Object.keys(result)).toEqual(["storm-aura-desert", "storm-aura-sea", "storm-aura-tundra"]);
    expect(result["storm-aura-desert"].scale["20"]).toEqual({ value: 6 });
    expect(result["storm-aura-sea"]).toEqual({
      name: "Storm Aura Sea", type: "dice",
      scale: { 3: { number: 1, faces: 6 }, 10: { number: 2, faces: 6 }, 15: { number: 3, faces: 6 }, 20: { number: 4, faces: 6 } },
    });
  });

  it("builds the Rune Knight uses and the Grim Harbinger damage dice", () => {
    const rune = makeStub("Rune Knight");
    DDBSubClass.prototype._fighterFixes.call(rune);
    expect(scales(rune)["rune-uses"]).toEqual({ name: "Rune Uses", type: "usage", scale: { 3: { value: 1, period: "sr" }, 15: { value: 2 } } });

    const grim = makeStub("Grim Harbinger");
    DDBSubClass.prototype._rangerFixes.call(grim);
    expect(scales(grim)["grim-damage"]).toEqual({ name: "Grim Damage Dice", type: "dice", scale: { 7: { number: 1, faces: 6 }, 15: { number: 2, faces: 6 } } });
  });

  it.each([1, 3])("starts the Hunt Domain Mark Prey dice at the level Mark Prey is granted (%i)", async (requiredLevel) => {
    const stub = makeStub("Hunt Domain");
    stub.classFeatures = [{ name: "Mark Prey", requiredLevel }];
    await DDBSubClass.prototype._clericFixes.call(stub);
    expect(scales(stub)["mark-prey-damage"]).toEqual({
      name: "Mark Prey Damage", type: "dice",
      scale: { [requiredLevel]: { number: 1, faces: 6 }, 7: { number: 2, faces: 6 }, 14: { number: 3, faces: 6 } },
    });
  });

  it.each([
    ["2024", 2190986],
    ["2014", 410],
  ])("grants the %s Soulknife its Psychic Blade weapon and drops the blade's ability choice", (_rules, subClassId) => {
    const stub = makeStub("Soulknife");
    const feature = { id: 1, name: "Psychic Blades", requiredLevel: 3 };
    stub.ddbClassDefinition = { id: subClassId };
    stub.classFeatures = [feature];
    stub._advancementMatches = { features: {} };
    stub.ownedFeatureAdvancements = new Map([[1, { feature, advancements: [{ _id: "choice", type: "ItemChoice" }, { _id: "trait", type: "Trait" }] }]]);
    stub._compendiums = { features: { index: [
      { uuid: "Compendium.world.features.Item.bladeOther", name: "Psychic Blade", type: "weapon", flags: { ddbimporter: { subClassId: 1 } } },
      { uuid: "Compendium.world.features.Item.bladesFeat", name: "Psychic Blades", type: "feat", flags: { ddbimporter: { subClassId } } },
      { uuid: "Compendium.world.features.Item.blade00000", name: "Psychic Blade", type: "weapon", flags: { ddbimporter: { subClassId } } },
    ] } };
    DDBSubClass.prototype._rogueFixes.call(stub);

    expect(stub.ownedFeatureAdvancements.get(1).advancements.map((a: any) => a.type)).toEqual(["Trait"]);
    const grants = (Object.values(stub.data.system.advancement) as any[]).filter((a) => a.type === "ItemGrant");
    expect(grants).toHaveLength(1);
    expect(grants[0].level).toBe(3);
    expect(grants[0].configuration.items.map((i: any) => i.uuid)).toEqual(["Compendium.world.features.Item.blade00000"]);
    expect(Object.values(stub._advancementMatches.features)).toEqual([{ "Psychic Blade": "Compendium.world.features.Item.blade00000" }]);
  });

  it("leaves a Soulknife with no munched Psychic Blade weapon without a grant", () => {
    const stub = makeStub("Soulknife");
    stub.ddbClassDefinition = { id: 2190986 };
    stub.classFeatures = [];
    stub._advancementMatches = { features: {} };
    stub.ownedFeatureAdvancements = new Map();
    stub._compendiums = { features: { index: [] } };
    DDBSubClass.prototype._rogueFixes.call(stub);
    expect(Object.keys(stub.data.system.advancement)).toHaveLength(0);
  });

  it("gives the Carver Guild its Close Quarters damage dice", () => {
    const carver = makeStub("Carver Guild");
    DDBSubClass.prototype._monsterHunterFixes.call(carver);
    expect(scales(carver)["close-quarters-damage"]).toEqual({
      name: "Close Quarters Damage", type: "dice",
      scale: { 3: { number: 2, faces: 6 }, 11: { number: 4, faces: 6 } },
    });
  });
});

describe("DDBClass SRD feature advancements", () => {
  function featureStub(name: string, features: string[], { level = 20, is2014 = false } = {}): any {
    const stub = makeStub(name, { is2014 });
    const held: Record<string, any[]> = {};
    Object.assign(stub, {
      ddbClass: { level },
      spellLinks: [],
      classFeatures: features.map((featureName, i) => ({ id: i + 1, name: featureName })),
      _addAdvancementToFeature: (featureName: string, advancement: any) => (held[featureName] ??= []).push(advancement),
      _capstoneAbilityAdvancement: DDBClass.prototype._capstoneAbilityAdvancement,
      _featureSpellGrant: DDBClass.prototype._featureSpellGrant,
    });
    return { stub, held };
  }

  it("puts the fixed +4 capstone on Primal Champion, recorded as applied at level 20", async () => {
    const { stub, held } = featureStub("Barbarian", ["Primal Champion"]);
    await DDBClass.prototype._srdFeatureAdvancements.call(stub);
    const [asi] = held["Primal Champion"];
    expect(asi).toMatchObject({ type: "AbilityScoreImprovement", level: 20, configuration: { cap: 4, max: 25, points: 0 } });
    expect(asi.configuration.fixed).toMatchObject({ str: 4, con: 4, dex: 0 });
    expect(asi.value.assignments).toEqual({ str: 4, con: 4 });

    const { stub: early, held: earlyHeld } = featureStub("Monk", ["Body and Mind"], { level: 19 });
    await DDBClass.prototype._srdFeatureAdvancements.call(early);
    expect(earlyHeld["Body and Mind"][0].configuration.fixed).toMatchObject({ dex: 4, wis: 4 });
    expect(earlyHeld["Body and Mind"][0].value.assignments).toBeUndefined();
  });

  it("grants Words of Creation, Contact Patron and Druidic spells on their features", async () => {
    const original = AdvancementHelper.getSpellGrantAdvancement;
    const calls: any[] = [];
    AdvancementHelper.getSpellGrantAdvancement = (async (args: any) => {
      calls.push(args);
      return { toObject: () => ({ type: "ItemGrant", name: args.name }) };
    }) as any;
    try {
      for (const [klass, feature] of [["Bard", "Words of Creation"], ["Warlock", "Contact Patron"], ["Druid", "Druidic"]]) {
        const { stub, held } = featureStub(klass, [feature]);
        await DDBClass.prototype._srdFeatureAdvancements.call(stub);
        expect(held[feature]).toEqual([{ type: "ItemGrant", name: feature }]);
      }
    } finally {
      AdvancementHelper.getSpellGrantAdvancement = original;
    }
    expect(calls.map((c) => c.spellGrants)).toEqual([
      [{ name: "Power Word Heal", level: 20 }, { name: "Power Word Kill", level: 20 }],
      [{ name: "Contact Other Plane", level: 9, amount: "1", period: "lr" }],
      [{ name: "Speak with Animals", level: 1 }],
    ]);
    expect(calls.every((c) => c.method === "spell" && c.prepared === 2 && c.requireSlot === false)).toBe(true);
  });

  it("adds none of them for a 2014 class", async () => {
    const { stub, held } = featureStub("Barbarian", ["Primal Champion"], { is2014: true });
    await DDBClass.prototype._srdFeatureAdvancements.call(stub);
    expect(held).toEqual({});
  });
});
