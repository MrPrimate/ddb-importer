import DDBCharacter from "../../../src/parser/DDBCharacter";
import "../../../src/parser/character/consumptionLinking";

function makeParent({
  id = "parentIdIIIIIIII",
  name = "Channel Divinity",
  type = "feat",
  identifier = "channel-divinity",
}: {
  id?: string;
  name?: string;
  type?: string;
  identifier?: string;
} = {}) {
  return {
    _id: id,
    name,
    type,
    flags: { ddbimporter: { originalName: name } },
    system: { identifier, uses: { max: "2", spent: 0 }, activities: {} },
  };
}

function makeChild({ flags = {}, spent = 1 }: { flags?: Record<string, any>; spent?: number | null } = {}) {
  return {
    _id: "childIdIIIIIIIII",
    name: "Harness Divine Power",
    type: "feat",
    flags: { ddbimporter: { originalName: "Harness Divine Power", ...flags } },
    system: {
      identifier: "harness-divine-power",
      uses: { max: "1", spent },
      activities: {
        ddbHarnessDivine: {
          _id: "ddbHarnessDivine",
          name: "Harness Divine Power",
          consumption: { targets: [] },
        },
      },
    },
  };
}

function makeFlagChild(targets: Record<string, any>[]) {
  return {
    _id: "kindredChildIIII",
    name: "Kindred Consumer",
    type: "feat",
    flags: {
      ddbimporter: {
        originalName: "Kindred Consumer",
        replaceActivityUses: true,
      },
    },
    system: {
      identifier: "kindred-consumer",
      uses: { max: "", spent: null },
      activities: {
        ddbKindredConsume: {
          _id: "ddbKindredConsume",
          name: "Spend Blood Point",
          consumption: { targets },
        },
      },
    },
  };
}

function makeLinkedSpell() {
  return {
    _id: "astralProjection",
    name: "Astral Projection",
    type: "spell",
    flags: {
      ddbimporter: {
        originalName: "Astral Projection",
        dndbeyond: { lookupName: "Empty Body" },
      },
    },
    system: {
      identifier: "astral-projection",
      uses: { max: "", spent: null },
      activities: {
        ddbAstralProject: {
          _id: "ddbAstralProject",
          name: "Cast",
          consumption: { targets: [] },
        },
      },
    },
  };
}

/** call the prototype method with a minimal actor stub rather than building a character */
async function runLinking(items: any[]) {
  const stub = {
    currentActor: { items: { toObject: () => items } },
  };
  return DDBCharacter.prototype._getAutoLinkActivityDictionaryUpdates.call(stub as unknown as DDBCharacter);
}

async function runFlagLinking(items: any[]) {
  const stub = {
    currentActor: { items: { toObject: () => items } },
  };
  return DDBCharacter.prototype._getAutoLinkActivityFlagDocUpdates.call(stub as unknown as DDBCharacter);
}

async function runSpellLinking(items: any[]) {
  const stub = {
    currentActor: { items: { toObject: () => items } },
  };
  return DDBCharacter.prototype._getAutoLinkActivityDictionarySpellLinkUpdates.call(
    stub as unknown as DDBCharacter,
  );
}

function flagTargets(updates: any[]) {
  return updates.find((update) => update._id === "kindredChildIIII")
    .system.activities.ddbKindredConsume.consumption.targets;
}

describe("consumption linking child uses", () => {

  it("blanks the child's own uses pool by default", async () => {
    const updates = await runLinking([makeParent(), makeChild()]);
    const update = updates.find((u) => u._id === "childIdIIIIIIIII") as any;
    expect(update.system.uses).toEqual({ spent: null, max: "" });
  });

  it("writes no uses update when retainChildUses is set", async () => {
    const updates = await runLinking([makeParent(), makeChild({ flags: { retainChildUses: true } })]);
    const update = updates.find((u) => u._id === "childIdIIIIIIIII") as any;
    expect(update.system.uses).toBeUndefined();
  });

  it("keeps the spent value when retainUseSpent is set, independently of retainChildUses", async () => {
    const updates = await runLinking([makeParent(), makeChild({ flags: { retainUseSpent: true }, spent: 2 })]);
    const update = updates.find((u) => u._id === "childIdIIIIIIIII") as any;
    expect(update.system.uses).toEqual({ spent: 2, max: "" });
  });

  it("finds a dictionary parent by its normalized identifier after it is renamed", async () => {
    const updates = await runLinking([
      makeParent({ name: "Renamed Divine Pool" }),
      makeChild(),
    ]);
    const update = updates.find((u) => u._id === "childIdIIIIIIIII") as any;
    expect(update.system.activities.ddbHarnessDivine.consumption.targets[0].target)
      .toBe("feat:channel-divinity");
  });

  it("uses the shared identifier formatter for dictionary spell links", async () => {
    const parent = makeParent({ name: "Renamed Focus Pool", identifier: "ki" });
    const updates = await runSpellLinking([parent, makeLinkedSpell()]);
    const update = updates.find((u) => u._id === "astralProjection") as any;
    expect(update.system.activities.ddbAstralProject.consumption.targets).toEqual([
      { target: "feat:ki", value: "8", type: "itemUses" },
    ]);
    expect(update.system.activities.ddbAstralProject.consumption.targets[0].target).not.toBe(parent._id);
  });

});

describe("identifier-safe flag consumption linking", () => {
  it.each([
    ["display name", "Blood Potency"],
    ["bare identifier", "blood-potency"],
    ["typed identifier", "feat:blood-potency"],
  ])("canonicalizes a %s without persisting an actor id", async (_label, target) => {
    const parent = makeParent({
      id: "bloodPotencyIdII",
      name: "Blood Potency",
      identifier: "blood-potency",
    });
    const updates = await runFlagLinking([
      parent,
      makeFlagChild([{ type: "itemUses", target, value: "1" }]),
    ]);
    expect(flagTargets(updates)[0].target).toBe("feat:blood-potency");
    expect(flagTargets(updates)[0].target).not.toBe(parent._id);
  });

  it("honours an explicit top-level item type when identifiers collide", async () => {
    const updates = await runFlagLinking([
      makeParent({ id: "spellPoolIIIIIII", name: "Spell Pool", type: "spell", identifier: "blood-potency" }),
      makeParent({ id: "featPoolIIIIIIII", name: "Feature Pool", type: "feat", identifier: "blood-potency" }),
      makeFlagChild([{ type: "itemUses", target: "feat:blood-potency", value: "1" }]),
    ]);
    expect(flagTargets(updates)[0].target).toBe("feat:blood-potency");
  });

  it.each([
    ["blood-potency", "blood-potency"],
    ["feat:blood-potency", "feat:blood-potency"],
    ["custom.package-type:blood-potency", "custom.package-type:blood-potency"],
    ["Blood Potency", "blood-potency"],
  ])("keeps an unresolved target portable: %s", async (target, expected) => {
    const updates = await runFlagLinking([
      makeFlagChild([{ type: "itemUses", target, value: "1" }]),
    ]);
    expect(flagTargets(updates)[0].target).toBe(expected);
  });

  it("leaves non-item consumption targets unchanged", async () => {
    const attributeTarget = {
      type: "attribute",
      target: "system.resources.primary.value",
      value: "1",
    };
    const updates = await runFlagLinking([
      makeParent({ name: "Blood Potency", identifier: "blood-potency" }),
      makeFlagChild([
        attributeTarget,
        { type: "itemUses", target: "blood-potency", value: "1" },
      ]),
    ]);
    expect(flagTargets(updates)).toEqual([
      attributeTarget,
      { type: "itemUses", target: "feat:blood-potency", value: "1" },
    ]);
  });
});

describe("activities an enricher made free", () => {

  function makeChildWithFreeActivity(flags: Record<string, any>) {
    const child = makeChild({ flags });
    child.system.activities = {
      ...child.system.activities,
      ddbEatFoodIIIIII: { _id: "ddbEatFoodIIIIII", name: "Eat Food", consumption: { targets: [] } },
    } as any;
    return child;
  }

  it("leaves an activity recorded by id unlinked and still links its siblings", async () => {
    const updates = await runLinking([makeParent(), makeChildWithFreeActivity({ ignoredConsumptionActivityIds: ["ddbEatFoodIIIIII"] })]);
    const update = updates.find((u) => u._id === "childIdIIIIIIIII") as any;
    expect(update.system.activities.ddbEatFoodIIIIII).toBeUndefined();
    expect(update.system.activities.ddbHarnessDivine.consumption.targets).toEqual([
      { type: "itemUses", value: "1", target: "feat:channel-divinity" },
    ]);
  });

  it("still honours activities ignored by name", async () => {
    const updates = await runLinking([makeParent(), makeChildWithFreeActivity({ ignoredConsumptionActivities: ["Eat Food"] })]);
    const update = updates.find((u) => u._id === "childIdIIIIIIIII") as any;
    expect(update.system.activities.ddbEatFoodIIIIII).toBeUndefined();
    expect(update.system.activities.ddbHarnessDivine).toBeDefined();
  });

  it("charges every activity when nothing is ignored", async () => {
    const updates = await runLinking([makeParent(), makeChildWithFreeActivity({})]);
    const update = updates.find((u) => u._id === "childIdIIIIIIIII") as any;
    expect(update.system.activities.ddbEatFoodIIIIII.consumption.targets[0].target).toBe("feat:channel-divinity");
  });

});

describe("spell links told apart by cast level", () => {

  function massSuggestion(id: string, castAtLevel?: number) {
    return {
      _id: id,
      name: "Mass Suggestion",
      type: "spell",
      flags: { ddbimporter: { originalName: "Mass Suggestion", dndbeyond: { lookupName: "Mass Manipulation", castAtLevel } } },
      system: {
        identifier: "mass-suggestion",
        uses: { max: "", spent: null },
        activities: { [`cast${id}`.slice(0, 16)]: { _id: `cast${id}`.slice(0, 16), name: "Cast", consumption: { targets: [] } } },
      },
    };
  }

  it("charges each Mass Manipulation copy its own Blood Point cost and renames the upcast ones", async () => {
    const pool = makeParent({ name: "Blood Potency", identifier: "blood-potency" });
    const copies = [massSuggestion("massBase00000000"), massSuggestion("massLevel7000000", 7), massSuggestion("massLevel9000000", 9)];
    const updates = await runSpellLinking([pool, ...copies]) as any[];
    const cost = (id: string) => {
      const update = updates.find((u) => u._id === id);
      return Object.values(update.system.activities as Record<string, any>)[0].consumption.targets[0].value;
    };
    expect(cost("massBase00000000")).toBe("3");
    expect(cost("massLevel7000000")).toBe("4");
    expect(cost("massLevel9000000")).toBe("6");
    expect(updates.find((u) => u._id === "massLevel9000000").name).toBe("Mass Suggestion (Level 9)");
    expect(updates.find((u) => u._id === "massBase00000000").name).toBeUndefined();
  });

});
