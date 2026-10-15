/**
 * A cross-section of the branchier equipment enrichers.
 *
 * Item enrichers are the least covered corner of the audit: the items suite
 * replays RAW muncher payloads, so `is2014` is fixed by whichever payload was
 * captured, and `documentStub` (which retypes an item entirely before parsing)
 * never shows up in the worksheet at all. As with the other audit suites, none
 * of it runs in CI.
 *
 * See ClassEnrichers.test.ts for why the barrel mocks below are needed and why
 * DDBDataUtils is filled in beforeAll rather than in the mock factory.
 */
const loggerMock = vi.hoisted(() => ({
  warn: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  verbose: vi.fn(),
}));

const parserLib = vi.hoisted(() => ({ DDBDataUtils: {} as any, DDBTemplateStrings: {} as any }));
const modules = vi.hoisted(() => ({ midiQolInstalled: true }));

vi.mock("../../../src/lib/_module", async () => ({
  logger: loggerMock,
  utils: (await vi.importActual<any>("../../../src/lib/Utils")).default,
  // Cannon resolves publisher book ids through it; its own imports are light
  // enough (config, Logger, Utils) not to re-enter the enricher tree.
  DDBSources: (await vi.importActual<any>("../../../src/lib/DDBSources")).default,
}));
vi.mock("../../../src/parser/spells/CharacterSpellFactory", () => ({ default: class {} }));
vi.mock("../../../src/parser/spells/DDBSpell", () => ({ default: class {} }));
vi.mock("../../../src/parser/lib/_module", () => parserLib);
vi.mock("../../../src/parser/enrichers/effects/_module", async () => ({
  AutoEffects: { effectModules: () => modules },
  EnchantmentEffects: {},
  ChangeHelper: (await vi.importActual<any>("../../../src/parser/enrichers/effects/ChangeHelper")).default,
  BehaviorHelper: (await vi.importActual<any>("../../../src/parser/enrichers/effects/BehaviorHelper")).default,
  EffectGenerator: {},
}));

import * as ItemEnrichers from "../../../src/parser/enrichers/item/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";
import { retributiveStrike, weaponDamageBonus } from "../../../src/parser/enrichers/item/_ItemActivities";

type TEnricher = new (options: any) => any;

beforeAll(async () => {
  // ChangeHelper's advantage/disadvantage getters read CONFIG.Dice.D20Roll.ADV_MODE
  installActivityConfigStubs();
  const { default: DDBDataUtils } = await import("../../../src/parser/lib/DDBDataUtils");
  for (const key of Object.getOwnPropertyNames(DDBDataUtils)) {
    if (typeof (DDBDataUtils as any)[key] === "function") {
      parserLib.DDBDataUtils[key] = (DDBDataUtils as any)[key].bind(DDBDataUtils);
    }
  }
  Object.assign(parserLib.DDBTemplateStrings, await import("../../../src/parser/lib/DDBTemplateStrings"));
});

function build(Enricher: TEnricher, options: Record<string, any> = {}): any {
  return makeEnricherData(Enricher, { name: "Test Item", ...options } as any);
}

describe("AlchemistsFire", () => {
  const Enricher = ItemEnrichers.AlchemistsFire;

  it("is a dex attack in 2014 and a dex save in 2024", () => {
    const legacy = build(Enricher, { is2014: true });
    expect(legacy.type).toBe("attack");
    expect(legacy.activity.data.attack).toMatchObject({ ability: "dex", type: { value: "ranged" } });
    expect(legacy.activity.data.save).toBeUndefined();

    const modern = build(Enricher);
    expect(modern.type).toBe("save");
    expect(modern.activity.data.save).toMatchObject({ ability: ["dex"], dc: { calculation: "dex" } });
    expect(modern.activity.data.attack).toBeUndefined();
  });

  it("consumes the flask in both rulesets but only 2024 survives being emptied", () => {
    expect(build(Enricher, { is2014: true }).activity.addItemConsume).toBe(true);
    expect(build(Enricher).activity.addItemConsume).toBe(true);
    expect(build(Enricher, { is2014: true }).override).toBeNull();
    // only autoDestroy: a whole uses override would drop the parsed max
    expect(build(Enricher).override).toEqual({ data: { system: { uses: { autoDestroy: false } } } });
  });

  it("adds the extinguish check only in 2014, where Burning does not exist", () => {
    expect(build(Enricher, { is2014: true }).additionalActivities[0].init.name).toBe("Extinguish Flames Check");
    expect(build(Enricher).additionalActivities).toBeNull();

    expect(build(Enricher, { is2014: true }).effects[0].statuses).toBeUndefined();
    expect(build(Enricher).effects[0].statuses).toEqual(["Burning"]);
  });
});

describe("PotionOfHealing", () => {
  const Enricher = ItemEnrichers.PotionOfHealing;

  it("is an action in 2014 and a bonus action in 2024", () => {
    expect(build(Enricher, { is2014: true }).activity.activationType).toBe("action");
    expect(build(Enricher).activity.activationType).toBe("bonus");
    expect(build(Enricher).type).toBe("heal");
  });

  it("forces the 2014 ruleset for a Player's Handbook (2014) printing", () => {
    // sourceId 1 is the 2014 PHB; DDB ships both printings under one name
    const phb2014 = build(Enricher, { ddbParser: { ddbDefinition: { sources: [{ sourceId: 1 }] } } });
    expect(phb2014.override.data["flags.ddbimporter"]).toEqual({ is2014: true, is2024: false });
    expect(phb2014.override.data.system.source.rules).toBe("2014");

    const other = build(Enricher, { ddbParser: { ddbDefinition: { sources: [{ sourceId: 145 }] } } });
    expect(other.override).toEqual({});
    // and no sources at all must not throw
    expect(build(Enricher, { ddbParser: { ddbDefinition: {} } }).override).toEqual({});
  });
});

describe("Cannon", () => {
  const Enricher = ItemEnrichers.Cannon;
  const withSources = (...sourceIds: number[]) =>
    build(Enricher, { ddbParser: { ddbDefinition: { sources: sourceIds.map((sourceId) => ({ sourceId })) } } });

  // "Cannon" is a name other publishers use too, so the enricher gates on the
  // DDB source. 164/197/281 are the Mage Hand Press books in category 32.
  it.each([164, 197, 281])("sets cannonballs for a Mage Hand Press cannon (source %i)", (sourceId) => {
    expect(withSources(sourceId).isMageHandPress).toBe(true);
    expect(withSources(sourceId).override).toEqual({ data: { "system.ammunition.type": "cannonballs" } });
  });

  it.each([2, 249])("leaves another publisher's cannon alone (source %i)", (sourceId) => {
    expect(withSources(sourceId).isMageHandPress).toBe(false);
    expect(withSources(sourceId).override).toEqual({});
  });

  it("matches when the publisher is one of several sources", () => {
    expect(withSources(2, 197).isMageHandPress).toBe(true);
  });

  it("does not throw when the item lists no sources", () => {
    expect(withSources().isMageHandPress).toBe(false);
    expect(build(Enricher, { ddbParser: { ddbDefinition: {} } }).override).toEqual({});
  });

  // foundry's mergeObject only expands dotted keys at depth 0, so nesting this
  // under a `system` object would write a literal "ammunition.type" key
  it("keeps the dotted path at the top level of data", () => {
    expect(Object.keys(withSources(197).override.data)).toEqual(["system.ammunition.type"]);
  });
});

describe("AirRender", () => {
  const Enricher = ItemEnrichers.AirRender;

  // Air Render is a shortbow that fires no ammunition, so the override clears
  // the type the weapon parser assigns.
  it("clears the ammunition type and the magical bonus", () => {
    expect(build(Enricher).override.data).toEqual({
      "system.magicalBonus": null,
      "system.ammunition.type": "",
    });
  });

  // Regression: both were nested under a `system` object, where mergeObject
  // does not expand them. The item kept its parser assigned ammunition type
  // (arrow) and gained a literal "ammunition.type" property instead.
  it("keeps dotted paths at the top level of data", () => {
    const data = build(Enricher).override.data;
    expect(data.system).toBeUndefined();
    for (const key of Object.keys(data)) expect(key.startsWith("system.")).toBe(true);
  });
});

describe("JavelinOfLightning", () => {
  const Enricher = ItemEnrichers.JavelinOfLightning;

  it("clears the DDB uses and keeps the item from self-destructing", () => {
    for (const is2014 of [true, false]) {
      const override = build(Enricher, { is2014 }).override;
      expect(override.retainUseSpent).toBe(true);
      expect(override.data.system.uses).toMatchObject({ max: "", recovery: [], autoDestroy: false });
    }
  });

  it("only 2024 restates the base damage as piercing plus lightning", () => {
    expect(build(Enricher, { is2014: true }).override.data.system.damage).toBeUndefined();
    expect(build(Enricher).override.data.system.damage.base).toMatchObject({
      number: 1,
      denomination: 6,
      types: ["piercing", "lightning"],
    });
  });

  it("adds the lightning bolt without the auto-generated activities", () => {
    const e = build(Enricher);
    expect(e.additionalActivities.map((a: any) => a.init?.name ?? a.action?.name)).toContain("Lightning Bolt");
    expect(e.addAutoAdditionalActivities).toBe(false);
    expect(e.activity.noConsumeTargets).toBe(true);
  });
});

describe("WandOfOrcus", () => {
  const Enricher = ItemEnrichers.WandOfOrcus;

  it("retypes the wand into a mace before parsing", () => {
    // documentStub runs ahead of the normal item pipeline and never appears in
    // the audit worksheet, so nothing else asserts this retype
    const stub = build(Enricher).documentStub;
    expect(stub).toMatchObject({
      documentType: "weapon",
      parsingType: "weapon",
      replaceDefaultActivity: true,
      systemType: { value: "simpleM", baseItem: "mace" },
    });
    expect(stub.copySRD.uuid).toBe("Compendium.dnd5e.items.Item.Ajyq6nGwF7FtLhDQ");
  });

  it("adds the attunement save and suppresses the auto activities", () => {
    const e = build(Enricher);
    expect(e.additionalActivities.map((a: any) => a.init.name)).toContain("Save vs Attunement");
    expect(e.addAutoAdditionalActivities).toBe(false);
  });
});

describe("MistypedCrossbow", () => {
  const Enricher = ItemEnrichers.MistypedCrossbow;

  // DDB source 225 ships these with type "Ammunition" and no damage, range,
  // properties or category, so they import as consumable ammo without the stub
  it.each([
    ["Silent Hand Crossbow", "martialR", "handcrossbow", "Compendium.dnd5e.equipment24.Item.phbwepHandCrossb"],
    ["Silent Heavy Crossbow", "martialR", "heavycrossbow", "Compendium.dnd5e.equipment24.Item.phbwepHeavyCross"],
    ["Silent Light Crossbow", "simpleR", "lightcrossbow", "Compendium.dnd5e.equipment24.Item.phbwepLightCross"],
    ["Ghaal'Shaarat Hand Crossbow +3", "martialR", "handcrossbow", "Compendium.dnd5e.equipment24.Item.phbwepHandCrossb"],
    ["Ghaal'Shaarat Light Crossbow +1", "simpleR", "lightcrossbow", "Compendium.dnd5e.equipment24.Item.phbwepLightCross"],
  ])("retypes %s into a weapon with the right base", (name, systemType, baseItem, uuid) => {
    const stub = build(Enricher, { name, ddbParser: { originalName: name } }).documentStub;
    expect(stub).toMatchObject({
      documentType: "weapon",
      parsingType: "weapon",
      systemType: { value: systemType, baseItem },
    });
    expect(stub.copySRD.uuid).toBe(uuid);
  });

  it("copies the 2014 crossbow for legacy content", () => {
    const name = "Ghaal'Shaarat Heavy Crossbow +2";
    const stub = build(Enricher, { name, is2014: true, ddbParser: { originalName: name } }).documentStub;
    expect(stub.copySRD.uuid).toBe("Compendium.dnd5e.items.Item.RmP0mYRn2J7K26rX");
  });

  it("leaves a weapon that is not a crossbow alone", () => {
    const name = "Ghaal'Shaarat Longsword +1";
    expect(build(Enricher, { name, ddbParser: { originalName: name } }).documentStub).toBeNull();
  });
});

describe("GhaalShaaratWeapon", () => {
  const Enricher = ItemEnrichers.GhaalShaaratWeapon;

  function applyOverride(name: string, doc: any): any {
    const e = build(Enricher, { name, ddbParser: { originalName: name } });
    e.override.func({ enricher: { data: doc } });
    return doc;
  }

  function weaponDoc(value: string, properties: string[], range: any): any {
    return { type: "weapon", system: { type: { value, baseItem: "" }, properties, range } };
  }

  // every ghaal'shaarat has the Returning Weapon trait, none of the DDB
  // definitions carry the Thrown property
  it("adds thrown and returning to a melee weapon, with the 30/120 thrown range", () => {
    const doc = applyOverride(
      "Ghaal'Shaarat Longsword +1",
      weaponDoc("martialM", ["ver", "mgc"], { value: 5, long: null, units: "ft", reach: null }),
    );
    expect(doc.system.properties).toEqual(["ver", "mgc", "thr", "ret"]);
    expect(doc.system.range).toEqual({ value: 30, long: 120, units: "ft", reach: null });
  });

  it("keeps the longer range of a ranged weapon", () => {
    const doc = applyOverride(
      "Ghaal'Shaarat Longbow +2",
      weaponDoc("martialR", ["amm", "hvy", "two"], { value: 150, long: 600, units: "ft", reach: null }),
    );
    expect(doc.system.properties).toEqual(["amm", "hvy", "two", "thr", "ret"]);
    expect(doc.system.range).toEqual({ value: 150, long: 600, units: "ft", reach: null });
  });

  it("still retypes the crossbow variants DDB entered as ammunition", () => {
    const name = "Ghaal'Shaarat Hand Crossbow +1";
    const stub = build(Enricher, { name, ddbParser: { originalName: name } }).documentStub;
    expect(stub).toMatchObject({ documentType: "weapon", systemType: { baseItem: "handcrossbow" } });
  });
});

describe("EldritchClawTattoo", () => {
  it("pairs the Eldritch Maul activity with an effect of the same name", () => {
    // the effect is matched to the activity by name, so a rename in one place
    // orphans the other
    const e = build(ItemEnrichers.EldritchClawTattoo);
    const activityNames = e.additionalActivities.map((a: any) => a.init?.name ?? a.action?.name);
    expect(activityNames).toContain("Eldritch Maul");
    expect(e.effects.map((effect: any) => effect.name)).toContain("Eldritch Maul");
  });
});

describe("ArrowCatchingShield", () => {
  it("keeps the ranged AC bonus as a standing transfer effect the reaction does not apply", () => {
    const hints = build(ItemEnrichers.ArrowCatchingShield).effects;
    for (const hint of hints) {
      expect(hint.activityMatch).toBeUndefined();
      expect(hint.options).toMatchObject({ transfer: true, durationSeconds: null, expiry: null });
    }
    const [ac5e, manual] = hints;
    expect(ac5e.ac5eOnly).toBe(true);
    expect(ac5e.changes).toBeUndefined();
    expect(ac5e.ac5eChanges[0]).toMatchObject({
      key: "flags.automated-conditions-5e.modifyAC",
      value: "bonus=2; actionType.rwak || actionType.rsak",
    });
    // a live flat bonus would also count against melee attacks
    expect(manual.ac5eNever).toBe(true);
    expect(manual.options.disabled).toBe(true);
    expect(manual.changes[0]).toMatchObject({ key: "system.attributes.ac.bonus", value: "2" });
  });
});

describe("granted fly speeds go to whoever uses the item, not whoever carries it", () => {
  it("Broom of Flying applies Riding Broom from Mount Broom and leaves it open-ended", () => {
    const e = build(ItemEnrichers.BroomOfFlying);
    expect(e.type).toBe("utility");
    expect(e.activity).toMatchObject({ name: "Mount Broom", targetType: "self", activationType: "action" });
    // an applied effect with no expiry would otherwise inherit a counted activity duration
    expect(e.activity.data.duration.units).toBe("spec");
    expect(build(ItemEnrichers.BroomOfFlying, { is2014: true }).activity.activationType).toBe("special");
    expect(e.additionalActivities.map((a: any) => a.init.name)).toEqual(["Send Alone or Recall"]);
    // DDB's unconditional "set flying speed" modifier must not survive as a passive effect
    expect(e.clearAutoEffects).toBe(true);
    expect(e.effects).toHaveLength(1);
    expect(e.effects[0]).toMatchObject({
      activityMatch: "Mount Broom",
      statuses: ["Flying"],
      options: { transfer: false, durationSeconds: null, expiry: null },
    });
    expect(e.effects[0].changes.map((c: any) => [c.key, c.value])).toEqual([
      ["system.attributes.movement.speeds.fly", "50"],
      ["system.attributes.movement.hover", "true"],
    ]);
  });

  it("Pixie Dust spends the packet to give one creature fly 30 and hover for a minute", () => {
    const e = build(ItemEnrichers.PixieDust);
    expect(e.type).toBe("utility");
    expect(e.activity).toMatchObject({ name: "Sprinkle Dust", targetType: "creature", addItemConsume: true });
    expect(e.activity.data.range).toMatchObject({ value: "5", units: "ft" });
    expect(e.activity.data.duration).toMatchObject({ value: "1", units: "minute" });
    expect(e.clearAutoEffects).toBe(true);
    expect(e.effects[0].options).toMatchObject({ transfer: false, durationSeconds: 60 });
    expect(e.effects[0].changes.map((c: any) => [c.key, c.value])).toEqual([
      ["system.attributes.movement.speeds.fly", "30"],
      ["system.attributes.movement.hover", "true"],
    ]);
  });
});

describe("FlameTongue", () => {
  const Enricher = ItemEnrichers.FlameTongue;
  const fireMod = (restriction: string, diceString = "2d6") => ({
    ddbParser: {
      ddbDefinition: { grantedModifiers: [{ type: "damage", subType: "fire", dice: { diceString }, restriction }] },
    },
  });

  it("sets the blade ablaze with a self enchantment in place of the parser's restricted attack", () => {
    const e = build(Enricher, fireMod("While Flaming"));
    expect(e.addAutoAdditionalActivities).toBe(false);
    expect(e.additionalActivities).toHaveLength(1);
    const engulf = e.additionalActivities[0];
    expect(engulf.init).toMatchObject({ name: "Engulf in Flames", type: "enchant" });
    expect(engulf.overrides).toMatchObject({ noeffect: false, activationType: "bonus" });
    expect(engulf.overrides.data.enchant).toEqual({ self: true });
    // a counted duration would be stamped onto the open-ended enchantment
    expect(engulf.overrides.data.duration.units).toBe("spec");
  });

  it("adds DDB's fire dice through the enchantment and carries the light as a transferring rider", () => {
    const [ablaze, light] = build(Enricher, fireMod("While the sword is ablaze", "3d6")).effects;
    expect(ablaze).toMatchObject({ type: "enchant", activityMatch: "Engulf in Flames" });
    expect(ablaze.changes.map((c: any) => [c.key, c.value])).toEqual([
      ["name", "{} (Ablaze)"],
      ["system.damage.parts", "[[\"3d6\", \"fire\"]]"],
      // the toggle's next use removes the enchantment, so it reads as the way to put the flames out
      ["activities[enchant].name", "Extinguish Flames"],
    ]);
    expect(ablaze.data.flags.ddbimporter.effectRiders).toEqual([light.data._id]);
    expect(ablaze.options.showIcon).toBe(2);
    expect(light.options.showIcon).toBeUndefined();

    expect(light.options.transfer).toBe(true);
    expect(light.activityMatch).toBeUndefined();
    expect(light.tokenChanges.slice(0, 2).map((c: any) => [c.key, c.type, c.value])).toEqual([
      ["token.light.bright", "upgrade", "40"],
      ["token.light.dim", "upgrade", "80"],
    ]);
  });

  it("strips the fire dice the parser bakes into the attack only when DDB leaves them unrestricted", () => {
    const parts = () => [
      { number: 1, denomination: 8, types: ["radiant"] },
      { number: 2, denomination: 6, types: ["fire"] },
    ];

    const baked = { damage: { parts: parts() } };
    build(Enricher, fireMod("")).activity.func({ activity: baked });
    expect(baked.damage.parts).toEqual([{ number: 1, denomination: 8, types: ["radiant"] }]);

    const restricted = { damage: { parts: parts() } };
    build(Enricher, fireMod("While Flaming")).activity.func({ activity: restricted });
    expect(restricted.damage.parts).toHaveLength(2);
  });

  it("falls back to 2d6 when the payload has no fire modifier", () => {
    expect(build(Enricher).flameDice).toBe("2d6");
  });
});

describe("hazard gear regions", () => {
  it("Caltrops place a region that fires a save carrying the speed rider", () => {
    const e = build(ItemEnrichers.Caltrops);
    expect(e.type).toBe("utility");
    expect(e.activity.data.behaviors[0].config.events).toEqual(["tokenEnter"]);
    expect(e.activity.data.behaviors[0].config.args.activityName).toBe("Caltrops Save");
    const save = e.additionalActivities[0];
    expect(save.init).toEqual({ name: "Caltrops Save", type: "save" });
    expect(save.build.saveOverride.dc.formula).toBe("15");
    expect(save.build.generateConsumption).toBe(false);
    expect(save.overrides.data.damage.onSave).toBe("none");
    // applied by the save the region fires, never passively to whoever carries the bag
    expect(e.effects[0]).toMatchObject({ activityMatch: "Caltrops Save", options: { transfer: false } });
    expect(e.effects[0].changes[0].key).toBe("system.attributes.movement.multiplier");
    expect(build(ItemEnrichers.Caltrops, { is2014: true }).effects[0].changes[0].key).toBe("system.attributes.movement.bonus");
  });

  it("Ball Bearings place a region that fires a prone save", () => {
    const e = build(ItemEnrichers.BallBearings);
    expect(e.type).toBe("utility");
    expect(e.activity.data.behaviors[0].config.events).toEqual(["tokenEnter"]);
    expect(e.activity.data.behaviors[0].config.args.activityName).toBe("Ball Bearings Save");
    expect(e.additionalActivities[0].init).toEqual({ name: "Ball Bearings Save", type: "save" });
    expect(e.additionalActivities[0].build.saveOverride.dc.formula).toBe("10");
    expect(e.effects[0]).toMatchObject({ activityMatch: "Ball Bearings Save", statuses: ["Prone"], options: { transfer: false } });
  });

  it("Oil pours without burning; lighting it places the 2-round fire that burns on entry or turn end", () => {
    const e = build(ItemEnrichers.Oil);
    expect(e.activity).toMatchObject({ name: "Douse a Space", addItemConsume: true, noTemplate: true });
    expect(e.activity.data.behaviors).toBeUndefined();
    expect(e.additionalActivities.map((a: any) => a.init.name)).toEqual(["Light the Oil", "Burning Oil Damage", "Douse a Creature"]);
    const [light] = e.additionalActivities;
    expect(light.init.type).toBe("utility");
    expect(light.build.targetOverride.template).toMatchObject({ type: "square", size: "5" });
    expect(light.build.durationOverride).toMatchObject({ value: "2", units: "round" });
    const macro = light.overrides.data.behaviors.find((b: any) => b.type === "ddbMacro");
    expect(macro.config).toMatchObject({ events: ["tokenEnter", "tokenTurnEnd"], enterOn: "movement", args: { activityName: "Burning Oil Damage" } });
  });
});

describe("MoonSickle", () => {
  it("limits the healing die to spells, cantrips included", () => {
    const effects = build(ItemEnrichers.MoonSickle).effects;
    expect(effects[0].changes).toEqual([
      expect.objectContaining({ key: "healing", value: "1d4", type: "dnd5e.bonus" }),
    ]);
    // "when you cast a spell that restores hit points": Lay on Hands and potions are not spells,
    // and only a spell carries item.level, so the filter is a positive test on that
    expect(JSON.parse(effects[0].changes[0].conditions)).toEqual({ k: "item.level", o: "gte", v: 0 });
  });
});

/**
 * Unarmed magic items split two ways. A plain numeric bonus is a rule change gated on the attack
 * classification, which needs no enchantment and no user action. Anything that changes the strike
 * itself - its die, its damage type, or making it magical - can only be an enchantment, because a
 * rule change cannot mutate another item.
 */
describe("unarmed magic items", () => {
  const unarmed = { k: "roll.attack.classification", o: "in", v: ["unarmed", "natural"] };

  it("gives Wraps of Dyamak a bonus per vestige state", () => {
    for (const [name, bonus] of [["Wraps of Dyamak (Dormant)", "1"], ["Wraps of Dyamak (Awakened)", "2"],
      ["Wraps of Dyamak (Exalted)", "3"], ["Wraps of Dyamak", "3"]] as const) {
      const changes = build(ItemEnrichers.WrapsOfDyamak, { name }).effects[0].changes ?? [];
      expect(changes.map((c: any) => `${c.key}:${c.value}`)).toEqual([`attack:${bonus}`, `damage:${bonus}`]);
      for (const change of changes) expect(JSON.parse(String(change.conditions))).toEqual(unarmed);
    }
  });

  it("scales the Broodslinger spikes by rarity and types the damage", () => {
    for (const [name, damage] of [["Broodslinger (Uncommon)", "1"], ["Broodslinger (Rare)", "1d4"],
      ["Broodslinger (Very Rare)", "2d4"], ["Broodslinger", "1"]] as const) {
      const changes = build(ItemEnrichers.Broodslinger, { name }).effects[0].changes ?? [];
      expect(changes).toEqual([
        expect.objectContaining({ key: "damage", value: `${damage}[piercing]`, type: "dnd5e.bonus" }),
      ]);
      expect(JSON.parse(String(changes[0].conditions))).toEqual(unarmed);
    }
  });

  it("splits Demon Padded Armor between a rule and an enchantment", () => {
    const enricher = build(ItemEnrichers.DemonArmor, { name: "Demon Padded Armor" });
    const [bonusEffect, enchantEffect] = enricher.effects;

    // the +1 needs no user action
    expect((bonusEffect.changes ?? []).map((c: any) => `${c.key}:${c.value}`)).toEqual(["attack:1", "damage:1"]);
    expect(JSON.parse(String(bonusEffect.changes[0].conditions))).toEqual(unarmed);

    // the 1d8 slashing rewrites the strike, which only an enchantment can do
    expect(enchantEffect.type).toBe("enchant");
    expect((enchantEffect.changes ?? []).map((c: any) => `${c.key}=${c.value}`)).toEqual([
      "system.damage.base.number=1",
      "system.damage.base.denomination=8",
      "system.damage.base.custom.enabled=false",
      "system.damage.base.types=slashing",
      "system.damage.base.types=-bludgeoning",
    ]);
    // the Unarmed Strike item's weapon type is "natural", which is what the restriction matches
    expect(enricher.activity.data.restrictions).toMatchObject({ type: "weapon", categories: ["natural"] });
  });

  it("makes the Hypnovulfen bite an enchantment, not a bonus", () => {
    const effects = build(ItemEnrichers.HypnovulfenFigure, { name: "Hypnovulfen Figure" }).effects;
    expect(effects).toHaveLength(1);
    expect(effects[0].type).toBe("enchant");
    expect((effects[0].changes ?? []).map((c: any) => c.value)).toContain("piercing");
  });

  it("adds a damage type option to the elemental potions without losing the drink", () => {
    for (const [name, type] of [["Salamander Sauce", "fire"], ["Last Rites Rum", "necrotic"]] as const) {
      const enricher = build(ItemEnrichers.UnarmedElementalPotion, { name });
      // the enchantment is an additional activity, so the parsed self-damage activity survives
      const [additional] = enricher.additionalActivities;
      expect(additional.init).toMatchObject({ name: expect.stringContaining("Empower Unarmed Strikes"), type: "enchant" });
      expect(additional.overrides.data.restrictions).toMatchObject({ categories: ["natural"] });

      const [effect] = enricher.effects;
      expect(effect.type).toBe("enchant");
      expect(effect.options.durationSeconds).toBe(3600);
      // an added type is an extra option at roll time, the Sacred Weapon idiom
      expect(effect.changes).toEqual([
        expect.objectContaining({ key: "system.damage.base.types", value: type, type: "add" }),
      ]);
    }
  });

  it("gives Shepherd's Bane a timed claw enchantment", () => {
    const enricher = build(ItemEnrichers.ShepherdsBane, { name: "Shepherd’s Bane" });
    expect(enricher.effects[0].type).toBe("enchant");
    expect(enricher.effects[0].options.durationSeconds).toBe(3600);
    expect((enricher.effects[0].changes ?? []).map((c: any) => c.value)).toContain("slashing");
  });
});

// The item parser carries at most one save and parses no checks at all, so an
// item describing a second roll needs an enricher to build it. See
// docs/multi-roll-items.md for the rest of the candidates.
describe("items with more than one roll", () => {
  it("gives Muscle Graft both of its Constitution saves", () => {
    const enricher = build(ItemEnrichers.MuscleGraft, { name: "Muscle Graft" });

    // DDB writes this one as a "save" rather than a "saving throw"
    expect(enricher.activity.name).toBe("Attunement Save");
    expect(enricher.activity.data.save).toMatchObject({ ability: ["con"], dc: { formula: "15" } });

    expect(enricher.additionalActivities).toHaveLength(1);
    const curse = enricher.additionalActivities[0];
    expect(curse.init.name).toBe("Curse: Weekly Save");
    expect(curse.build.saveOverride).toMatchObject({ ability: ["con"], dc: { formula: "10" } });

    // the failed attunement save costs 2 Constitution; the minimum of 1 is manual
    expect(enricher.effects[0]).toMatchObject({ activityMatch: "Attunement Save" });
    expect(enricher.effects[0].changes).toEqual([
      expect.objectContaining({ key: "system.abilities.con.value", value: "-2" }),
    ]);
  });

  it("puts the Sugarbomb's bite check in front of its nausea save", () => {
    const enricher = build(ItemEnrichers.EverlastingSugarbomb, { name: "Everlasting Sugarbomb" });

    expect(enricher.type).toBe("check");
    // check.ability is a single StringField, so the "or Constitution" half of the
    // choice lives in the activation condition
    expect(enricher.activity.data.check).toMatchObject({ ability: "str", dc: { formula: "25" } });
    expect(enricher.activity.activationCondition).toContain("Constitution");

    expect(enricher.additionalActivities[0].init.name).toBe("Nausea Save");
    expect(enricher.additionalActivities[0].build.saveOverride).toMatchObject({
      ability: ["con"],
      dc: { formula: "16" },
    });
    expect(enricher.effects[0]).toMatchObject({
      statuses: ["Poisoned"],
      activityMatch: "Nausea Save",
      options: { durationSeconds: 60 },
    });
  });

  it("builds the Sphere of Annihilation's SRD activity set", () => {
    const enricher = build(ItemEnrichers.SphereOfAnnihilation, { name: "Sphere of Annihilation" });

    // the Dexterity save and its damage differ between printings and both parse
    // correctly, so the enricher only names it - and strips the template the parser
    // reads out of the planar-portal table's "180 feet of the sphere"
    expect(enricher.activity).toMatchObject({
      name: "Touched by the Sphere",
      activationCondition: "A creature's space the sphere enters",
      noTemplate: true,
    });

    expect(enricher.additionalActivities.map((a: any) => a.init.name))
      .toEqual(["Engulfed", "Control the Sphere"]);

    const [engulfed, control] = enricher.additionalActivities;
    expect(engulfed.init.type).toBe("damage");
    expect(control.init.type).toBe("check");
    expect(control.build.checkOverride).toMatchObject({
      ability: "int",
      associated: ["arc"],
      dc: { formula: "25" },
    });
  });

  it("doubles the sphere's touch damage for the 2024 reprint", () => {
    const legacy = build(ItemEnrichers.SphereOfAnnihilation, { name: "Sphere of Annihilation", is2014: true });
    const modern = build(ItemEnrichers.SphereOfAnnihilation, { name: "Sphere of Annihilation", is2014: false });

    expect(legacy.additionalActivities[0].build.damageParts[0]).toMatchObject({ number: 4, denomination: 10 });
    expect(modern.additionalActivities[0].build.damageParts[0]).toMatchObject({ number: 8, denomination: 10 });
  });

  it("builds the Bag of Beans' SRD activity set", () => {
    const enricher = build(ItemEnrichers.BagOfBeans, { name: "Bag of Beans" });

    // the parser reads the DC 15 save but scoops the d100 table's dice in with it
    expect(enricher.activity.name).toBe("Dump Beans");
    expect(enricher.activity.removeDamageParts).toBe(true);
    expect(enricher.activity.damageParts).toHaveLength(1);
    expect(enricher.activity.data.damage.onSave).toBe("half");
    expect(enricher.activity.data.target.template).toMatchObject({ type: "sphere", size: "10" });

    expect(enricher.additionalActivities.map((a: any) => a.init.name)).toEqual(["Count Beans", "Plant Bean"]);
    // a negative consumption ADDS uses: rolling Count Beans sets the bean count
    expect(enricher.additionalActivities[0].overrides.data.consumption.targets[0])
      .toMatchObject({ type: "itemUses", value: "-3d4" });
    // the bag starts empty so Count Beans' negative consumption can set the count
    expect(enricher.override.uses).toMatchObject({ spent: 12, max: "12" });

    // the table-derived "Damage" activity the parser would otherwise add
    expect(enricher.addAutoAdditionalActivities).toBe(false);
  });

  it("burns for fire in 2014 and force in the 2024 reprint", () => {
    const legacy = build(ItemEnrichers.BagOfBeans, { name: "Bag of Beans", is2014: true });
    const modern = build(ItemEnrichers.BagOfBeans, { name: "Bag of Beans", is2014: false });

    expect(legacy.activity.damageParts[0].types).toEqual(["fire"]);
    expect(modern.activity.damageParts[0].types).toEqual(["force"]);
  });

  it("explodes for 5d4 however many beans are dumped", () => {
    const legacy = build(ItemEnrichers.BagOfBeans, { name: "Bag of Beans", is2014: true });
    const modern = build(ItemEnrichers.BagOfBeans, { name: "Bag of Beans", is2014: false });

    for (const enricher of [legacy, modern]) {
      expect(enricher.activity.damageParts[0]).toMatchObject({ number: 5, denomination: 4, scaling: { mode: "none" } });
    }
    // 2014 dumps the whole bag; the 2024 reprint picks how many beans to dump
    expect(legacy.activity).toMatchObject({ addItemConsume: true, itemConsumeValue: "@item.uses.value" });
    expect(legacy.activity.addScalingMode).toBeUndefined();
    expect(modern.activity).toMatchObject({
      addItemConsume: true,
      itemConsumeValue: 1,
      addScalingMode: "amount",
      addConsumptionScalingMax: "@item.uses.value",
    });
  });

  it("makes the Rod of Lordly Might a +3 mace with separately recovering properties", () => {
    const legacy = build(ItemEnrichers.RodOfLordlyMight, { name: "Rod of Lordly Might", is2014: true });
    const modern = build(ItemEnrichers.RodOfLordlyMight, { name: "Rod of Lordly Might", is2014: false });

    for (const enricher of [legacy, modern]) {
      expect(enricher.documentStub).toMatchObject({
        documentType: "weapon",
        parsingType: "weapon",
        replaceDefaultActivity: true,
        systemType: { value: "simpleM", baseItem: "mace" },
      });
      // the 2014 item has no magic bonus modifier, only the text
      expect(enricher.override.data["system.magicalBonus"]).toBe(3);
      // the shared item use the parser reads from the text is cleared
      expect(enricher.override.uses).toMatchObject({ max: "", recovery: [] });
    }
    expect(modern.type).toBe("attack");
    expect(modern.activity).toMatchObject({ name: "Mace", noConsumeTargets: true });

    const byName = (enricher: any) => Object.fromEntries(
      enricher.additionalActivities.map((a: any) => [a.init.name, a]),
    );
    const legacyActivities = byName(legacy);
    const modernActivities = byName(modern);

    expect(modernActivities["Drain Life"].build).toMatchObject({
      includeBaseDamage: false,
      onSave: "none",
      saveOverride: { ability: ["con"], dc: { formula: "17" } },
      usesOverride: { max: "1", recovery: [{ period: "dawn", type: "recoverAll" }] },
      activationOverride: { type: "special" },
    });
    expect(modernActivities["Drain Life"].build.damageParts[0]).toMatchObject({ number: 4, denomination: 6, types: ["necrotic"] });
    expect(modernActivities["Drain Life"].overrides.addActivityConsume).toBe(true);

    // the button forms are attacks, not limited properties
    for (const name of ["Button 1: Flame Tongue", "Button 2: Battleaxe", "Button 3: Spear"]) {
      expect(modernActivities[name].init.type, name).toBe("attack");
      expect(modernActivities[name].overrides.noConsumeTargets, name).toBe(true);
      expect(modernActivities[name].overrides.addActivityConsume, name).toBeUndefined();
    }
    // dnd5e adds the rod's +3 to every attack roll; the flame tongue blade is not a +3 weapon,
    // so it rolls flat with the rod's proficiency written back in
    const flameTongue = modernActivities["Button 1: Flame Tongue"].overrides.data;
    expect(flameTongue.attack).toMatchObject({ flat: true, bonus: "@mod + @item.prof" });
    expect(flameTongue.damage.parts.map((p: any) => p.types[0])).toEqual(["slashing", "fire"]);
    expect(flameTongue.damage.parts[0].bonus).toBe("@mod");
    const battleaxe = modernActivities["Button 2: Battleaxe"].overrides.data;
    expect(battleaxe.attack.flat).toBeUndefined();
    expect(battleaxe.attack.bonus).toBeUndefined();
    expect(modernActivities["Button 3: Spear"].overrides.data.damage.parts[0])
      .toMatchObject({ number: 1, denomination: 6, bonus: "@mod + @item.magicalBonus", types: ["piercing"] });

    // Paralyze is a Strength save in 2014 and a Constitution save in 2024
    expect(legacyActivities.Paralyze.build.saveOverride.ability).toEqual(["str"]);
    expect(modernActivities.Paralyze.build.saveOverride.ability).toEqual(["con"]);
    for (const name of ["Paralyze", "Terrify"]) {
      expect(modernActivities[name].build.usesOverride, name).toMatchObject({ max: "1" });
      expect(modernActivities[name].overrides.addActivityConsume, name).toBe(true);
    }
    expect(modernActivities.Paralyze.build.activationOverride.type).toBe("special");
  });

  it("splits the Staff of Thunder and Lightning into separately recovering properties", () => {
    const legacy = build(ItemEnrichers.StaffOfThunderAndLightning, { name: "Staff of Thunder and Lightning", is2014: true });
    const modern = build(ItemEnrichers.StaffOfThunderAndLightning, { name: "Staff of Thunder and Lightning", is2014: false });

    expect(modern.clearAutoEffects).toBe(true);
    expect(modern.override.uses).toMatchObject({ max: "", recovery: [] });

    expect(legacy.additionalActivities.map((a: any) => a.init.name)).toEqual([
      "Thunder",
      "Lightning",
      "Thunder and Lightning (Lightning Strike)",
      "Thunder and Lightning (Thunderclap)",
      "Lightning Strike",
      "Thunderclap",
    ]);
    expect(modern.additionalActivities.map((a: any) => a.init.name)).toEqual([
      "Thunder",
      "Lightning",
      "Thunder and Lightning",
      "Lightning Strike",
      "Thunderclap",
    ]);

    // Thunder rides on a hit and needs no action of its own
    expect(modern.additionalActivities[0].build.activationOverride.type).toBe("special");
    // 2024 Thunder and Lightning is a Bonus Action after a hit
    expect(modern.additionalActivities[2].build.activationOverride.type).toBe("bonus");

    // one activity cannot spend another's use, so the 2014 Thunderclap half has its own daily use
    const legacyThunderclap = legacy.additionalActivities[3];
    expect(legacyThunderclap.init.name).toBe("Thunder and Lightning (Thunderclap)");
    expect(legacyThunderclap.build.generateUses).toBe(true);
    expect(legacyThunderclap.build.usesOverride).toMatchObject({ max: "1", recovery: [{ period: "dawn", type: "recoverAll" }] });
    expect(legacyThunderclap.overrides.addActivityConsume).toBe(true);

    const stunned = modern.effects.find((e: any) => e.name === "Stunned");
    expect(stunned.options.expiry).toBe("sourceEnd");
    expect(stunned.activitiesMatch).toEqual(["Thunder", "Thunder and Lightning"]);
    expect(legacy.effects.find((e: any) => e.name === "Deafened").activitiesMatch)
      .toEqual(["Thunderclap", "Thunder and Lightning (Thunderclap)"]);
  });

  it("names every mode of the Quiver of Elemental Chaos", () => {
    const enricher = build(ItemEnrichers.QuiverOfElementalChaos, { name: "Quiver of Elemental Chaos" });

    // the section splitter cannot read this item - DDB nests its labels both ways
    // round - so the generator would fall back to "Dex Save"/"Con Save"
    expect(enricher.addAutoAdditionalActivities).toBe(false);
    expect(enricher.activity.name).toBe("Air Ammunition");
    expect(enricher.activity.removeDamageParts).toBe(true);

    const names = enricher.additionalActivities.map((a: any) => a.init.name);
    expect(names).toEqual([
      "Earth Ammunition", "Earth Ammunition: Push",
      "Fire Ammunition", "Fire Ammunition: Explosion",
      "Water Ammunition",
      "Ice Ammunition", "Ice Ammunition: Paralysis",
      "Magma Ammunition", "Magma Ammunition: Searing Heat",
      "Ooze Ammunition: Grease",
    ]);

    // the on-hit extra damage and the rider are separate rolls, so they stay separate
    // activities: folding them together would gate the extra damage on the save
    const byName = Object.fromEntries(enricher.additionalActivities.map((a: any) => [a.init.name, a]));
    expect(byName["Ice Ammunition"].init.type).toBe("damage");
    expect(byName["Ice Ammunition"].build.damageParts[0]).toMatchObject({ number: 3, denomination: 6, types: ["cold"] });
    expect(byName["Ice Ammunition: Paralysis"].init.type).toBe("save");
    expect(byName["Ice Ammunition: Paralysis"].build.saveOverride).toMatchObject({
      ability: ["con"], dc: { formula: "15" },
    });
    expect(byName["Ice Ammunition: Paralysis"].build.damageParts).toEqual([]);

    // only the riders that cover an area carry one
    expect(byName["Magma Ammunition: Searing Heat"].overrides.data.target.template)
      .toMatchObject({ type: "sphere", size: "10" });
    expect(byName["Earth Ammunition: Push"].overrides.noTemplate).toBe(true);
  });

  it("gives the quiver's ice rider both of its outcomes", () => {
    const enricher = build(ItemEnrichers.QuiverOfElementalChaos, { name: "Quiver of Elemental Chaos" });

    const [paralysed, slowed] = enricher.effects;
    expect(paralysed).toMatchObject({
      activityMatch: "Ice Ammunition: Paralysis",
      statuses: ["Paralyzed"],
      options: { durationSeconds: 60 },
    });
    // the halved speed is what a SUCCESSFUL save leaves behind
    expect(slowed.onSave).toBe(true);
    expect(slowed.options.expiry).toBe("targetEnd");
    expect(slowed.changes[0]).toEqual(
      expect.objectContaining({ key: "system.attributes.movement.multiplier", value: "0.5" }),
    );
  });
});

// Formula-DC items: the second save's DC is derived from the item's rarity bonus or from a
// count the user picks at roll time. See docs/build/multi-roll-items.md.
function spellSaveDcModifiers(...values: number[]): any[] {
  return values.map((value) => ({ type: "bonus", subType: "spell-save-dc", value }));
}

describe("BanjoOfOlJerichoSticks", () => {
  const Enricher = ItemEnrichers.BanjoOfOlJerichoSticks;
  const banjo = (name: string, ...bonuses: number[]) =>
    build(Enricher, { name, ddbParser: { ddbDefinition: { grantedModifiers: spellSaveDcModifiers(...bonuses) } } });

  it("derives the Fiendish Lure DC from the record's spell save DC bonus", () => {
    expect(banjo("Banjo of Ol' Jericho Sticks, +1", 1).activity.data.save.dc.formula).toBe("17");
    expect(banjo("Banjo of Ol' Jericho Sticks, +3", 3).activity.data.save.dc.formula).toBe("19");
  });

  it("builds the Varies record at the lowest tier and says so", () => {
    const varies = banjo("Banjo of Ol' Jericho Sticks", 1, 2, 3);
    expect(varies.activity.data.save.dc.formula).toBe("17");
    expect(varies.override.descriptionSuffix).toContain("Rare tier");
    expect(banjo("Banjo of Ol' Jericho Sticks, +3", 3).override).toEqual({});
  });

  it("gives Birdcage only to the Legendary tier", () => {
    expect(banjo("Banjo of Ol' Jericho Sticks, +1", 1).additionalActivities.map((a: any) => a.init.name)).toEqual(["Scarecrow's Dance"]);
    expect(banjo("Banjo of Ol' Jericho Sticks, +3", 3).additionalActivities.map((a: any) => a.init.name)).toEqual(["Scarecrow's Dance", "Birdcage"]);
    expect(banjo("Banjo of Ol' Jericho Sticks", 1, 2, 3).additionalActivities.map((a: any) => a.init.name)).toContain("Birdcage");
  });

  it("gives Fiendish Lure its own once-per-dusk clock and a non-transferring Charmed effect", () => {
    const lure = banjo("Banjo of Ol' Jericho Sticks, +3", 3);
    expect(lure.activity.addActivityConsume).toBe(true);
    expect(lure.activity.data.uses).toEqual({ spent: 0, max: "1", recovery: [{ period: "dusk", type: "recoverAll" }] });
    expect(lure.effects[0]).toMatchObject({ activityMatch: "Fiendish Lure", statuses: ["Charmed"], options: { transfer: false, durationSeconds: 60 } });
  });
});

describe("AxeOfTheGallopingHeadsman", () => {
  const Enricher = ItemEnrichers.AxeOfTheGallopingHeadsman;
  const axe = (name: string, ...bonuses: number[]) => build(Enricher, {
    name,
    ddbParser: {
      originalName: name,
      ddbDefinition: { grantedModifiers: bonuses.map((value) => ({ type: "bonus", subType: "magic", value })) },
    },
  });
  const names = (e: any) => e.additionalActivities.map((a: any) => a.init.name);

  it("unlocks the properties by tier", () => {
    expect(names(axe("Axe of the Galloping Headsman, +1", 1))).toEqual(["Fiery Smite (1d10)"]);
    expect(names(axe("Axe of the Galloping Headsman, +2", 2))).toEqual(["Fiery Smite (1d10)", "Mark of Guilt", "Sense Guilt"]);
    expect(names(axe("Axe of the Galloping Headsman, +3", 3))).toEqual([
      "Fiery Smite (1d10)", "Mark of Guilt", "Sense Guilt", "Dark Binding", "Executioner's Blade Damage", "Executioner's Blade Save",
    ]);
  });

  it("adds the Fiery Smite die to the weapon attack and bakes the Sense Guilt DC", () => {
    const plusTwo = axe("Axe of the Galloping Headsman, +2", 2);
    expect(plusTwo.activity.data.damage.parts[0]).toMatchObject({ number: 1, denomination: 6, types: ["fire"] });
    const sense = plusTwo.additionalActivities.find((a: any) => a.init.name === "Sense Guilt");
    expect(sense.build.saveOverride.dc.formula).toBe("18");
  });

  it("builds the Varies record at the Rare tier and says so", () => {
    const varies = axe("Axe of the Galloping Headsman", 1, 2, 3);
    expect(names(varies)).toEqual(["Fiery Smite (1d10)"]);
    expect(varies.override.descriptionSuffix).toContain("Rare tier");
    expect(axe("Axe of the Galloping Headsman, +3", 3).override).toEqual({});
  });

  it("scopes the prone critical range to this axe for AC5e", () => {
    const executioner = axe("Axe of the Galloping Headsman, +3", 3).effects.find((e: any) => e.name === "Executioner's Blade");
    expect(executioner.ac5eOnly).toBe(true);
    expect(executioner.ac5eChanges[0]).toMatchObject({
      key: "flags.automated-conditions-5e.attack.criticalThreshold",
      value: "set=19; opponentActor.statuses.prone && item.identifier === 'axe-of-the-galloping-headsman-3'",
    });
  });
});

describe("levelled and variant weapon properties", () => {
  const named = (Enricher: TEnricher, name: string) => build(Enricher, { name, ddbParser: { originalName: name } });
  const names = (e: any) => e.additionalActivities.map((a: any) => a.init.name);

  it("builds every Tordalfr's Rebuttal record as one weapon gated by character level", () => {
    for (const name of ["Tordalfr's Rebuttal (Lv. 9)", "Tordalfr's Rebuttal (Lv. 13)", "Tordalfr's Rebuttal"]) {
      const javelin = named(ItemEnrichers.TordalfrsRebuttal, name);
      expect(names(javelin)).toEqual(["Charged Strike", "Lightning Bolt"]);
      // the same attack id on every record, and no item uses: each activity spends its own
      expect(javelin.activity.id).toBe(named(ItemEnrichers.TordalfrsRebuttal, "Tordalfr's Rebuttal").activity.id);
      expect(javelin.override.uses.max).toBe("");
    }
    const javelin = named(ItemEnrichers.TordalfrsRebuttal, "Tordalfr's Rebuttal (Lv. 13)");
    const [charged, bolt] = javelin.additionalActivities;
    expect(charged.overrides).toMatchObject({ addActivityConsume: true, data: { uses: { max: "1", recovery: [{ period: "sr" }] }, visibility: { level: { min: 13 } } } });
    expect(bolt.overrides).toMatchObject({ addActivityConsume: true, data: { uses: { max: "1", recovery: [{ period: "dawn" }] }, visibility: { level: { min: 17 } } } });
    expect(bolt.overrides.addItemConsume).toBeFalsy();
    // the attack and damage bonus replace each other by level band rather than stacking
    const bonuses = javelin.effects[0].changes.filter((c: any) => c.key === "attack");
    expect(bonuses.map((c: any) => [c.value, JSON.parse(c.conditions).filter((f: any) => f.k === "details.level")])).toEqual([
      ["1", [{ k: "details.level", o: "gte", v: 9 }, { k: "details.level", o: "lt", v: 13 }]],
      ["2", [{ k: "details.level", o: "gte", v: 13 }, { k: "details.level", o: "lt", v: 17 }]],
      ["3", [{ k: "details.level", o: "gte", v: 17 }]],
    ]);
  });

  it("builds the Pneuma misfire from the text's save, not DDB's modifier label", () => {
    const veryRare = named(ItemEnrichers.PneumaBlade, "Pneuma Greatsword (Very Rare)");
    expect(names(veryRare)).toEqual(["Pneumatic Strike", "Burnout"]);
    expect(veryRare.additionalActivities[1].build.saveOverride).toMatchObject({ ability: ["dex"], dc: { formula: "16" } });
    expect(veryRare.additionalActivities[0].overrides.data.attack.bonus).toBe("5");
    const rare = named(ItemEnrichers.PneumaBlade, "Pneuma Longsword (Rare)");
    expect(rare.additionalActivities[1].build.saveOverride).toMatchObject({ ability: ["con"], dc: { formula: "15" } });
    expect(rare.stopDefaultActivity).toBe(false);
    expect(named(ItemEnrichers.PneumaBlade, "Pneuma Blade").stopDefaultActivity).toBe(true);
  });

  it("gives every Unstable Crumbler copy the Transform and both forms' properties", () => {
    // a trick weapon (item/_TrickWeapon.ts): every DDB copy imports as the one Cannon/Maul weapon
    for (const name of ["Unstable Crumbler (Cannon)", "Unstable Crumbler (Maul)", "Unstable Crumbler"]) {
      expect(names(named(ItemEnrichers.UnstableCrumbler, name))).toEqual(["Transform", "Overheated Cannonball", "Detonation"]);
    }
    const fire = named(ItemEnrichers.UnstableCrumbler, "Unstable Crumbler").effects
      .find((effect: any) => effect.name === "Unstable Crumbler: Fire Reduction");
    expect(fire.changes[0]).toMatchObject({ key: "system.traits.dm.amount.fire", value: "-max(@abilities.con.mod, 1)" });
  });

  it("spends Scorching Cleaver charges by consumption scaling", () => {
    const [slash] = named(ItemEnrichers.ScorchingCleaver, "Scorching Cleaver").additionalActivities;
    expect(slash.build.saveOverride.dc.formula).toBe("10 + @prof + @scaling");
    expect(slash.overrides).toMatchObject({ addItemConsume: true, itemConsumeValue: "3", addScalingMode: "amount", addConsumptionScalingMax: "@item.uses.value - 2" });
  });
});

describe("GrassWhistleBlade", () => {
  const e = build(ItemEnrichers.GrassWhistleBlade, { name: "Grass Whistle Blade" });

  it("rolls the psychic damage apart from the saves, since it lands on a success", () => {
    expect(e.additionalActivities.map((a: any) => a.init.name)).toEqual(["Lullaby", "Lullaby: Second Save", "Lullaby: Psychic Damage"]);
    expect(e.additionalActivities[0].overrides.addItemConsume).toBe(true);
    expect(e.additionalActivities[1].build.generateDamage).toBe(false);
    expect(e.effects.map((effect: any) => [effect.activityMatch, effect.statuses])).toEqual([
      ["Lullaby", ["Incapacitated"]],
      ["Lullaby: Second Save", ["Unconscious"]],
    ]);
  });
});

describe("BellOfTheDuskMother", () => {
  const Enricher = ItemEnrichers.BellOfTheDuskMother;
  const bell = (name: string, ...bonuses: number[]) =>
    build(Enricher, { name, ddbParser: { ddbDefinition: { grantedModifiers: spellSaveDcModifiers(...bonuses) } } });

  it("derives the Dolorous Tolling DC from the bonus and replaces the parsed damage", () => {
    const plusTwo = bell("Bell of the Dusk Mother, +2", 2);
    expect(plusTwo.activity.data.save.dc.formula).toBe("18");
    expect(plusTwo.activity.removeDamageParts).toBe(true);
    expect(plusTwo.activity.damageParts).toHaveLength(1);
    expect(plusTwo.activity.damageParts[0]).toMatchObject({ number: 3, denomination: 10, types: ["psychic"] });
    expect(plusTwo.activity.data.target.template).toMatchObject({ type: "radius", size: "30" });
  });

  it("unlocks Call of the Bell at Very Rare and Death Knell at Legendary", () => {
    expect(bell("Bell of the Dusk Mother, +1", 1).additionalActivities.map((a: any) => a.init.name)).toEqual([]);
    expect(bell("Bell of the Dusk Mother, +2", 2).additionalActivities.map((a: any) => a.init.name)).toEqual(["Call of the Bell"]);
    expect(bell("Bell of the Dusk Mother, +3", 3).additionalActivities.map((a: any) => a.init.name)).toEqual(["Call of the Bell", "Death Knell"]);
  });

  it("builds Death Knell as a half-damage Constitution save at the printed DC", () => {
    const knell = bell("Bell of the Dusk Mother, +3", 3).additionalActivities[1];
    expect(knell.build.saveOverride).toEqual({ ability: ["con"], dc: { calculation: "", formula: "19" } });
    expect(knell.build.onSave).toBe("half");
    expect(knell.build.damageParts[0]).toMatchObject({ number: 5, denomination: 10, types: ["necrotic"] });
    expect(knell.build.usesOverride.recovery[0].period).toBe("dusk");
  });

  it("applies the Bane-style penalty for a minute on a failed Dolorous Tolling save", () => {
    const [penalty] = bell("Bell of the Dusk Mother, +1", 1).effects;
    expect(penalty.activityMatch).toBe("Dolorous Tolling");
    expect(penalty.options).toMatchObject({ transfer: false, durationSeconds: 60 });
    expect(penalty.changes.map((change: any) => change.key)).toContain("system.rolls.ability.save.bonus");
    expect(penalty.changes.every((change: any) => change.value === "-1d4")).toBe(true);
  });
});

describe("PhoenixRocketSword", () => {
  const Enricher = ItemEnrichers.PhoenixRocketSword;

  it("turns the auto riders off so the restriction-gated damage is not doubled", () => {
    expect(build(Enricher).addAutoAdditionalActivities).toBe(false);
  });

  it("scales the flame jet and the push DC with the charges expended", () => {
    const [jet, rocket] = build(Enricher).additionalActivities;
    expect(jet.init.name).toBe("Flame Jet");
    expect(jet.build.saveOverride.dc.formula).toBe("16");
    expect(jet.build.damageParts[0]).toMatchObject({ number: 3, denomination: 6, types: ["fire"], scaling: { mode: "whole", number: 1 } });
    // the scaling max is the number of charges spent, capped by what the sword still holds
    expect(jet.overrides).toEqual({ addScalingMode: "amount", addConsumptionScalingMax: "min(5, @item.uses.value)" });

    expect(rocket.init.name).toBe("Rocket");
    expect(rocket.build.saveOverride).toEqual({ ability: ["str"], dc: { calculation: "", formula: "10 + @scaling" } });
    expect(rocket.build.targetOverride.affects.type).toBe("self");
    expect(rocket.overrides).toEqual({ addScalingMode: "amount", addConsumptionScalingMax: "min(5, @item.uses.value)" });
  });
});

describe("random-table items", () => {
  const roll = (formula: string, name: string) => ({ formula, prompt: false, visible: true, name });

  it.each([
    ["CataclysmBolts", "1d6", "Cataclysm"],
    ["FoolsLamp", "1d10", "Wish Outcome"],
    ["SlingBulletsOfAlthemone", "1d4", "Bullet Property"],
    ["SovereignseedSatchel", "1d6", "Seed"],
    ["TeethOfDahlverNar", "1d20", "Draw Tooth"],
    ["TheInfernalMachineOfLumTheMad", "1d100", "Machine Effect"],
  ] as const)("%s rolls the table die instead of a save scraped from one row", (key, formula, name) => {
    const enricher = build(ItemEnrichers[key]);
    expect(enricher.type).toBe("utility");
    expect(enricher.addAutoAdditionalActivities).toBe(false);
    expect(enricher.clearAutoEffects).toBe(true);
    expect(enricher.activity).toMatchObject({ name, noeffect: true, noTemplate: true, data: { roll: roll(formula, name) } });
  });

  it("never spends a use on the table roll itself", () => {
    expect(build(ItemEnrichers.FoolsLamp).activity).toMatchObject({ noConsumeTargets: true });
    expect(build(ItemEnrichers.FoolsLamp).override).toBeNull();
  });

  it("spends a Tossable Kernel on the throw, not on the once-per-bag type roll", () => {
    const kernels = build(ItemEnrichers.TossableKernels);
    expect(kernels.activity).toMatchObject({ name: "Throw Kernel", activationType: "action", addItemConsume: true });
    expect(kernels.activity.data.range).toMatchObject({ value: "20", units: "ft" });
    const [type] = kernels.additionalActivities;
    expect(type.overrides).toMatchObject({ noConsumeTargets: true, data: { roll: roll("1d8", "Kernel Type") } });
  });

  it("drops the pool read from a single tooth's row", () => {
    const teeth = build(ItemEnrichers.TeethOfDahlverNar);
    expect(teeth.activity.activationType).toBe("action");
    expect(teeth.override.data.system.uses).toEqual({ spent: null, max: "", recovery: [] });
  });

  it("keeps the Marotte's Charisma club attack and rolls the d100 gate apart from the table", () => {
    const marotte = build(ItemEnrichers.MarotteOfChance);
    expect(marotte.type).toBe("attack");
    expect(marotte.activity.data.attack).toEqual({ ability: "cha", type: { value: "melee", classification: "weapon" } });
    expect(marotte.activity.damageParts[0]).toMatchObject({ number: 1, denomination: 4, bonus: "@mod", types: ["bludgeoning"] });
    expect(marotte.additionalActivities.map((a: any) => [a.init.name, a.overrides.data.roll.formula]))
      .toEqual([["Something Odd", "1d100"], ["Chance Table", "1d10"]]);
  });

  it("throws a Deck of Wild Cards card as a Dexterity ranged spell attack", () => {
    const deck = build(ItemEnrichers.DeckOfWildCards);
    expect(deck.type).toBe("attack");
    expect(deck.activity.data).toMatchObject({
      attack: { ability: "dex", type: { value: "ranged", classification: "spell" } },
      range: { value: "30", units: "ft" },
    });
    expect(deck.additionalActivities.map((a: any) => a.overrides.data.roll)).toEqual([roll("1d4", "Suit")]);
  });

  it.each([
    ["the d20 printing", "<table><thead><tr><th>1d20</th><th>Arcane Anomalies</th></tr></thead></table>", "1d20"],
    ["the d100 printing", "<table><thead><tr><th>1d100</th><th>Arcane Anomalies</th></tr></thead></table>", "1d100"],
  ])("Delerium keeps the contamination save and rolls %s", (_label, description, formula) => {
    const delerium = build(ItemEnrichers.Delerium, { name: "Delerium Geode", ddbParser: { ddbDefinition: { description } } });
    // no type: the parser's own DC 10 Constitution save stays the primary
    expect(delerium.type).toBeNull();
    expect(delerium.addAutoAdditionalActivities).toBe(false);
    expect(delerium.activity).toMatchObject({ name: "Contamination", data: { damage: { onSave: "none" } } });
    expect(delerium.activity.damageParts[0]).toMatchObject({ number: 1, denomination: 6, types: ["necrotic"] });
    expect(delerium.additionalActivities.map((a: any) => a.overrides.data.roll)).toEqual([roll(formula, "Arcane Anomaly")]);
  });
});

describe("Requiem", () => {
  const Enricher = ItemEnrichers.Requiem;

  it("keys the addiction DC and the question pool on the drug", () => {
    const bliss = build(Enricher, { name: "Requiem Bliss" });
    // @scaling is the question count (increase + 1), so it carries the "+ 1 per question" itself
    expect(bliss.activity.data.save.dc.formula).toBe("12 + @scaling");
    expect(bliss.activity.data.uses.max).toBe("10");
    // dnd5e's scaling max is the highest scaling value offered, which is questions asked
    expect(bliss.activity.addConsumptionScalingMax).toBe("10");
    expect(bliss.additionalActivities[0].build.saveOverride.dc.formula).toBe("15");

    const clay = build(Enricher, { name: "Requiem Clay" });
    expect(clay.activity.data.save.dc.formula).toBe("10 + @scaling");
    expect(clay.activity.data.uses.max).toBe("5");
    expect(clay.activity.addConsumptionScalingMax).toBe("5");
    expect(clay.additionalActivities[0].build.saveOverride.dc.formula).toBe("13");
  });

  it("rolls the poison per question regardless of the save", () => {
    const smoke = build(Enricher, { name: "Requiem Bliss" }).activity;
    expect(smoke.removeDamageParts).toBe(true);
    expect(smoke.damageParts[0]).toMatchObject({ number: 1, denomination: 6, types: ["poison"], scaling: { mode: "whole", number: 1 } });
    expect(smoke.data.damage.onSave).toBe("full");
    expect(smoke.addActivityScalingMode).toBe("amount");
  });
});

describe("seconds-canonical effect durations (dnd5e #7434)", () => {
  it("Boots of Speed carries ten minutes as 600 seconds and nothing in rounds", () => {
    const [effect] = build(ItemEnrichers.BootsOfSpeed).effects;
    expect(effect.options).toEqual({ transfer: false, durationSeconds: 600 });
  });

  it("Armor of Invulnerability and Bead of Force carry their minutes as seconds", () => {
    expect(build(ItemEnrichers.ArmorOfInvulnerability).effects[0].options.durationSeconds).toBe(600);
    expect(build(ItemEnrichers.BeadOfForce).effects[0].options.durationSeconds).toBe(60);
  });
});

/** The applied +3 lasts an hour under 2014 rules and is permanent under 2024 (dnd5e 6.0 stamps it). */
describe("OilOfSharpness", () => {
  it("states the coating's duration, not the application time", () => {
    expect(build(ItemEnrichers.OilOfSharpness, { is2014: true }).activity.data.duration).toEqual({ value: "1", units: "hour" });
    expect(build(ItemEnrichers.OilOfSharpness, { is2014: false }).activity.data.duration).toEqual({ value: "", units: "perm" });
  });
});

/**
 * Items the dnd5e SRD packs ship with a summon. One table-driven enricher serves them; building
 * the actors needs a live munch, so the declarative shape is what is pinned.
 */
describe("SRDSummonItem", () => {
  const item = (name: string, options: Record<string, any> = {}) => build(ItemEnrichers.SRDSummonItem, { name, ddbParser: { originalName: name }, ...options });

  it("replaces the primary activity of a pure summoning item", () => {
    const e = item("Figurine of Wondrous Power (Onyx Dog)");
    expect(e.type).toBe("summon");
    expect(e.generateSummons).toBe(true);
    expect(e.activity).toMatchObject({ name: "Become Mastiff", profileKeys: [{ count: "1", name: "SRDCreatureMastiff2024" }] });
    expect(e.activity.summons.match.disposition).toBe(true);
    expect(e.additionalActivities).toBeNull();
  });

  it("keys creatures by ruleset so a legacy item calls the legacy stat block", () => {
    expect(item("Figurine of Wondrous Power (Onyx Dog)", { is2014: true }).activity.profileKeys[0].name).toBe("SRDCreatureMastiff2014");
  });

  it("gives a creature DDB publishes once a single key for both rulesets", () => {
    const modern = item("Figurine of Wondrous Power (Ebony Fly)").activity.profileKeys[0].name;
    const legacyKey = item("Figurine of Wondrous Power (Ebony Fly)", { is2014: true }).activity.profileKeys[0].name;
    expect(modern).toBe("SRDCreatureGiantFly");
    expect(legacyKey).toBe(modern);
  });

  it("offers the whole Bag of Tricks table", () => {
    const keys = item("Gray Bag of Tricks").activity.profileKeys.map((k: any) => k.name);
    expect(keys).toHaveLength(8);
    expect(keys).toContain("SRDCreatureDireWolf2024");
  });

  it("calls the Horn of Valhalla's warriors by ruleset and holds it for 7 days", () => {
    // 2024 summons a fixed number of spirits; 2014 rolls its berserkers
    expect(item("Horn of Valhalla (Bronze)").activity.profileKeys).toEqual([{ count: "4", name: "SRDCreatureBerserker2024" }]);
    const legacy = item("Horn of Valhalla (Bronze)", { is2014: true });
    expect(legacy.activity.profileKeys).toEqual([{ count: "4d4 + 4", name: "SRDCreatureBerserker2014" }]);
    expect(legacy.activity).toMatchObject({ addItemConsume: true, itemConsumeValue: "@item.uses.max" });
    expect(legacy.override.uses).toEqual({ spent: 0, max: "7", recovery: [{ period: "day", type: "formula", formula: "1" }] });
  });

  it("lets the Hat of Vermin's creature keep its own disposition", () => {
    const e = item("Hat of Vermin");
    expect(e.activity.profileKeys.map((k: any) => k.name)).toEqual(["SRDCreatureBat2024", "SRDCreatureFrog2024", "SRDCreatureRat2024"]);
    expect(e.activity.summons.match.disposition).toBe(false);
  });

  it("matches a specific gem before the generic one", () => {
    expect(item("Elemental Gem (Emerald)").activity.profileKeys.map((k: any) => k.name)).toEqual(["SRDCreatureWaterElemental2024"]);
    expect(item("Elemental Gem").activity.profileKeys).toHaveLength(4);
  });

  it("places the Goat of Terror's aura from the figurine, for the rider to put on the goat", () => {
    const e = item("Figurine of Wondrous Power (Ivory Goats)");
    expect(e.type).toBe("summon");
    const [aura, save] = e.additionalActivities;
    expect(aura.init).toEqual({ name: "Goat of Terror: Aura", type: "utility" });
    expect(aura.build.targetOverride).toMatchObject({ affects: { type: "enemy" }, template: { type: "radius", size: "30" } });
    expect(aura.overrides.data.behaviors[0].config).toMatchObject({
      events: ["tokenTurnStart"],
      args: { activityName: "Goat of Terror: Save" },
    });
    expect(save.init).toEqual({ name: "Goat of Terror: Save", type: "save" });
    expect(save.build.saveOverride).toEqual({ ability: ["wis"], dc: { calculation: "", formula: "15" } });
    expect(e.effects[0]).toMatchObject({
      name: "Goat of Terror",
      statuses: ["Frightened"],
      activityMatch: "Goat of Terror: Save",
      options: { transfer: false },
    });
    expect(e.clearAutoEffects).toBe(true);
    expect(item("Figurine of Wondrous Power (Onyx Dog)").effects).toEqual([]);
  });

  it("sits beside the primary activity when the item does something else too", () => {
    const e = item("Staff of the Python");
    expect(e.type).toBeNull();
    expect(e.activity).toBeNull();
    expect(e.additionalActivities).toHaveLength(1);
    expect(e.additionalActivities[0]).toMatchObject({
      init: { name: "Transform into Snake", type: "summon" },
      build: { generateSummon: true },
      overrides: { profileKeys: [{ count: "1", name: "SRDCreatureGiantConstrictorSnake2024" }] },
    });
    expect(item("Pipes of the Sewers").additionalActivities[0].build.activationOverride.type).toBe("bonus");
  });

  it("places bare object tokens for carpets, boats and the dancing sword", () => {
    expect(item("Carpet of Flying").activity.profileKeys.map((k: any) => k.name)).toEqual([
      "SRDObjectCarpetOfFlying3x5", "SRDObjectCarpetOfFlying4x6", "SRDObjectCarpetOfFlying5x7", "SRDObjectCarpetOfFlying6x9",
    ]);
    expect(item("Dancing Sword, Longsword").additionalActivities[0].overrides.profileKeys).toEqual([{ count: "1", name: "SRDObjectDancingSword" }]);
  });

  it("leaves the Iron Flask one blank profile and builds no actors", () => {
    const e = item("Iron Flask");
    expect(e.generateSummons).toBe(false);
    expect(e.summonsFunction).toBeNull();
    expect(e.additionalActivities[0].overrides.data.profiles).toEqual([{ name: "", count: "1" }]);
  });

  it("stands down for an item with no table entry", () => {
    const e = item("Figurine of Wondrous Power, Byeshk Worg Pack");
    expect(e.type).toBeNull();
    expect(e.activity).toBeNull();
    expect(e.additionalActivities).toBeNull();
    expect(e.generateSummons).toBe(false);
  });
});

/**
 * Item effect hints build through `AutoEffects.ItemEffect`, which defaults to `transfer: true`, and
 * the activity linker skips transfer effects. A hint that names the activity applying it, or that
 * carries a condition, describes something done TO a creature by using the item, so left at the
 * default it would instead sit passively on whoever carries the item and never reach the activity.
 */
describe("item effects applied by an activity do not transfer", () => {
  /** Conditions the wearer genuinely holds while the item is equipped: `<barrel key>|<hint name>: reason`. */
  const PASSIVE_STATUS_HINTS: Record<string, string> = {};

  const offenders: string[] = [];
  let evaluated = 0;
  for (const [key, Enricher] of Object.entries(ItemEnrichers)) {
    if (key.startsWith("_") || typeof Enricher !== "function") continue;
    for (const is2014 of [false, true]) {
      let hints: any[];
      try {
        hints = build(Enricher as TEnricher, { name: key, is2014 }).effects ?? [];
      } catch {
        // abstract bases and getters reading parser state the stub lacks; the audit suite covers those
        continue;
      }
      evaluated++;
      for (const hint of hints) {
        if (!hint || hint.noCreate || hint.standalone || hint.ignoreTransfer || hint.type === "enchant") continue;
        const applied = Boolean(hint.activityMatch) || (hint.activitiesMatch?.length ?? 0) > 0 || (hint.statuses?.length ?? 0) > 0;
        if (!applied || hint.options?.transfer === false) continue;
        const id = `${key}|${hint.name ?? ""}`;
        if (!(id in PASSIVE_STATUS_HINTS) && !offenders.includes(id)) offenders.push(id);
      }
    }
  }

  it("evaluates most of the item barrel", () => {
    expect(evaluated).toBeGreaterThan(300);
  });

  it("has no activity-matched or condition hint left at the transfer default", () => {
    expect(offenders, `set options.transfer false on: ${offenders.join(", ")}`).toEqual([]);
  });
});

// =============================================================================
// Weapon property enrichers built from the 2026-09-28 rider review. Text here is synthetic.
// =============================================================================
describe("weapon property enrichers", () => {
  const record = (Enricher: TEnricher, name: string, description = "", extra: Record<string, any> = {}) => build(Enricher, {
    name,
    ddbParser: { originalName: name, parsingType: "weapon", ddbDefinition: { description, properties: [] }, data: { system: { uses: {} } }, ...extra },
  });
  const names = (e: any) => e.additionalActivities.map((a: any) => a.init.name);

  it("reads Retributive Strike's DC and multipliers from either printing", () => {
    const banded: any = retributiveStrike("Retributive Strike. Break it. You take force damage equal to 16 x the number of charges. Every other creature must make a DC 17 Dexterity saving throw. On a failed save, 8 x the number of charges within 10 ft, 6 x the number of charges farther, 4 x the number of charges at the edge.");
    expect(banded.build.saveOverride.dc.formula).toBe("17");
    expect(banded.build.damageParts[0].custom.formula).toBe("8 * @item.uses.value");
    expect(banded.build.activationOverride.condition).toContain("6x at 11-20 ft");
    const flat: any = retributiveStrike("Retributive Strike. You take Force damage equal to 16 times the number of charges. Each other creature makes a DC 18 Dexterity saving throw. On a failed save, a creature takes Force damage equal to 4 times the number of charges.");
    expect(flat.build.saveOverride.dc.formula).toBe("18");
    expect(flat.build.damageParts[0].custom.formula).toBe("4 * @item.uses.value");
  });

  it("scales Will of the Talon and Lash of Shadows by stage", () => {
    const dormant = record(ItemEnrichers.WillOfTheTalon, "Will of the Talon (Dormant)");
    const exalted = record(ItemEnrichers.WillOfTheTalon, "Will of the Talon");
    expect(dormant.additionalActivities[1].build.saveOverride.dc.formula).toBe("13");
    expect(dormant.additionalActivities[1].build.damageParts[0].number).toBe(3);
    expect(exalted.additionalActivities[1].build.damageParts[0].number).toBe(5);
    expect(dormant.effects.map((e: any) => e.name)).toEqual(["Frightful Presence"]);
    expect(exalted.effects.map((e: any) => e.name)).toContain("Will of the Talon: Resistances");
    expect(names(record(ItemEnrichers.LashOfShadows, "Lash of Shadows (Dormant)"))).toEqual(["Serpent Venom", "Dead Eyes"]);
    expect(names(record(ItemEnrichers.LashOfShadows, "Lash of Shadows (Exalted)"))).toContain("Cockatrice Tears: Second Save");
  });

  it("builds Dragon's Wrath Weapon by tier with a choice of breath types", () => {
    expect(names(record(ItemEnrichers.DragonsWrathWeapon, "Dragon's Wrath Weapon (Stirring)"))).toEqual(["Wrathful Burst"]);
    const ascendant = record(ItemEnrichers.DragonsWrathWeapon, "Dragon's Wrath Weapon (Ascendant)");
    const cone = ascendant.additionalActivities[1];
    expect(cone.build.saveOverride.dc.formula).toBe("18");
    expect(cone.build.damageParts[0].number).toBe(12);
    expect(cone.build.damageParts[0].types).toContain("radiant");
    expect(ascendant.activity.data.damage.parts[0].number).toBe(3);
    // the unsuffixed record carries the Ascendant text and modifiers
    const unsuffixed = record(ItemEnrichers.DragonsWrathWeapon, "Dragon's Wrath Weapon");
    expect(unsuffixed.tier).toBe(3);
    expect(names(unsuffixed)).toEqual(["Wrathful Burst", "Cone of Destructive Energy"]);
    expect(unsuffixed.additionalActivities[1].overrides.data.uses.max).toBe("1");
    expect(unsuffixed.override.uses.max).toBe("");
  });

  describe("Fizban's hoard items and the Stormgirdle by stage", () => {
    const wondrous = (Enricher: TEnricher, name: string) => record(Enricher, name, "", {
      parsingType: "wonderous",
      raw: { itemSpells: [] },
    });
    const uses = (activity: any) => activity.overrides.data?.uses?.max;

    it("reads the unsuffixed record as the top stage", () => {
      expect(wondrous(ItemEnrichers.DragonVessel, "Dragon Vessel (Slumbering)").stage).toBe(0);
      expect(wondrous(ItemEnrichers.DragonVessel, "Dragon Vessel (Wakened)").stage).toBe(2);
      expect(wondrous(ItemEnrichers.DragonVessel, "Dragon Vessel").stage).toBe(3);
      expect(wondrous(ItemEnrichers.Stormgirdle, "Stormgirdle").stage).toBe(2);
    });

    it("fills a Dragon Vessel once per dawn from the stage's growing list", () => {
      const slumbering = wondrous(ItemEnrichers.DragonVessel, "Dragon Vessel (Slumbering)").additionalActivities[0];
      expect(slumbering.build.activationOverride.type).toBe("bonus");
      expect(slumbering.build.activationOverride.condition).toContain("a potion of climbing");
      expect(slumbering.build.activationOverride.condition).not.toContain("mead");
      expect(uses(slumbering)).toBe("1");
      const ascendant = wondrous(ItemEnrichers.DragonVessel, "Dragon Vessel (Ascendant)").additionalActivities[0];
      expect(ascendant.build.activationOverride.condition).toContain("a potion of dragon's majesty");
    });

    it("adds the Dragon-Touched Focus family options, casts and Ascendant casting by stage", () => {
      expect(names(wondrous(ItemEnrichers.DragonTouchedFocus, "Dragon-Touched Focus (Slumbering)"))).toEqual([]);
      expect(names(wondrous(ItemEnrichers.DragonTouchedFocus, "Dragon-Touched Focus (Stirring)")))
        .toEqual(["Chromatic: Draconic Damage", "Gem: Teleport", "Metallic: Advantage on a Save"]);
      const wakened = names(wondrous(ItemEnrichers.DragonTouchedFocus, "Dragon-Touched Focus (Wakened)"));
      expect(wakened).toContain("Hold Monster (Chromatic)");
      expect(wakened).toContain("Legend Lore (Metallic)");
      expect(wakened).not.toContain("Ascendant Casting");
      expect(names(wondrous(ItemEnrichers.DragonTouchedFocus, "Dragon-Touched Focus"))).toContain("Ascendant Casting");
    });

    it("gives the Scaled Ornament its breath reaction from Wakened and hover from Ascendant", () => {
      expect(names(wondrous(ItemEnrichers.ScaledOrnament, "Scaled Ornament (Stirring)"))).toEqual([]);
      expect(wondrous(ItemEnrichers.ScaledOrnament, "Scaled Ornament (Stirring)").effects).toEqual([]);
      const wakened = wondrous(ItemEnrichers.ScaledOrnament, "Scaled Ornament (Wakened)");
      expect(names(wakened)).toEqual(["Absorb Breath"]);
      expect(uses(wakened.additionalActivities[0])).toBe("1");
      // the parser's stage effect (AC, immunities, fly speed) stays; the enricher only adds the hover
      const ascendant = wondrous(ItemEnrichers.ScaledOrnament, "Scaled Ornament (Ascendant)");
      expect(ascendant.clearAutoEffects).toBe(false);
      expect(ascendant.effects[0].changes.map((c: any) => c.key)).toEqual(["system.attributes.movement.hover"]);
    });

    it("gives the Stormgirdle resistance worn and immunity only as a Storm Avatar", () => {
      const dormant = wondrous(ItemEnrichers.Stormgirdle, "Stormgirdle (Dormant)");
      const [worn, avatar, profile] = dormant.effects;
      expect(worn.changes.map((c: any) => c.key)).toEqual(["system.traits.dr.value", "system.traits.dr.value", "system.abilities.str.value"]);
      expect(worn.changes[2].value).toBe("21");
      // the avatar is a self-enchantment: its effect and Lightning Strike only exist while it lasts
      expect(avatar.options.transfer).toBe(true);
      expect(avatar.changes.map((c: any) => c.key)).toEqual(["system.traits.di.value", "system.traits.di.value"]);
      expect(profile).toMatchObject({ type: "enchant", activityMatch: "Storm Avatar" });
      expect(profile.data.flags.ddbimporter).toEqual({
        activityRiders: [dormant.additionalActivities[1].init.id],
        effectRiders: [avatar.data._id],
      });
      expect(dormant.additionalActivities[0].init.type).toBe("enchant");
      expect(names(dormant)).toEqual(["Storm Avatar", "Lightning Strike"]);
      expect(dormant.additionalActivities[1].build.damageParts[0].number).toBe(3);
      const exalted = wondrous(ItemEnrichers.Stormgirdle, "Stormgirdle (Exalted)");
      expect(exalted.effects[0].changes[2].value).toBe("25");
      expect(exalted.effects[1].changes.map((c: any) => c.key)).toContain("system.attributes.movement.hover");
      expect(exalted.additionalActivities[1].build.damageParts[0].number).toBe(5);
      expect(names(exalted)).toContain("Control Weather");
    });
  });

  describe("fabled items by level", () => {
    const fabled = (Enricher: TEnricher, name: string, parsingType = "weapon") => record(Enricher, name, "", {
      parsingType,
      raw: { itemSpells: [] },
      ddbItem: { chargesUsed: 0 },
    });

    it("reads Lv., ordinal and Base suffixes, the unsuffixed record as level 20", async () => {
      const { fabledLevel } = await import("../../../src/parser/enrichers/item/_FabledItem");
      expect(fabledLevel("Storrbani (Lv. 13)")).toBe(13);
      expect(fabledLevel("Shadow Grimoire (9th Level)")).toBe(9);
      expect(fabledLevel("Shadow Grimoire (Base)")).toBe(1);
      expect(fabledLevel("The Grave Blade")).toBe(20);
    });

    it("builds The Grave Blade's properties by level and +3 on the unsuffixed record", () => {
      expect(names(fabled(ItemEnrichers.TheGraveBlade, "The Grave Blade (Lv. 1)"))).toEqual([]);
      expect(fabled(ItemEnrichers.TheGraveBlade, "The Grave Blade (Lv. 5)").activity.data.damage.parts).toEqual([]);
      const nine = fabled(ItemEnrichers.TheGraveBlade, "The Grave Blade (Lv. 9)");
      expect(nine.activity.data.damage.parts[0].types).toEqual(["necrotic"]);
      expect(nine.effects).toEqual([]);
      expect(nine.override).toEqual({});
      const top = fabled(ItemEnrichers.TheGraveBlade, "The Grave Blade");
      expect(names(top)).toEqual(["Refuse to Fall", "Grave Song", "Compel Death"]);
      expect(top.effects[0].activityMatch).toBe("Grave Song");
      expect(top.override.data.system.magicalBonus).toBe(3);
    });

    it("gives Storrbani one fire die and the runes by level, immunity only from Ansuz", () => {
      const five = fabled(ItemEnrichers.Storrbani, "Storrbani (Lv. 5)");
      expect(five.activity.data.damage.parts.map((p: any) => `${p.number}d${p.denomination}`)).toEqual(["1d4"]);
      expect(names(five)).toEqual(["Shield of Faith"]);
      expect(five.additionalActivities[0].build.spellOverride.properties).toContain("concentration");
      const top = fabled(ItemEnrichers.Storrbani, "Storrbani");
      expect(top.activity.data.damage.parts.map((p: any) => `${p.number}d${p.denomination}`)).toEqual(["2d6"]);
      expect(names(top)).toEqual(["Shield of Faith", "Tiwaz Rune", "Thurisaz Rune", "Extra Crit Damage vs Giants", "Ansuz Rune"]);
      expect(top.effects[0].changes[0]).toMatchObject({ key: "system.traits.di.value", type: "add", value: "ALL" });
      expect(fabled(ItemEnrichers.Storrbani, "Storrbani (Lv. 13)").effects).toEqual([]);
    });

    it("gives the Skinchanger Arm Ring its wings, endurance and charges by level", () => {
      const one = fabled(ItemEnrichers.SkinchangerArmRing, "Skinchanger Arm Ring (Lv. 1)", "wonderous");
      expect(names(one)).toEqual([]);
      expect(one.effects).toEqual([]);
      expect(one.override.uses.max).toBe("");
      const thirteen = fabled(ItemEnrichers.SkinchangerArmRing, "Skinchanger Arm Ring (Lv. 13)", "wonderous");
      expect(names(thirteen)).toEqual(["Raven Wings", "Bear's Endurance"]);
      expect(thirteen.effects.map((e: any) => e.activityMatch)).toEqual(["Raven Wings", "Bear's Endurance"]);
      const top = fabled(ItemEnrichers.SkinchangerArmRing, "Skinchanger Arm Ring (Lv. 17)", "wonderous");
      expect(names(top)).toContain("Polymorph");
      expect(top.override.uses.max).toBe("3");
    });

    it("scales the Shadow Grimoire's glyph and adds its owner's properties by level", () => {
      const base = fabled(ItemEnrichers.ShadowGrimoire, "Shadow Grimoire (Base)", "wonderous");
      expect(names(base)).toEqual(["Glyph of Warding"]);
      expect(base.additionalActivities[0].build.saveOverride.dc.formula).toBe("13");
      const nine = fabled(ItemEnrichers.ShadowGrimoire, "Shadow Grimoire (9th Level)", "wonderous");
      expect(nine.additionalActivities[0].build.damageParts[0].number).toBe(6);
      const top = fabled(ItemEnrichers.ShadowGrimoire, "Shadow Grimoire", "wonderous");
      expect(names(top)).toEqual(["Glyph of Warding", "Scroll Page", "Shadow Step", "Journey to the Shadow Realm"]);
      expect(top.additionalActivities[0].build.saveOverride.dc.formula).toBe("15");
      expect(top.additionalActivities.every((a: any) => a.build.durationOverride.units === "inst")).toBe(true);
    });
  });

  it("builds only the songs a Headbanger Lute record describes", () => {
    const both = "Panic! at the Tavern. Each creature must make a DC 14 Wisdom saving throw, taking 4d6 psychic damage. Mithrallica. Each creature in a 20-foot cone must make a DC 14 Strength saving throw, taking 4d6 thunder damage.";
    const lute = record(ItemEnrichers.HeadbangerLute, "Headbanger Lute (Rare Club)", both);
    expect(names(lute)).toEqual(["Corrosive Strike", "Panic! at the Tavern", "Mithrallica"]);
    expect(lute.additionalActivities[2].build.targetOverride.template.size).toBe("20");
    expect(names(record(ItemEnrichers.HeadbangerLute, "Headbanger Lute (Uncommon Club)", "A lute that deals an additional 1d8 acid damage."))).toEqual(["Corrosive Strike"]);
  });

  it("gives Gunnspier Backfire or Chomp by rarity and keeps Sword of Kas's save on its wielder", () => {
    expect(names(record(ItemEnrichers.Gunnspier, "Gunnspier (Rare Pike)"))).toEqual(["Point Blank Shot", "Backfire"]);
    expect(names(record(ItemEnrichers.Gunnspier, "Gunnspier (Very Rare Pike)"))).toEqual(["Point Blank Shot", "Chomp"]);
    const kas = record(ItemEnrichers.SwordOfKas, "Sword of Kas");
    expect(kas.additionalActivities[1].build.targetOverride.affects.type).toBe("self");
  });

  it("puts charges the text states onto items DDB leaves without uses", () => {
    const teeth = record(ItemEnrichers.TrappersTeeth, "Trapper's Teeth", "The teeth have 4 charges and regain all expended charges at dawn.", { ddbItem: { chargesUsed: 0 } });
    expect(teeth.override.uses).toMatchObject({ max: "4", recovery: [{ period: "dawn", type: "recoverAll" }] });
  });

  it("drops only the auto status effect, keeping the effects DDB's modifiers grant the wielder", () => {
    const staff = record(ItemEnrichers.StaffOfPower, "Staff of Power");
    expect(staff.clearAutoEffects).toBe(false);
    expect(staff.clearAutoStatusEffect).toBe(true);
    expect(staff.addAutoAdditionalActivities).toBe(false);
    // the beams' fixed +7 spell attack bonus would import as a bonus to all ranged spell attacks
    const bident = record(ItemEnrichers.EldritchBident, "Eldritch Bident");
    expect(bident.clearAutoEffects).toBe(true);
    // and DDB's 1d8 force is the beams' damage, which must not land on the bident's own hits
    expect(bident.activity.data.damage.parts).toEqual([]);
    const beams = bident.additionalActivities.find((a: any) => a.init.name === "Eldritch Beams");
    expect(beams.overrides).toMatchObject({ flatAttack: "7", data: { attack: { type: { value: "ranged", classification: "spell" } } } });
    expect(beams.overrides.data.damage.parts[0]).toMatchObject({ number: 1, denomination: 8, types: ["force"] });
    expect(beams.build.targetOverride.affects.count).toBe("2");
    const warlockBeams = bident.additionalActivities.find((a: any) => a.init.name === "Eldritch Beams (Warlock)");
    expect(warlockBeams.overrides.flatAttack).toBeUndefined();
    expect(warlockBeams.overrides.data.damage.parts[0]).toMatchObject({ number: 1, denomination: 12, bonus: "@abilities.cha.mod" });
    // DDB grants these immunities permanently; the enrichers rebuild them as resistance or a rune
    expect(record(ItemEnrichers.Stormgirdle, "Stormgirdle (Dormant)").clearAutoEffects).toBe(true);
    expect(record(ItemEnrichers.Storrbani, "Storrbani (Lv. 17)").clearAutoEffects).toBe(true);
  });

  it("leaves Will of the Talon's resistances to DDB's modifiers where the record carries them", () => {
    const resistances = ["fire", "acid", "cold", "lightning", "poison"].map((subType) => ({ type: "resistance", subType }));
    const awakened = record(ItemEnrichers.WillOfTheTalon, "Will of the Talon (Awakened)", "", {
      ddbDefinition: { description: "", properties: [], grantedModifiers: resistances },
    });
    expect(awakened.effects.map((e: any) => e.name)).toEqual(["Frightful Presence"]);
  });

  it("rebuilds the on-hit damage DDB carries only as Restriction attacks", () => {
    const fife = record(ItemEnrichers.FifeOfDragonsong, "Fife of Dragonsong");
    expect(fife.activity.data.damage).toMatchObject({ includeBase: true, parts: [{ number: 1, denomination: 6, types: ["thunder"] }] });
    // the one cone pushes enemies and bolsters allies
    const [song, allies] = fife.additionalActivities;
    expect(song.overrides.data.target.affects.type).toBe("enemy");
    expect(song.overrides.additionalConsumptionTargets).toEqual([
      { type: "itemUses", target: "feat:bardic-inspiration", value: "1", scaling: { mode: "", formula: "" } },
    ]);
    expect(allies.overrides.data.target.affects.type).toBe("ally");
    expect(fife.effects[0]).toMatchObject({ activityMatch: "Dragonsong: Allies", options: { expiry: "turnEnd" } });
    // Hazirawn's attuned die is its own activity, so the unattuned 1d6 is set on the attack
    const hazirawn = record(ItemEnrichers.Hazirawn, "Hazirawn");
    expect(hazirawn.activity.data.damage.parts).toMatchObject([{ number: 1, denomination: 6, types: ["necrotic"] }]);
    const abbot = record(ItemEnrichers.SwordOfTheCrimsonAbbot, "Sword of the Crimson Abbot, +1");
    expect(abbot.activity.data.damage).toMatchObject({ includeBase: true, parts: [{ number: 1, denomination: 6, types: ["necrotic"] }] });

    const flooze = (name: string, description: string, dice: number, restriction: string) => record(ItemEnrichers.Flooze, name, description, {
      ddbDefinition: {
        description,
        properties: [],
        grantedModifiers: [{ type: "damage", subType: "acid", restriction, dice: { diceCount: 1, diceValue: dice } }],
      },
    });
    const uncommon = flooze("Flooze (Uncommon)", "This magic flail deals an extra 1d6 acid damage to the first target it hits on each of your turns.", 6, "1st target hit on your turn");
    expect(uncommon.activity.data).toBeUndefined();
    expect(names(uncommon)).toEqual(["Acid Damage", "Reachier"]);
    expect(uncommon.additionalActivities[0].build.damageParts[0]).toMatchObject({ number: 1, denomination: 6, types: ["acid"] });
    const veryRare = flooze("Flooze (Very Rare)", "This magic flail deals an extra 1d8 acid damage to any target it hits.", 8, "");
    expect(names(veryRare)).toEqual(["Reachier"]);
    expect(veryRare.activity.data.damage.parts[0]).toMatchObject({ number: 1, denomination: 8, types: ["acid"] });

    const sword = record(ItemEnrichers.Spellsword, "Spellsword", "", { data: { system: { uses: {}, magicalBonus: 1 } } });
    const [low, high] = sword.additionalActivities;
    expect([low.init.name, high.init.name]).toEqual(["Activated: 3rd-4th Level Slot", "Activated: 5th+ Level Slot"]);
    expect(low.overrides.data.attack.bonus).toBe("");
    expect(low.overrides.data.damage.parts[0]).toMatchObject({ number: 1, denomination: 8, bonus: "@mod + 1", types: ["force"] });
    expect(high.overrides.data.attack.bonus).toBe("1");
    expect(high.overrides.data.damage.parts[0]).toMatchObject({ number: 1, denomination: 10, bonus: "@mod + 2", types: ["force"] });
  });

  describe("conditional extra weapon damage", () => {
    // a record whose DDB damage modifiers are these (type, dice, restriction) triples
    const armed = (Enricher: TEnricher, name: string, mods: [string, number, number, string][], description = "", canAttune = false) => record(Enricher, name, description, {
      ddbDefinition: {
        description,
        properties: [],
        canAttune,
        grantedModifiers: mods.map(([subType, diceCount, diceValue, restriction]) => ({ type: "damage", subType, restriction, dice: { diceCount, diceValue } })),
      },
    });
    const conditions = (effect: any) => JSON.parse(effect.changes[0].conditions);
    const extra = (e: any, name: string) => e.additionalActivities.find((a: any) => a.init.name === name);

    it("gates a damage rule on a weapon attack, and on attunement when the weapon needs it", () => {
      const thrown = { k: "roll.attack.mode", o: "exact", v: "thrown" };
      const plain = weaponDamageBonus(armed(ItemEnrichers.TordalfrsRebuttal, "Tordalfr's Rebuttal (Lv. 9)", []), "1d6[lightning]", [thrown]);
      expect(plain).toMatchObject({ key: "damage", type: "dnd5e.bonus", value: "1d6[lightning]" });
      expect(JSON.parse(plain.conditions as string)).toEqual([{ k: "roll.attack.classification", o: "exact", v: "weapon" }, thrown]);
      const attuned = weaponDamageBonus(armed(ItemEnrichers.TordalfrsRebuttal, "Tordalfr's Rebuttal (Lv. 9)", [], "", true), "1d6[lightning]");
      expect(JSON.parse(attuned.conditions as string)).toContainEqual({ k: "item.attuned", o: "exact", v: true });
    });

    it("moves each condition-bound die off the attack onto a passive enchantment of the weapon", () => {
      const flail = armed(ItemEnrichers.FuriousFlail, "Furious Flail", [["fire", 1, 8, ""]]);
      expect(flail.activity).toMatchObject({ primaryOnly: true, data: { damage: { includeBase: true, parts: [] } } });
      const [fire] = flail.effects;
      // a transfer enchantment applies to its own weapon, whose rules dnd5e collects only for that weapon
      expect(fire).toMatchObject({ type: "enchant", options: { transfer: true, durationSeconds: null, expiry: null } });
      expect(fire.changes[0].value).toBe("1d8[fire]");
      expect(conditions(fire)).toContainEqual({ k: "statuses.raging", o: "gte", v: 1 });
      // the lash requires attunement by a mind flayer
      const lash = armed(ItemEnrichers.MindLash, "Mind Lash", [["psychic", 2, 4, ""]], "", true);
      expect(conditions(lash.effects[0])).toContainEqual({ k: "details.type.value", o: "exact", v: "aberration" });
      expect(conditions(lash.effects[0])).toContainEqual({ k: "item.attuned", o: "exact", v: true });
      expect(extra(lash, "Strip Will").build.rangeOverride.value).toBe("5");
      expect(lash.effects[1]).toMatchObject({ name: "Mind Lash: Will Stripped", activityMatch: "Strip Will", options: { durationSeconds: 60 } });
      expect(lash.effects[1].changes.map((c: any) => c.key)).toEqual(["int", "wis", "cha"].map((a) => `system.abilities.${a}.save.roll.mode`));
    });

    it("gives Giant Slayer an Against Giants attack rather than a toggle, and leaves restricted variants alone", () => {
      const slayer = armed(ItemEnrichers.GiantSlayer, "Giant Slayer", [["additional", 2, 6, ""]]);
      expect(slayer.effects).toEqual([]);
      const giants = extra(slayer, "Against Giants");
      expect(giants.init.type).toBe("attack");
      // DDB's untyped "additional" die rolls as the weapon's own type
      expect(giants.overrides.data.damage).toMatchObject({ includeBase: true, parts: [{ number: 2, denomination: 6, types: [] }] });
      const variant = armed(ItemEnrichers.GiantSlayer, "Giant Slayer Longsword", [["additional", 2, 6, "Against Giants"]]);
      expect(variant.activity).toBeNull();
      expect(variant.additionalActivities).toEqual([]);
    });

    it("makes Whelm thrown and gates its extra die on a ranged attack, reading the 2014 dice from the text", () => {
      const text2024 = "Whelm has the Thrown property with a normal range of 60 feet and a long range of 180 feet. When you hit with a ranged attack roll using Whelm, the target takes an extra 1d8 Force damage, or an extra 4d8 Force damage if the target is a Construct, an Elemental, or a Giant.";
      const whelm = armed(ItemEnrichers.Whelm, "Whelm", [["force", 1, 8, ""], ["force", 4, 8, "if the target is a Construct"]], text2024);
      expect(whelm.thrownRange).toEqual({ value: 60, long: 180 });
      expect(whelm.additionalActivities).toEqual([]);
      expect(whelm.effects[1].changes[0].value).toBe("1d8[force]");
      expect(conditions(whelm.effects[1])).toContainEqual({ k: "roll.attack.type", o: "exact", v: "ranged" });
      const text2014 = "Whelm has the thrown property, with a normal range of 20 feet and a long range of 60 feet. When you hit with a ranged weapon attack using it, the target takes an extra 1d8 bludgeoning damage, or an extra 2d8 bludgeoning damage if the target is a giant.";
      const legacy = armed(ItemEnrichers.Whelm, "Whelm", [], text2014);
      expect(legacy.thrownRange).toEqual({ value: 20, long: 60 });
      expect(legacy.effects[1].changes[0].value).toBe("1d8[bludgeoning]");
      expect(extra(legacy, "Against Giants").overrides.data.damage.parts[0]).toMatchObject({ number: 2, denomination: 8, types: ["bludgeoning"] });
    });

    it("applies Hazirawn's Wounding from the attack and gates its second die on attunement", () => {
      const hazirawn = record(ItemEnrichers.Hazirawn, "Hazirawn");
      expect(names(hazirawn)).toEqual(["End Wounding"]);
      expect(hazirawn.activity.noeffect).toBeUndefined();
      const wounding = hazirawn.effects.find((e: any) => e.name === "Hazirawn: Wounding");
      expect(wounding.activityTypesMatch).toEqual(["attack"]);
      const attuned = hazirawn.effects.find((e: any) => e.name === "Hazirawn: Attuned");
      expect(attuned.type).toBe("enchant");
      const javelin = armed(ItemEnrichers.TordalfrsRebuttal, "Tordalfr's Rebuttal (Lv. 9)", [["lightning", 1, 6, ""]]);
      expect(javelin.activity.data.damage.parts).toEqual([]);
      const lightning = javelin.effects[0].changes.find((c: any) => c.value === "1d6[lightning]");
      expect(JSON.parse(lightning.conditions)).toContainEqual({ k: "roll.attack.mode", o: "startswith", v: "thrown" });
      expect(JSON.parse(lightning.conditions)).toContainEqual({ k: "details.level", o: "gte", v: 9 });
    });

    it("smolders the Warhammer by a self enchantment and keeps Scorpion Lasher's venom as an activity", () => {
      const hammer = record(ItemEnrichers.WarhammerOfEruptions, "Warhammer of Eruptions");
      const smolderActivity = extra(hammer, "Smoldering");
      expect(smolderActivity.init.type).toBe("enchant");
      expect(smolderActivity.overrides.data.enchant).toEqual({ self: true });
      const [smolder] = hammer.effects;
      expect(smolder).toMatchObject({ type: "enchant", activityMatch: "Smoldering", options: { transfer: false, durationSeconds: 18 } });
      expect(smolder.changes[0].value).toBe("1d6[fire]");
      expect(smolder.changes[1]).toMatchObject({ key: "activities[enchant].name", value: "Cool Warhammer" });
      const lasher = record(ItemEnrichers.ScorpionLasher, "Scorpion Lasher");
      expect(lasher.activity.data.damage.parts).toEqual([]);
      expect(names(lasher)).toEqual(["Venom", "Venom: Pull"]);
      expect(lasher.addAutoAdditionalActivities).toBe(false);
      expect(extra(lasher, "Venom: Pull").build.saveOverride).toMatchObject({ ability: ["str"], dc: { formula: "13" } });
      // an on-hit rider reaches as far as the weapon: the whip's 10 feet, a bow's long range
      const whip = record(ItemEnrichers.ScorpionLasher, "Scorpion Lasher", "", { ddbDefinition: { description: "", properties: [], range: 10, longRange: null } });
      expect(extra(whip, "Venom").build.rangeOverride).toMatchObject({ value: "10", units: "ft" });
      const bow = record(ItemEnrichers.Fenthras, "Fenthras (Awakened)", "", { ddbDefinition: { description: "", properties: [], range: 150, longRange: 600 } });
      expect(extra(bow, "Bramble Shot").build.rangeOverride.value).toBe("600");
    });

    it("gives the Storm Boomerang one self-consumed thunder strike that also stuns", () => {
      const boomerang = record(ItemEnrichers.StormBoomerang, "Storm Boomerang");
      expect(boomerang.activity.data.damage.parts).toEqual([]);
      expect(boomerang.addAutoAdditionalActivities).toBe(false);
      const [strike] = boomerang.additionalActivities;
      expect(strike.init.name).toBe("Thunderous Strike");
      expect(strike.overrides).toMatchObject({ addActivityConsume: true, data: { uses: { max: "1", recovery: [] }, damage: { onSave: "full" } } });
      expect(boomerang.effects[0]).toMatchObject({ activityMatch: "Thunderous Strike", statuses: ["Stunned"] });
    });

    it("gives exalted Ruin's Wake a once-a-dawn battle cry granting chosen allies advantage", () => {
      expect(record(ItemEnrichers.RuinsWake, "Ruin's Wake (Awakened)").additionalActivities).toEqual([]);
      const exalted = record(ItemEnrichers.RuinsWake, "Ruin's Wake");
      expect(exalted.keepParsedActivities).toBe(true);
      const [cry] = exalted.additionalActivities;
      expect(cry.init.name).toBe("Battle Cry");
      expect(cry.build.activationOverride.type).toBe("bonus");
      expect(cry.build.targetOverride.template).toMatchObject({ type: "radius", size: "30" });
      expect(cry.overrides.data.target.affects).toMatchObject({ type: "ally", choice: true });
      expect(exalted.effects[0].changes[0]).toMatchObject({ key: "attack", type: "dnd5e.advantage", value: "1" });
    });

    it("builds both Nightbringer records as one weapon with an alignment-gated evil effect", () => {
      for (const name of ["Nightbringer", "Nightbringer (Evil Alignment)"]) {
        const mace = record(ItemEnrichers.Nightbringer, name, "", { ddbItem: { chargesUsed: 0 } });
        expect(mace.clearAutoEffects).toBe(true);
        expect(mace.override.uses).toMatchObject({ max: "6", recovery: [{ period: "dawn", type: "formula", formula: "1d6" }] });
        expect(names(mace)).toEqual(["Midnight Shroud (Evil Only)"]);
        const evil = mace.effects.find((e: any) => e.name === "Nightbringer: Evil Alignment");
        expect(JSON.parse(evil.data.system.conditions)).toEqual({ k: "details.alignment", o: "icontains", v: "evil" });
        expect(mace.effects.find((e: any) => e.activityMatch === "Midnight Shroud (Evil Only)").statuses).toEqual(["Blinded"]);
      }
    });

    it("gives the 2024 Weapons of Wounding a hit save carrying Wounded, keeping the 2014 wounds", () => {
      const save2024 = "When you hit a creature with an attack using this magic weapon, the target takes an extra 2d6 Necrotic damage and must succeed on a DC 15 Constitution saving throw or be unable to regain Hit Points for 1 hour.";
      const wounding = record(ItemEnrichers.WeaponOfWounding, "Glaive of Wounding", save2024);
      expect(names(wounding)).toEqual(["Wounding"]);
      expect(wounding.effects[0]).toMatchObject({ name: "Wounded", activityMatch: "Wounding", options: { durationSeconds: 3600 } });
      expect(names(record(ItemEnrichers.WeaponOfWounding, "Longsword of Wounding", "Once per turn, when you hit a creature with an attack using this magic weapon, you can wound the target.")))
        .toEqual(["Wound", "Wound Damage", "End Wounds", "Treat Wounds"]);
    });

    it("reads each Terrorasque record's charges, DC and dice multiplier from its text", () => {
      const veryRare = "This weapon has 7 charges and regains 1d6 + 1 charges daily at dawn. roll five times as many damage dice for the weapon. must succeed on a DC 16 Wisdom saving throw or be frightened. Tar Strike. As an action, you can mentally command this weapon. DC 16 Strength check.";
      const glaive = record(ItemEnrichers.Terrorasque, "Terrorasque (Very Rare Glaive)", veryRare, {
        ddbDefinition: { description: veryRare, properties: [], damage: { diceCount: 1, diceValue: 10 }, damageType: "Slashing" },
        data: { system: { uses: {}, magicalBonus: 2 } },
        ddbItem: { chargesUsed: 0 },
      });
      expect(glaive.override.uses).toMatchObject({ max: "7", recovery: [{ formula: "1d6 + 1" }] });
      expect(names(glaive)).toEqual(["Ferocious Blow", "Terrorise", "Tar Strike", "Escape the Tar"]);
      expect(extra(glaive, "Ferocious Blow").overrides.data.damage.parts[0]).toMatchObject({ number: 5, denomination: 10, bonus: "@mod + 2", types: ["slashing"] });
      expect(extra(glaive, "Terrorise").build.saveOverride.dc.formula).toBe("16");
      expect(glaive.effects.map((e: any) => e.activityMatch)).toEqual(["Terrorise", "Tar Strike"]);
    });

    it("drips Edge of Dissolution's acid from a self enchantment rather than every hit", () => {
      const edge = armed(ItemEnrichers.EdgeOfDissolution, "Edge of Dissolution, Longsword", [["acid", 2, 6, ""]]);
      expect(edge.activity.data.damage.parts).toEqual([]);
      expect(edge.clearAutoStatusEffect).toBe(true);
      expect(extra(edge, "Acid Blade").overrides.data.enchant).toEqual({ self: true });
      expect(edge.effects[0]).toMatchObject({ type: "enchant", activityMatch: "Acid Blade", options: { durationSeconds: null, expiry: null } });
      expect(edge.effects[0].changes[0].value).toBe("2d6[acid]");
      expect(edge.effects[0].changes[1]).toMatchObject({ key: "activities[enchant].name", value: "Remove Acid" });
    });

    it("stores Godsteel Worldcarver with a renaming self enchantment and banishes on a 20", () => {
      const sword = record(ItemEnrichers.GodsteelWorldcarver, "Godsteel Worldcarver (Longsword)", "", {
        ddbDefinition: { description: "", properties: [], range: 5 },
      });
      expect(sword.addAutoAdditionalActivities).toBe(false);
      expect(names(sword)).toEqual(["Banishing Strike", "Radiant Restoration (Cleric or Paladin)", "Send to Extradimensional Space"]);
      // a cleric or paladin's healing is half the radiant damage, entered as the situational bonus
      const restore = extra(sword, "Radiant Restoration (Cleric or Paladin)");
      expect(restore.init.type).toBe("heal");
      expect(restore.build.healingPart).toMatchObject({ custom: { enabled: true, formula: "0" }, types: ["healing"] });
      expect(restore.build.targetOverride.template).toMatchObject({ type: "radius", size: "30" });
      const store = extra(sword, "Send to Extradimensional Space");
      expect(store.init.type).toBe("enchant");
      expect(store.build.activationOverride.type).toBe("bonus");
      expect(store.overrides.data.enchant).toEqual({ self: true });
      expect(sword.effects[0]).toMatchObject({ type: "enchant", activityMatch: "Send to Extradimensional Space", options: { expiry: null } });
      expect(sword.effects[0].changes.map((c: any) => [c.key, c.value])).toEqual([
        ["name", "{} (In Extradimensional Space)"],
        ["activities[enchant].name", "Retrieve from space"],
      ]);
      const banish = extra(sword, "Banishing Strike");
      expect(banish.build.saveOverride).toMatchObject({ ability: ["cha"], dc: { formula: "17" } });
      expect(banish.build.activationOverride).toMatchObject({ type: "special", condition: expect.stringContaining("roll a 20") });
      expect(banish.overrides.data.damage).toMatchObject({ onSave: "half", parts: [{ number: 3, denomination: 8, types: ["radiant"] }] });
      expect(sword.effects[1]).toMatchObject({ activityMatch: "Banishing Strike", statuses: ["Incapacitated"], options: { expiry: "sourceStart" } });
    });

    it("gives the Hellfire Pitchfork its 15/45 throw, a bonus-action recall and the recall's pillar of flame", () => {
      const fork = armed(ItemEnrichers.HellfirePitchfork, "Hellfire Pitchfork", [["radiant", 1, 8, ""], ["fire", 1, 8, "Bonus Action to retrieve after ranged attack: Dex. Save: DC 16 to 5-ft. pillar"]]);
      expect(fork.addAutoAdditionalActivities).toBe(false);
      expect(names(fork)).toEqual(["Recall Pitchfork", "Pillar of Flame"]);
      const recall = extra(fork, "Recall Pitchfork");
      expect(recall.init.type).toBe("utility");
      expect(recall.build.activationOverride).toMatchObject({ type: "bonus", value: 1 });
      const pillar = extra(fork, "Pillar of Flame");
      expect(pillar.build.saveOverride).toMatchObject({ ability: ["dex"], dc: { formula: "16" } });
      expect(pillar.build.damageParts[0]).toMatchObject({ number: 1, denomination: 8, types: ["fire"] });
      const document: any = { type: "weapon", system: { range: { value: 20, long: 60, units: "ft", reach: null } } };
      fork.override.func({ enricher: { data: document } });
      expect(document.system.range).toEqual({ value: 15, long: 45, units: "ft", reach: null });
    });

    it("frightens a Moonsteel target out of its true form without a save, and retimes the true form save", () => {
      const rapier = record(ItemEnrichers.Moonsteel, "Moonsteel Rapier", "", { ddbDefinition: { description: "", properties: [], range: 5 } });
      expect(rapier.addAutoAdditionalActivities).toBe(false);
      expect(names(rapier)).toEqual(["Frighten Untrue Form Creature", "Return to True Form"]);
      const frighten = extra(rapier, "Frighten Untrue Form Creature");
      expect(frighten.init.type).toBe("utility");
      expect(frighten.build.activationOverride.type).toBe("special");
      expect(rapier.effects[0]).toMatchObject({ activityMatch: "Frighten Untrue Form Creature", statuses: ["Frightened"], options: { expiry: "sourceStart" } });
      expect(extra(rapier, "Return to True Form").build.saveOverride).toMatchObject({ ability: ["cha"], dc: { formula: "13" } });
    });

    it("gives exalted Whisper a shadow teleport as far as the dagger throws", () => {
      const dagger = (name: string) => record(ItemEnrichers.Whisper, name, "", { ddbDefinition: { description: "", properties: [], range: 20, longRange: 60 } });
      expect(names(dagger("Whisper (Awakened)"))).toEqual([]);
      const exalted = dagger("Whisper (Exalted)");
      expect(exalted.keepParsedActivities).toBe(true);
      const shadow = extra(exalted, "Shadow Merge");
      expect(shadow.init.type).toBe("teleport");
      expect(shadow.build.activationOverride.type).toBe("special");
      expect(shadow.build.rangeOverride).toMatchObject({ value: "60", units: "ft" });
      expect(names(dagger("Whisper"))).toEqual(["Shadow Merge"]);
    });

    it("lets a thrown Martialist's Quarterstaff end its Throw early without spending a charge", () => {
      const staff = record(ItemEnrichers.MartialistsQuarterstaff, "Martialist's Quarterstaff");
      const thrown = staff.effects.find((e: any) => e.name === "Thrown Quarterstaff");
      expect(thrown.changes).toContainEqual(expect.objectContaining({ key: "activities[enchant].name", value: "End Throw" }));
      expect(thrown.changes).toContainEqual(expect.objectContaining({ key: "activities[enchant].consumption.targets", value: "[]" }));
      expect(staff.additionalActivities[0].overrides.data.enchant).toEqual({ self: true });
    });

    it("gives the fused Starmetal Solar Axe a light activity, and the Battleaxes none", () => {
      const fused = "Fused State (Greataxe). These flames shed Bright Light in a 20-foot radius and Dim Light for an additional 20 feet. The light is sunlight.";
      const greataxe = record(ItemEnrichers.StarmetalSolarAxe, "Starmetal Solar Axe (Greataxe)", fused);
      expect(greataxe.keepParsedActivities).toBe(true);
      expect(names(greataxe)).toEqual(["Stellar Flames"]);
      expect(extra(greataxe, "Stellar Flames").init.type).toBe("utility");
      expect(greataxe.effects[0]).toMatchObject({ activityMatch: "Stellar Flames", options: { durationSeconds: null, expiry: null } });
      expect(greataxe.effects[0].tokenChanges.slice(0, 2).map((c: any) => [c.key, c.value])).toEqual([["token.light.bright", "20"], ["token.light.dim", "40"]]);
      const battleaxe = record(ItemEnrichers.StarmetalSolarAxe, "Starmetal Solar Axe (Battleaxe)", "Fissioned State (Battleaxes). The axes orbit you slowly.");
      expect(names(battleaxe)).toEqual([]);
      expect(battleaxe.effects).toEqual([]);

      // each state change is a bonus action burst, named by its damage, once per long rest
      const shared = { type: "action", value: 1, condition: "" };
      const activities: Record<string, any> = {
        attack: { type: "attack", activation: shared },
        fission: { type: "save", name: "Save", activation: shared, damage: { parts: [{ number: 3, denomination: 6, types: ["lightning"] }] } },
        fusion: { type: "save", name: "Fusion", activation: shared, damage: { parts: [{ number: 3, denomination: 6, types: ["fire"] }] } },
      };
      greataxe.override.func({ enricher: { data: { system: { activities } } } });
      expect(activities.attack.activation.type).toBe("action");
      expect(activities.fission).toMatchObject({
        name: "Fission",
        activation: { type: "bonus" },
        range: { override: true, units: "self" },
        target: { template: { type: "radius", size: "30" } },
        uses: { max: "1", recovery: [{ period: "lr" }] },
        consumption: { targets: [{ type: "activityUses", value: "1" }] },
      });
      expect(activities.fusion.name).toBe("Fusion");
    });

    it("gives the Diamond Staff a one-minute Dazzling Light for a charge", () => {
      const staff = record(ItemEnrichers.DiamondStaff, "Diamond Staff");
      expect(staff.keepParsedActivities).toBe(true);
      const light = extra(staff, "Dazzling Light");
      expect(light.init.type).toBe("utility");
      expect(light.overrides).toMatchObject({ addItemConsume: true, itemConsumeValue: "1", data: { duration: { value: "1", units: "minute" } } });
      const lightEffect = staff.effects.find((e: any) => e.activityMatch === "Dazzling Light");
      expect(lightEffect).toMatchObject({ options: { durationSeconds: 60, expiry: null } });
      expect(lightEffect.tokenChanges.map((c: any) => [c.key, c.value])).toEqual([["token.light.bright", "40"], ["token.light.dim", "80"]]);
      expect(staff.effects.find((e: any) => e.name === "Diamond Staff: Adept").changes[0].key).toBe("system.skills.arc.roll.mode");
      // the +3 is the staff's own bonus, and DDB's melee-wide modifier is dropped from the effects
      const data: any = {
        type: "weapon",
        system: { activities: { save: { type: "save", name: "Save", save: { ability: ["con"] } } } },
        effects: [{ name: "Diamond Staff", system: { changes: [{ key: "system.rolls.attack.mwak.bonus", value: "3" }] }, statuses: [] }],
      };
      staff.override.func({ enricher: { data } });
      expect(data.system.magicalBonus).toBe(3);
      expect(data.effects).toEqual([]);
      expect(data.system.activities.save).toMatchObject({ name: "Stunning Hit", activation: { type: "special" } });
    });

    it("gives every Pyremaul stage a light, and moves the exalted crit fire into the attack's critical bonus", () => {
      const dormant = record(ItemEnrichers.Pyremaul, "Pyremaul (Dormant)");
      expect(names(dormant)).toEqual(["Shed Light"]);
      expect(dormant.effects[0]).toMatchObject({ activityMatch: "Shed Light", options: { durationSeconds: null, expiry: null } });
      expect(dormant.effects[0].tokenChanges.map((c: any) => [c.key, c.value])).toEqual([["token.light.bright", "30"], ["token.light.dim", "60"]]);
      // the stage bonus is to attack rolls only
      expect(dormant.activity.data.attack.bonus).toBe("1");
      expect(dormant.activity.data.damage.critical).toBeUndefined();
      const awakened = record(ItemEnrichers.Pyremaul, "Pyremaul (Awakened)");
      expect(names(awakened)).toEqual(["Shed Light", "Burning Hands", "Critical Hit: Knocked Prone"]);
      expect(extra(awakened, "Burning Hands").build.spellOverride.level).toBe(2);
      expect(extra(awakened, "Critical Hit: Knocked Prone").build.saveOverride.dc.formula).toBe("15");
      const exalted = record(ItemEnrichers.Pyremaul, "Pyremaul (Exalted)");
      expect(exalted.addAutoAdditionalActivities).toBe(false);
      expect(exalted.activity.data.damage).toMatchObject({ parts: [{ number: 3, denomination: 6, types: ["fire"] }], critical: { bonus: "3d6[fire]" } });
      expect(extra(exalted, "Burning Hands").build.spellOverride.level).toBe(3);
      const immolate = extra(exalted, "Immolate Dead");
      expect(immolate.init.type).toBe("damage");
      expect(immolate.build.damageParts[0]).toMatchObject({ number: 10, denomination: 10, types: ["fire"] });
      expect(immolate.build.targetOverride.affects.type).toBe("self");
      expect(immolate.overrides).toMatchObject({ addActivityConsume: true, data: { uses: { max: "1", recovery: [] } } });
      // the unsuffixed record carries the exalted text
      expect(names(record(ItemEnrichers.Pyremaul, "Pyremaul"))).toContain("Immolate Dead");
    });

    it("gives the Infernal Chain a grappled burn, a pull and its curse save instead of a Restriction attack", () => {
      const chain = record(ItemEnrichers.InfernalChain, "Infernal Chain", "", { ddbDefinition: { description: "", properties: [], range: 10 } });
      expect(chain.addAutoAdditionalActivities).toBe(false);
      expect(names(chain)).toEqual(["Grappled: Burning Chain", "Grappled: Pull", "Curse"]);
      const burn = extra(chain, "Grappled: Burning Chain");
      expect(burn.init.type).toBe("damage");
      expect(burn.build.damageParts[0]).toMatchObject({ number: 2, denomination: 8, types: ["fire"] });
      expect(burn.build.rangeOverride.value).toBe("10");
      expect(extra(chain, "Grappled: Pull").build.activationOverride.type).toBe("bonus");
      const curse = extra(chain, "Curse");
      expect(curse.build.saveOverride).toMatchObject({ ability: ["wis"], dc: { formula: "16" } });
      expect(curse.build.targetOverride.affects.type).toBe("self");
    });

    it("gives Fenthras its own Oracle Shot and a self-consumed Bramble Shot by stage", () => {
      const dormant = record(ItemEnrichers.Fenthras, "Fenthras (Dormant)");
      expect(names(dormant)).toEqual(["Oracle Shot"]);
      expect(dormant.override).toMatchObject({ uses: { max: "" } });
      const awakened = record(ItemEnrichers.Fenthras, "Fenthras (Awakened)");
      const bramble = extra(awakened, "Bramble Shot");
      expect(bramble.build.saveOverride.dc.formula).toBe("15");
      expect(bramble.overrides).toMatchObject({ addActivityConsume: true, data: { uses: { max: "1" }, damage: { onSave: "full" } } });
      const exalted = extra(record(ItemEnrichers.Fenthras, "Fenthras (Exalted)"), "Bramble Shot");
      expect(exalted.build.saveOverride.dc.formula).toBe("17");
      expect(exalted.overrides.data.uses.max).toBe("2");
      expect(awakened.effects[0]).toMatchObject({ activityMatch: "Bramble Shot", statuses: ["Restrained"] });
    });

    it("retargets Thornpiercer's dagger burst to up to four chosen enemies within 10 feet of the target", () => {
      const activities: Record<string, any> = {
        dagger: { type: "save", save: { ability: ["dex"] }, target: { affects: { count: "1", type: "creature" }, template: {} } },
        whip: { type: "save", save: { ability: ["str"] }, target: { affects: { count: "1", type: "creature" }, template: {} } },
      };
      record(ItemEnrichers.Thornpiercer, "Thornpiercer (Dagger)").override.func({ enricher: { data: { system: { activities } } } });
      expect(activities.dagger.target).toMatchObject({
        template: { type: "radius", size: "10", units: "ft" },
        affects: { count: "4", type: "enemy", choice: true },
      });
      expect(activities.dagger.range).toMatchObject({ value: "60", units: "ft" });
      expect(activities.whip.target.affects).toMatchObject({ count: "1", type: "creature" });
      expect(activities.whip.target.template.type).toBe("");
    });

    it("retimes Thornpiercer's shortsword, rapier and whip saves to the hits that trigger them", () => {
      const shared = { type: "action", value: 1, condition: "" };
      const activities: Record<string, any> = {
        attack: { type: "attack", name: "", activation: shared, damage: { parts: [] } },
        rapier: { type: "save", name: "Rapier", activation: shared, save: { ability: ["con"] }, damage: { parts: [] } },
        shortsword: { type: "save", name: "Save", activation: shared, save: { ability: ["con"] }, damage: { onSave: "none", parts: [{ number: 1, denomination: 6, types: ["poison"] }] } },
        whip: { type: "save", name: "Whip", activation: shared, save: { ability: ["str"] }, damage: { parts: [] } },
      };
      record(ItemEnrichers.Thornpiercer, "Thornpiercer").override.func({ enricher: { data: { system: { activities } } } });
      expect(activities.attack.activation.type).toBe("action");
      expect(activities.shortsword.activation).toMatchObject({ type: "special", condition: expect.stringContaining("first creature") });
      expect(activities.shortsword.damage.parts[0]).toMatchObject({ number: 1, denomination: 6 });
      // the rapier's natural-20 save lowers the Hit Point maximum, half on a success
      expect(activities.rapier.activation.condition).toContain("roll a 20");
      expect(activities.rapier.damage).toMatchObject({ onSave: "half", parts: [{ custom: { enabled: true, formula: "0" }, types: ["maximum"] }] });
      expect(activities.whip.activation.condition).toContain("grapple");
      expect(activities.whip.range).toMatchObject({ value: "10", units: "ft" });
    });

    it("retimes Giant Slayer's prone save to the hit on a Giant, and makes Whelm's save a Shock Wave", () => {
      const shared = { type: "action", value: 1, condition: "" };
      const slayerActs: Record<string, any> = {
        attack: { type: "attack", activation: shared },
        save: { type: "save", activation: shared, save: { ability: ["str"] } },
      };
      armed(ItemEnrichers.GiantSlayer, "Giant Slayer Mace", [["additional", 2, 6, "Against Giants"]]).override.func({ enricher: { data: { system: { activities: slayerActs } } } });
      expect(slayerActs.save.activation).toMatchObject({ type: "special", condition: "When you hit a Giant with this weapon" });
      expect(slayerActs.attack.activation.type).toBe("action");

      const text = "Shock Wave. You can take a Magic action to strike the ground with Whelm and send a shock wave out from the point of impact. Each creature of your choice on the ground within 60 feet of that point must succeed on a DC 20 Constitution saving throw or have the Stunned condition for 1 minute.";
      const whelm = armed(ItemEnrichers.Whelm, "Whelm", [], text);
      expect(whelm.clearAutoStatusEffect).toBe(true);
      expect(whelm.effects[0]).toMatchObject({ activityTypesMatch: ["save"], statuses: ["Stunned"], options: { durationSeconds: 60, expiry: null } });
      expect(whelm.effects[0].midiChanges[0].value).toContain("saveDC=20");
      const whelmActs: Record<string, any> = { attack: { type: "attack", activation: shared }, save: { type: "save", name: "Save", activation: shared } };
      whelm.override.func({ enricher: { data: { type: "weapon", system: { properties: [], range: {}, activities: whelmActs } } } });
      expect(whelmActs.save.name).toBe("Shock Wave");
      expect(whelmActs.save.range.units).toBe("self");
      expect(whelmActs.save.target.template).toMatchObject({ type: "radius", size: "60" });
      expect(whelmActs.save.target.affects.choice).toBe(true);
    });

    it("gives Thornpiercer's whip a Thorns damage activity instead of the grapple Restriction attack", () => {
      const whipText = "Whip. When you hit a Medium or smaller creature with this weapon, you can attempt to grapple it with the Whip. The Grappled target takes 1d4 Piercing damage from the Whip's thorns at the start of each of its turns until it's freed.";
      const whip = record(ItemEnrichers.Thornpiercer, "Thornpiercer (Whip)", whipText, {
        ddbDefinition: { description: whipText, properties: [], grantedModifiers: [{ type: "damage", subType: "piercing", restriction: "", dice: { diceCount: 1, diceValue: 4 } }] },
      });
      expect(whip.keepParsedActivities).toBe(true);
      expect(names(whip)).toEqual(["Thorns"]);
      expect(extra(whip, "Thorns").build.damageParts[0]).toMatchObject({ number: 1, denomination: 4, types: ["piercing"] });
      // the attack keeps its own extra 1d4, which the Thorns die would otherwise claim
      expect(whip.activity.data.damage.parts[0]).toMatchObject({ number: 1, denomination: 4, types: ["piercing"] });
      // the parent has no weapon attack to set
      expect(record(ItemEnrichers.Thornpiercer, "Thornpiercer", whipText, { parsingType: "ammunition" }).activity).toBeNull();

      const shared = { type: "action", value: 1, condition: "" };
      const activities: Record<string, any> = {
        attack: { type: "attack", name: "", activation: shared, damage: { parts: [], critical: {} } },
        grapple: { type: "attack", name: "Restriction: if failed Grappled save - Escape Str. (Athletics) check: DC 17", damage: { parts: [] } },
        dagger: { type: "save", name: "Dagger", activation: shared, save: { ability: ["dex"] }, target: {}, effects: [{ _id: "grab" }] },
        whipSave: { type: "save", name: "Whip", save: { ability: ["str"] }, damage: { parts: [{ number: 1, denomination: 4 }] }, effects: [{ _id: "grab" }] },
      };
      whip.override.func({ enricher: { data: { system: { activities }, effects: [{ _id: "grab", statuses: ["grappled"] }] } } });
      expect(Object.keys(activities)).toEqual(["attack", "dagger", "whipSave"]);
      expect(activities.whipSave.damage.parts).toEqual([]);
      // the dagger's retarget must not reach the attack through their shared activation object
      expect(activities.attack.activation.type).toBe("action");
      expect(activities.dagger.activation.type).toBe("special");
      expect(activities.dagger.effects).toEqual([]);
      expect(activities.whipSave.effects).toEqual([{ _id: "grab" }]);
    });

    it("puts Coldsnap's frozen and halved speed effects on its save, the halving on a success", () => {
      const [frozen, chilled] = record(ItemEnrichers.Coldsnap, "Coldsnap").effects;
      expect(frozen).toMatchObject({ activityMatch: "Save", options: { expiry: "sourceStart" } });
      expect(frozen.onSave).toBeUndefined();
      expect(frozen.changes[0]).toMatchObject({ key: "system.attributes.movement.multiplier", value: "0" });
      expect(chilled).toMatchObject({ activityMatch: "Save", onSave: true });
      expect(chilled.changes[0]).toMatchObject({ key: "system.attributes.movement.multiplier", value: "0.5" });
    });

    it("adds the Staff of the Forgotten One's Invoke Curse beside its parsed saves", () => {
      const staff = record(ItemEnrichers.StaffOfTheForgottenOne, "Staff of the Forgotten One");
      expect(staff.keepParsedActivities).toBe(true);
      const [curse] = staff.additionalActivities;
      expect(curse.build.saveOverride).toMatchObject({ ability: ["con"], dc: { calculation: "spellcasting" } });
      expect(curse.overrides.itemConsumeValue).toBe("1");
      const curseEffect = staff.effects.find((e: any) => e.name === "Cursed by the Forgotten One");
      expect(curseEffect.options).toMatchObject({ durationSeconds: null, expiry: null });
      expect(staff.effects.find((e: any) => e.name === "Staff of the Forgotten One: Lore").changes.map((c: any) => c.key))
        .toEqual(["system.skills.arc.value", "system.skills.his.value"]);
      const activities: Record<string, any> = {
        possess: { type: "save", name: "The Forgotten One", damage: { includeBase: true, parts: [] } },
        destroy: { type: "save", name: "Destroying the Staff", damage: { includeBase: true, parts: [{ number: 24, denomination: 10 }] } },
      };
      staff.override.func({ enricher: { data: { system: { activities } } } });
      expect(activities.possess).toMatchObject({ activation: { type: "special" }, target: { affects: { type: "self" } }, damage: { includeBase: false, parts: [] } });
      expect(activities.destroy).toMatchObject({ range: { units: "self" }, target: { template: { type: "radius", size: "30" } }, damage: { includeBase: false } });
    });
  });

  describe("conditional weapon dice off the attack", () => {
    const parts = (e: any) => e.activity.data.damage.parts;
    const extra = (e: any, name: string) => e.additionalActivities.find((x: any) => x.init.name === name);

    it("fixes the Thunderous Greatclub's limits, Prone and Strength, and Sword of Kas's critical range", () => {
      const club = record(ItemEnrichers.ThunderousGreatclub, "Thunderous Greatclub");
      expect(club.clearAutoStatusEffect).toBe(true);
      expect(names(club)).toEqual(["Clap of Thunder", "Earthquake", "Earthquake: Concentration Save", "Earthquake: Fissure"]);
      expect(club.additionalActivities.map((a: any) => a.overrides.addItemConsume ?? false)).toEqual([false, true, false, false]);
      expect(club.effects).toEqual([expect.objectContaining({ activitiesMatch: ["Clap of Thunder", "Earthquake"], statuses: ["Prone"] })]);
      expect(record(ItemEnrichers.SwordOfKas, "Sword of Kas").activity.data.attack.critical.threshold).toBe(19);
    });

    it("moves charge, mote and choice dice into their own activities", () => {
      for (const [Enricher, name, activity] of [
        [ItemEnrichers.EldritchStaff, "Eldritch Staff", "Eldritch Attack"],
        [ItemEnrichers.Shaedenstaff, "Shaedenstaff", "Annihilating Strike"],
        [ItemEnrichers.CrosierOfDivinePower, "Crosier of Divine Power", "Radiant Mote: Damage"],
        [ItemEnrichers.StaffOfTheReverentWarrior, "Staff of the Reverent Warrior", "True Strike: Radiant"],
        [ItemEnrichers.BladeOfForlornHope, "Blade of Forlorn Hope", "Burning Corona: Radiant"],
        [ItemEnrichers.MagentanSunSaw, "Magentan Sun-Saw (Uncommon)", "Sun-Saw Trigger"],
      ] as [TEnricher, string, string][]) {
        const weapon = record(Enricher, name);
        expect(parts(weapon)).toEqual([]);
        expect(names(weapon)).toContain(activity);
      }
      expect(extra(record(ItemEnrichers.EldritchStaff, "Eldritch Staff"), "Eldritch Attack").overrides).toMatchObject({ addItemConsume: true, addConsumptionScalingMax: "min(3, @item.uses.value)" });
      expect(extra(record(ItemEnrichers.EldritchStaff, "Eldritch Staff"), "Eldritch Escape").init.type).toBe("teleport");
      expect(extra(record(ItemEnrichers.MagentanSunSaw, "Magentan Sun-Saw (Very Rare)"), "Sun-Saw Trigger").build.damageParts[0]).toMatchObject({ number: 2, denomination: 6 });
      const striking = record(ItemEnrichers.StaffOfStriking, "Staff of Striking");
      expect(parts(striking)).toEqual([]);
      expect(striking.additionalActivities[0].build.includeBaseDamage).toBe(false);
    });

    it("lights the Mace of the Black Crown and Witchlight Scimitar through a self enchantment with a light rider", () => {
      const mace = record(ItemEnrichers.MaceOfTheBlackCrown, "Mace of the Black Crown (Awakened)", "", {
        ddbDefinition: { description: "", properties: [], grantedModifiers: [{ type: "damage", subType: "fire", restriction: "", dice: { diceCount: 2, diceValue: 6 } }] },
      });
      expect(parts(mace)).toEqual([]);
      const [ablaze, light] = mace.effects;
      expect(ablaze).toMatchObject({ type: "enchant", activityMatch: "Ignite" });
      expect(ablaze.changes.map((c: any) => c.value)).toEqual(["2d6[fire]", "Extinguish"]);
      expect(ablaze.data.flags.ddbimporter.effectRiders).toEqual([light.data._id]);
      expect(light.options.transfer).toBe(true);
      expect(light.tokenChanges.slice(0, 2).map((c: any) => c.value)).toEqual(["40", "80"]);
      // the unsuffixed record carries the exalted 3d6
      expect(record(ItemEnrichers.MaceOfTheBlackCrown, "Mace of the Black Crown").effects[0].changes[0].value).toBe("3d6[fire]");
      const scimitar = record(ItemEnrichers.WitchlightScimitar, "Witchlight Scimitar");
      expect(scimitar.effects[0].changes.map((c: any) => c.value)).toEqual(["2d6[radiant]", "Douse Witchlight"]);
    });

    it("splits crits against some creatures into their own activities instead of Restriction attacks", () => {
      const dagger = record(ItemEnrichers.PurgingDagger, "Purging Dagger");
      expect(names(dagger)).toEqual(["Extra Damage vs Undead", "Crit vs Undead", "Lodged Blade", "Remove Lodged Dagger"]);
      expect(extra(dagger, "Lodged Blade").build.damageParts[0]).toMatchObject({ number: 3, denomination: 4, types: ["radiant"] });
      expect(dagger.effects[0]).toMatchObject({ activityMatch: "Crit vs Undead", options: { expiry: null } });
      const scythe = record(ItemEnrichers.SoulSearingScythe, "Soul-Searing Scythe");
      expect(parts(scythe)).toEqual([]);
      expect(names(scythe)).toEqual(["Ignite", "Crit vs Living Creatures"]);
      expect(extra(scythe, "Crit vs Living Creatures").build.saveOverride).toMatchObject({ ability: ["con"], dc: { formula: "17" } });
      expect(scythe.effects[0].changes.map((c: any) => c.value)).toEqual(["3d4[fire]", "Extinguish"]);
      expect(scythe.effects.find((e: any) => e.activityMatch === "Crit vs Living Creatures")).toMatchObject({ statuses: ["Stunned"] });
      const sword = record(ItemEnrichers.KinestheticProjection, "Kinesthetic Projection");
      expect(parts(sword)[0]).toMatchObject({ number: 1, denomination: 6, types: ["psychic"] });
      expect(names(sword)).toEqual(["Curse: Violent Nightmares", "Visceral Reach", "Visceral Pull"]);
      expect(extra(sword, "Curse: Violent Nightmares").build.targetOverride.affects.type).toBe("self");
      expect(extra(sword, "Visceral Reach").overrides.additionalConsumptionTargets[0]).toMatchObject({ type: "hitDice", value: "2" });
      expect(sword.effects[0].changes.map((c: any) => [c.key, c.value])).toEqual([
        ["system.range.reach", "15"],
        ["activities[enchant].name", "End Visceral Reach"],
        ["activities[enchant].consumption.targets", "[]"],
      ]);
    });

    it("empowers the Bloodthirster by profile and gives the Dream Shepherd its sheep save", () => {
      const sword = record(ItemEnrichers.BloodthirsterScimitar, "Bloodthirster Scimitar");
      expect(parts(sword)).toEqual([]);
      const profiles = sword.effects.filter((e: any) => e.type === "enchant");
      expect(profiles.map((e: any) => e.name)).toEqual(["Bloodthirster: Empowered +1", "Bloodthirster: Empowered +2", "Bloodthirster: Empowered +3"]);
      expect(profiles[2].changes.map((c: any) => c.value)).toEqual(["3", "3", "1d6[necrotic]", "Change or End Empowerment"]);
      const shepherd = record(ItemEnrichers.StaffOfTheDreamShepherd, "Staff of the Dream Shepherd");
      expect(parts(shepherd)).toEqual([]);
      const sheep = extra(shepherd, "Spectral Sheep");
      expect(sheep.build.saveOverride).toMatchObject({ ability: ["wis"], dc: { calculation: "spellcasting" } });
      expect(sheep.build.targetOverride.template).toMatchObject({ type: "line", size: "20", width: "10" });
      expect(shepherd.effects[0]).toMatchObject({ statuses: ["Unconscious"], options: { durationSeconds: 60 } });
      expect(names(record(ItemEnrichers.LightningKhopesh, "Lightning Khopesh"))).toEqual(["Stray Sparks"]);
      expect(record(ItemEnrichers.WitchlightVane, "Witchlight Vane").activity.data.damage.parts[0]).toMatchObject({ number: 1, denomination: 8, types: ["radiant"] });
    });
  });

  it("stops the stray primary on a parent record that does not parse as a weapon", () => {
    expect(record(ItemEnrichers.Moonblade, "Moonblade", "", { parsingType: "wondrous" }).stopDefaultActivity).toBe(true);
    expect(record(ItemEnrichers.Moonblade, "Moonblade Longsword").stopDefaultActivity).toBe(false);
  });
});

// magic-bonus wave: wondrous items, potions and rings whose DDB "magic" bonus the parser has
// nowhere to put, so each enricher has to carry it (an item without enricher effects logs an error)
describe("magic bonus items", () => {
  const rules = (effect: any) => effect.changes.map((c: any) => [c.key, c.value]);

  it("Hero's Blade enchants a weapon with +3 for a minute", () => {
    const e = build(ItemEnrichers.HerosBlade);
    expect(e.type).toBe("enchant");
    expect(e.activity.data.duration).toEqual({ value: "1", units: "minute" });
    expect(e.effects[0]).toMatchObject({ type: "enchant", magicalBonus: { bonus: "3" } });
  });

  it("Poundwise Porter's Drink applies a non-transfer +3 unarmed effect for a minute", () => {
    const e = build(ItemEnrichers.PoundwisePorter);
    expect(e.type).toBe("utility");
    expect(e.activity).toMatchObject({ name: "Drink", targetType: "self", addItemConsume: true });
    const [effect] = e.effects;
    expect(effect).toMatchObject({ activityMatch: "Drink", options: { transfer: false, durationSeconds: 60 } });
    expect(effect.changes).toHaveLength(2);
    for (const change of effect.changes) expect(change.value).toBe("3");
  });

  it("Battlechef's Splendid Saucepan is the SRD mace with thunder damage and a helmet AC toggle", () => {
    const e = build(ItemEnrichers.BattlechefsSplendidSaucepan);
    expect(e.documentStub).toMatchObject({ documentType: "weapon", systemType: { baseItem: "mace" } });
    expect(e.addAutoAdditionalActivities).toBe(false);
    expect(e.additionalActivities[0].build.damageParts[0]).toMatchObject({ number: 1, denomination: 4, types: ["thunder"] });
    expect(e.effects[0]).toMatchObject({ name: "Worn as a Helmet", options: { transfer: true, disabled: true } });
    expect(rules(e.effects[0])).toEqual([["system.attributes.ac.bonus", "1"]]);
  });

  it("Crimson Fulcrum Lens and Ring of Eldritch Ire carry their bonus as item effects", () => {
    expect(build(ItemEnrichers.CrimsonFulcrumLens).effects[0].options).toMatchObject({ transfer: true });
    const ring = build(ItemEnrichers.RingOfEldritchIre).effects[0];
    expect(ring.options).toMatchObject({ transfer: true, disabled: true });
    expect(ring.changes).toHaveLength(2);
  });

  it("The Thorn of Kren keeps the parsed saves beside its Bite", () => {
    const e = build(ItemEnrichers.TheThornOfKren);
    expect(e.keepParsedActivities).toBe(true);
    expect(e.additionalActivities[0].init).toEqual({ name: "Bite", type: "attack" });
    expect(e.additionalActivities[0].overrides.data.attack.type).toEqual({ value: "melee", classification: "unarmed" });
    expect(e.effects[0].options).toMatchObject({ transfer: true });
  });

  it("Galvanized Claw transforms the Unarmed Strike into a +1 1d8 slashing finesse claw", () => {
    const e = build(ItemEnrichers.GalvanizedClaw);
    const [transform] = e.additionalActivities;
    expect(transform.init.type).toBe("enchant");
    expect(transform.overrides.data.restrictions).toMatchObject({ type: "weapon", categories: ["natural"] });
    const [enchant] = e.effects;
    expect(enchant).toMatchObject({ type: "enchant", activityMatch: transform.init.name, magicalBonus: { bonus: "1" } });
    expect(rules(enchant)).toEqual(expect.arrayContaining([
      ["system.damage.base.denomination", "8"],
      ["system.damage.base.types", "slashing"],
      ["system.properties", "fin"],
    ]));
    // the extra lightning is a roll-time rule on the enchantment, gated on temporary hit points
    const lightning = enchant.changes.find((c: any) => c.type === "dnd5e.bonus");
    expect(lightning).toMatchObject({ key: "damage", value: "1d8[lightning]" });
    expect(JSON.parse(lightning.conditions)).toEqual({ k: "attributes.hp.temp", o: "gt", v: 0 });
  });

  it("imports DDB's Galvanized Claw state copies as weapons, named Galvanized Claw on a character", () => {
    const base = build(ItemEnrichers.GalvanizedClaw, { name: "Galvanized Claw" });
    expect(base.documentStub).toBeNull();
    expect(base.override).toBeNull();

    for (const name of ["Galvanized Claw (Transformed)", "Galvanized Claw (Untransformed)"]) {
      const copy = build(ItemEnrichers.GalvanizedClaw, { name });
      expect(copy.documentStub).toMatchObject({ documentType: "weapon", parsingType: "wondrous", systemType: { value: "simpleM" } });
      expect(copy.override.data.name).toBe("Galvanized Claw");
    }
  });

  it("only the Transformed copy enchants the Unarmed Strike on a character import", () => {
    const transformed = build(ItemEnrichers.GalvanizedClaw, { name: "Galvanized Claw (Transformed)" });
    const transfer = transformed.override.data.flags.ddbimporter.transferEnchantment;
    expect(transfer).toMatchObject({
      activityId: transformed.additionalActivities[0].overrides.id,
      effectId: transformed.effects[0].data._id,
    });
    // a natural weapon target: the claw itself is a simple weapon, so it never enchants itself
    expect(transfer.targetItemMatches).toEqual([
      { field: "type", value: "weapon" },
      { field: "system.type.value", value: "natural" },
    ]);

    const untransformed = build(ItemEnrichers.GalvanizedClaw, { name: "Galvanized Claw (Untransformed)" });
    expect(untransformed.override.data.flags.ddbimporter.transferEnchantment).toBeUndefined();
    // munched copies keep DDB's names (the compendium would merge two same-named weapons) and no flag
    const munched = build(ItemEnrichers.GalvanizedClaw, { name: "Galvanized Claw (Transformed)", ddbParser: { isMuncher: true } });
    expect(munched.override.data.name).toBeUndefined();
    expect(munched.override.data.flags.ddbimporter.transferEnchantment).toBeUndefined();
    expect(munched.documentStub).toMatchObject({ documentType: "weapon" });
    // DDB types the copies as ammunition; the base item must not survive the weapon retype
    expect(munched.override.data.system.type).toEqual({ value: "simpleM", baseItem: "" });
    expect(transformed.override.data.system.type.baseItem).toBe("");
  });
});

// DDB ships each hoopak twice (melee and "(Ranged)"); both import as the melee weapon with a Sling
describe("Hoopak", () => {
  const magic = (value: number) => ({ ddbDefinition: { grantedModifiers: [{ type: "bonus", subType: "magic", value }] } });

  it("adds a Sling ranged attack carrying the DDB magic bonus in its damage", () => {
    const sling = (options: Record<string, any>) => build(ItemEnrichers.Hoopak, { name: "Hoopak", ...options }).additionalActivities[0];
    const plain = sling({});
    expect(plain.init).toEqual({ name: "Sling", type: "attack" });
    expect(plain.overrides.data.range).toEqual({ override: true, value: "40", units: "ft" });
    expect(plain.overrides.data.attack.type).toEqual({ value: "ranged", classification: "weapon" });
    expect(plain.overrides.data.damage.parts[0]).toMatchObject({ number: 1, denomination: 4, bonus: "@mod", types: ["bludgeoning"] });
    expect(sling({ name: "Forcebreaker Hoopak", ddbParser: magic(2) }).overrides.data.damage.parts[0].bonus).toBe("@mod + 2");
  });

  it("leaves the melee copy's own weapon alone", () => {
    const e = build(ItemEnrichers.Hoopak, { name: "Hoopak of Throne's Command", ddbParser: magic(1) });
    expect(e.override).toBeNull();
    expect(e.activity).toBeNull();
    expect(e.keepParsedActivities).toBe(true);
  });

  it("reshapes the (Ranged) copy into the melee hoopak, renamed only on a character import", () => {
    const data = { system: { properties: ["amm", "fin", "spc", "two", "mgc"] } };
    const character = build(ItemEnrichers.Hoopak, { name: "Forcebreaker Hoopak (Ranged)", ddbParser: { data } });
    expect(character.activity.data.attack.type).toEqual({ value: "melee", classification: "weapon" });
    expect(character.override.data).toMatchObject({
      name: "Forcebreaker Hoopak",
      system: {
        type: { value: "martialM", baseItem: "hoopak" },
        damage: { base: { number: 1, denomination: 6, types: ["piercing"] } },
        range: { value: 5, long: null },
        ammunition: { type: "" },
        properties: ["fin", "spc", "two", "mgc"],
      },
    });
    const munched = build(ItemEnrichers.Hoopak, { name: "Hoopak (Ranged)", ddbParser: { data, isMuncher: true } });
    expect(munched.override.data.name).toBeUndefined();
    expect(munched.override.data.system.type.value).toBe("martialM");
  });
});

// trick weapons (item/_TrickWeapon.ts): every DDB copy is one weapon with a Transform self-enchant
describe("trick weapons", () => {
  const changes = (effect: any) => Object.fromEntries(effect.changes.map((c: any) => [c.key, c.value]));

  it("imports every copy as the Untransformed weapon, named and pre-transformed only on a character", () => {
    const base = build(ItemEnrichers.DreamExecutioner, { name: "Dream Executioner" });
    expect(base.documentStub).toMatchObject({ documentType: "weapon", parsingType: "weapon", systemType: { value: "martialM", baseItem: "" } });
    expect(base.override.data).toMatchObject({
      name: "Dream Executioner",
      system: {
        damage: { base: { number: 1, denomination: 10, types: ["slashing"] } },
        properties: ["fin", "rch", "two", "mgc"],
        mastery: "cleave",
        range: { value: 10 },
        magicalBonus: 1,
      },
    });
    expect(base.override.data.flags.ddbimporter.transferEnchantment).toBeUndefined();

    const maul = build(ItemEnrichers.DreamExecutioner, { name: "Dream Executioner (Maul)" });
    expect(maul.override.data.flags.ddbimporter.transferEnchantment).toEqual({
      targetItemId: "self",
      effectId: maul.effects[0].data._id,
      activityId: "ddbItemTransform",
    });

    const munched = build(ItemEnrichers.DreamExecutioner, { name: "Dream Executioner (Maul)", ddbParser: { isMuncher: true } });
    expect(munched.override.data.name).toBeUndefined();
    expect(munched.override.data.flags.ddbimporter.transferEnchantment).toBeUndefined();
    // a munched copy keeps DDB's suffixed name, so the form takes the weapon's name, not "{} (Maul)"
    expect(munched.effects[0].changes.find((c: any) => c.key === "name").value).toBe("Dream Executioner (Maul)");
    expect(maul.effects[0].changes.find((c: any) => c.key === "name").value).toBe("{} (Maul)");
  });

  it("switches to the Transformed form with a self-enchant that renames itself to revert", () => {
    const e = build(ItemEnrichers.Revelations, { name: "Revelations" });
    const transform = e.additionalActivities[0];
    expect(transform.init).toMatchObject({ name: "Transform", type: "enchant" });
    expect(transform.overrides).toMatchObject({ activationType: "bonus", data: { enchant: { self: true } } });
    const enchant = e.effects[0];
    expect(enchant).toMatchObject({ type: "enchant", activityMatch: "Transform" });
    expect(changes(enchant)).toMatchObject({
      "name": "{} (Whip)",
      "system.type.baseItem": "whip",
      "system.damage.base.denomination": "6",
      "system.mastery": "slow",
      "activities[enchant].name": "Revert to Cleaver",
    });
    // properties change one by one (Cleaver hvy/ver to Whip rch/ver); mgc is never touched
    const props = enchant.changes.filter((c: any) => c.key === "system.properties").map((c: any) => c.value);
    expect(props).toEqual(["rch", "-hvy"]);
    expect(JSON.parse(changes(enchant)["system.damage.versatile"])).toMatchObject({ number: 1, denomination: 8 });
  });

  it("adds form-only hit damage as a rule limited to the weapon's attacks", () => {
    const rule = build(ItemEnrichers.OrphansCradle, { name: "Orphan's Cradle" }).effects[0].changes
      .find((c: any) => c.type === "dnd5e.bonus");
    expect(rule).toMatchObject({ key: "damage", value: "2d6[fire]" });
    expect(JSON.parse(rule.conditions)).toEqual({ k: "activity.type", o: "exact", v: "attack" });
  });

  it("switches the attack type when the forms differ (Unstable Crumbler's Cannon to Maul)", () => {
    const e = build(ItemEnrichers.UnstableCrumbler, { name: "Unstable Crumbler (Cannon)" });
    expect(e.activity.data.attack.type.value).toBe("ranged");
    expect(changes(e.effects[0])["activities[attack].attack.type.value"]).toBe("melee");
    expect(e.effects[0].changes.filter((c: any) => c.key === "system.properties").map((c: any) => c.value))
      .toEqual(["hvy", "-amm"]);
  });

  it("gives Ravenous Gazer's Transformed bonuses as a rider of the enchantment", () => {
    const e = build(ItemEnrichers.RavenousGazer, { name: "Ravenous Gazer" });
    const rider = e.effects.find((x: any) => x.name === "Ravenous Gazer: Transformed Bonuses");
    expect(rider.options.transfer).toBe(true);
    expect(e.effects[0].data.flags.ddbimporter.effectRiders).toEqual([rider.data._id]);
    expect(e.override.data.system.proficient).toBe(1);
  });

  it("gives the Meat Hookshot a Blunderbuss attack and a Transformed-only Hookshot", () => {
    const e = build(ItemEnrichers.MeatHookshot, { name: "Meat Hookshot (Blunderbuss)" });
    expect(e.override.data).toMatchObject({
      name: "Meat Hookshot",
      system: { type: { value: "simpleM", baseItem: "sickle" }, properties: ["lgt", "fin"], mastery: "nick" },
    });
    expect(e.override.data.flags.ddbimporter.transferEnchantment).toBeUndefined();
    const names = e.additionalActivities.map((a: any) => a.init.name);
    expect(names).toEqual(["Transform", "Blunderbuss", "Hookshot", "Hookshot: Pull"]);
    const blunderbuss = e.additionalActivities[1];
    expect(blunderbuss.overrides).toMatchObject({ noConsumeTargets: true, data: { range: { value: "20" }, attack: { type: { value: "ranged" } } } });
    // the hookshot and its pull save only exist while Transformed
    const riders = e.effects[0].data.flags.ddbimporter.activityRiders;
    expect(riders).toEqual([e.additionalActivities[2].init.id, e.additionalActivities[3].init.id]);
    expect(changes(e.effects[0])).toMatchObject({ "system.type.baseItem": "battleaxe", "system.damage.base.denomination": "10" });
    expect(e.effects[0].changes.filter((c: any) => c.key === "system.properties").map((c: any) => c.value))
      .toEqual(["two", "-lgt", "-fin"]);

    const battleaxe = build(ItemEnrichers.MeatHookshot, { name: "Meat Hookshot (Battleaxe)" });
    expect(battleaxe.override.data.flags.ddbimporter.transferEnchantment.effectId).toBe(battleaxe.effects[0].data._id);
  });

  it.each([
    ["RavenousGazer", "Ravenous Gazer", ["Feed the Gazer"]],
    ["DreamExecutioner", "Dream Executioner", ["Soul Explosion"]],
    ["Revelations", "Revelations", ["Crush"]],
    ["ShardOfMoonlight", "Shard of Moonlight", ["Revealing Glow", "Transient Moonlight", "Lunar Explosion"]],
    ["OrphansCradle", "Orphan's Cradle", ["Fanned Flames", "Withering Flames"]],
  ])("hides %s's Transformed-only activities until it transforms", (key, name, transformedOnly) => {
    const e = build((ItemEnrichers as Record<string, any>)[key], { name });
    const ids = transformedOnly.map((n) => e.additionalActivities.find((a: any) => a.init.name === n)?.init.id);
    expect(ids.every(Boolean)).toBe(true);
    expect(e.effects[0].data.flags.ddbimporter.activityRiders).toEqual(ids);
  });

  it.each([
    ["StaffOfTheAdder", "Staff of the Adder", "Awaken Snake Head", ["Attack with Snake"]],
    ["SpellSlingersPuppet", "Spell Slinger's Puppet", "Levitate Doll", ["Move Doll"]],
  ])("%s hides its follow-ups until it is activated", (key, name, activation, followUps) => {
    const e = build((ItemEnrichers as Record<string, any>)[key], { name });
    const activities = [e.activity, ...e.additionalActivities];
    const ids = followUps.map((n) => {
      const activity = e.additionalActivities.find((a: any) => a.init?.name === n);
      return activity?.init?.id ?? activity?.overrides?.id;
    });
    expect(ids.every(Boolean)).toBe(true);
    const profile = e.effects.find((f: any) => f.type === "enchant" && f.activityMatch === activation);
    expect(profile.options.transfer).toBe(false);
    expect(profile.data.flags.ddbimporter.activityRiders).toEqual(ids);
    expect(activities.filter((a: any) => (a?.init?.type ?? e.type) === "enchant")).toHaveLength(1);
  });

  it("swaps Dawn and Dusk's Radiant for Necrotic in its Sickle form", () => {
    const e = build(ItemEnrichers.DawnAndDusk, { name: "Dawn and Dusk" });
    expect(e.activity.data.damage.parts[0]).toMatchObject({ number: 1, denomination: 4, types: ["radiant"] });
    expect(changes(e.effects[0])["system.damage.parts"]).toBe(`[["1d6", "necrotic"]]`);
    expect(e.additionalActivities[0].overrides.activationType).toBe("special");
  });
});

// Precipit, the Formless: one State Change self-enchant whose profiles carry each state's riders
describe("PrecipitTheFormless", () => {
  const Enricher = ItemEnrichers.PrecipitTheFormless;
  const byName = (list: any[], name: string) => list.find((x: any) => (x.init?.name ?? x.name) === name);

  it("offers one profile per state, each with its own effect and activity riders", () => {
    const e = build(Enricher, { name: "Precipit, the Formless" });
    const profiles = e.effects.filter((x: any) => x.type === "enchant");
    expect(profiles.map((p: any) => p.name)).toEqual([
      "Precipit, the Formless: Gas", "Precipit, the Formless: Liquid", "Precipit, the Formless: Solid",
    ]);
    expect(profiles.every((p: any) => p.activityMatch === "State Change")).toBe(true);
    // a state's activity name says that choosing it again ends it
    expect(profiles[0].changes).toContainEqual(expect.objectContaining({ key: "activities[enchant].name", value: "Change or End Gas State" }));

    const solid = profiles[2].data.flags.ddbimporter;
    const solidEffect = e.effects.find((x: any) => x.data?._id === solid.effectRiders[0]);
    expect(solidEffect.name).toBe("Precipit, the Formless: Solid State");
    expect(solidEffect.options.transfer).toBe(true);
    expect(solidEffect.changes.find((c: any) => c.key === "system.attributes.ac.bonus").value).toBe("3");

    const riderNames = solid.activityRiders.map((id: string) => e.additionalActivities.find((a: any) => a.init.id === id).init.name);
    expect(riderNames).toEqual(["Cone of Cold", "Ice Storm", "Ray of Frost", "Wall of Ice", "Deep Freeze", "Ray of Frost (Level 5)", "Frozen Shell"]);
    // the level 5 ray is an attack for 1 charge: dnd5e scales a cantrip cast by character level only
    const ray = e.additionalActivities.find((a: any) => a.init.name === "Ray of Frost (Level 5)");
    expect(ray.init.type).toBe("attack");
    expect(ray.overrides).toMatchObject({ addItemConsume: true, itemConsumeValue: "1" });
    expect(ray.overrides.data.attack).toMatchObject({ bonus: "10", flat: true });
    expect(ray.overrides.data.damage.parts[0]).toMatchObject({ number: 2, denomination: 8, types: ["cold"] });
    expect(e.effects.find((x: any) => x.activityMatch === "Ray of Frost (Level 5)").changes[0].value).toBe("-10");

    // every activity id is distinct, so no rider replaces another
    const ids = e.additionalActivities.map((a: any) => a.init.id);
    expect(new Set(ids).size).toBe(ids.length);
    // the State Change and its Reaction form are never riders
    const allRiders = profiles.flatMap((p: any) => p.data.flags.ddbimporter.activityRiders);
    expect(allRiders).not.toContain(e.additionalActivities[0].init.id);
    expect(allRiders).not.toContain(e.additionalActivities[1].init.id);
  });

  it("casts each state's spells for their charges at the printed DC", () => {
    const e = build(Enricher, { name: "Precipit, the Formless" });
    const cloudkill = byName(e.additionalActivities, "Cloudkill");
    expect(cloudkill.init.type).toBe("cast");
    expect(cloudkill.overrides).toMatchObject({ addSpellUuid: "Cloudkill", addItemConsume: true, itemConsumeValue: "5" });
    expect(cloudkill.build.spellOverride.challenge).toMatchObject({ save: "18", override: true });
    expect(byName(e.additionalActivities, "Ray of Frost").build.spellOverride.challenge).toMatchObject({ save: "18", attack: "10" });
    expect(byName(e.additionalActivities, "Ray of Frost").overrides).toMatchObject({ addItemConsume: false, noConsumeTargets: true });
    const reaction = byName(e.additionalActivities, "State Change (Reaction)");
    expect(reaction.overrides).toMatchObject({ addItemConsume: true, itemConsumeValue: "1", data: { activity: { id: e.additionalActivities[0].init.id } } });
  });

  it("imports a state copy already in its state on a character only", () => {
    const gas = build(Enricher, { name: "Precipit, the Formless (Gas)" });
    expect(gas.override.data.name).toBe("Precipit, the Formless");
    const gasProfile = gas.effects.find((x: any) => x.name === "Precipit, the Formless: Gas");
    expect(gas.override.data.flags.ddbimporter.transferEnchantment).toEqual({
      targetItemId: "self",
      effectId: gasProfile.data._id,
      activityId: gas.additionalActivities[0].init.id,
    });
    expect(build(Enricher, { name: "Precipit, the Formless" }).override.data.flags.ddbimporter.transferEnchantment).toBeUndefined();
    const munched = build(Enricher, { name: "Precipit, the Formless (Gas)", ddbParser: { isMuncher: true } });
    expect(munched.override.data.name).toBeUndefined();
    expect(munched.override.data.flags.ddbimporter.transferEnchantment).toBeUndefined();
    const munchedSolid = munched.effects.find((x: any) => x.name === "Precipit, the Formless: Solid");
    expect(munchedSolid.changes[0]).toMatchObject({ key: "name", value: "Precipit, the Formless (Solid)" });
  });
});

// The wands' hand-built activities copy spells the item also casts. cleanup() runs after the item
// spells became cast activities and drops the copy only when the cast is really there.
describe("hand-built activities copied by an item cast", () => {
  const withActivities = (activities: Record<string, any>) => ({ system: { activities } });

  it("drops Wand of Fireballs' save once the Fireball cast exists, and keeps it without one", async () => {
    const data = withActivities({
      saveWandOfFire: { type: "save" },
      castFireWand: { type: "cast", name: "Fireball (Wand of Fireballs)" },
    });
    await build(ItemEnrichers.WandOfFireballs, { data }).cleanup();
    expect(Object.keys(data.system.activities)).toEqual(["castFireWand"]);

    const noCast = withActivities({ saveWandOfFire: { type: "save" } });
    await build(ItemEnrichers.WandOfFireballs, { data: noCast }).cleanup();
    expect(Object.keys(noCast.system.activities)).toEqual(["saveWandOfFire"]);
  });

  it("matches the 2014 cast name with its (Legacy) suffix", async () => {
    const data = withActivities({
      damageWandMagic: { type: "damage" },
      castMagicMiss: { type: "cast", name: "Magic Missile (Wand of Magic Missiles) (Legacy)" },
    });
    await build(ItemEnrichers.WandOfMagicMissiles, { data, is2014: true }).cleanup();
    expect(Object.keys(data.system.activities)).toEqual(["castMagicMiss"]);
  });

  it("keeps the 2014 Cone of Fear, which no cast replaces, and drops both copies in 2024", async () => {
    const legacy = withActivities({
      command: { type: "save", name: "Command" },
      cone: { type: "save", name: "Cone of Fear" },
      castCommand: { type: "cast", name: "Command (Wand of Fear) (Legacy)" },
    });
    await build(ItemEnrichers.WandOfFear, { data: legacy, is2014: true }).cleanup();
    expect(Object.keys(legacy.system.activities)).toEqual(["cone", "castCommand"]);

    const modern = withActivities({
      command: { type: "save", name: "Command" },
      cone: { type: "save", name: "Cone of Fear" },
      castCommand: { type: "cast", name: "Command (Wand of Fear)" },
      castFear: { type: "cast", name: "Fear (Wand of Fear)" },
    });
    await build(ItemEnrichers.WandOfFear, { data: modern }).cleanup();
    expect(Object.keys(modern.system.activities)).toEqual(["castCommand", "castFear"]);
  });
});

describe("BrambleheartQuiver", () => {
  const quiver = () => build(ItemEnrichers.BrambleheartQuiver, {
    name: "Brambleheart Quiver",
    ddbParser: { originalName: "Brambleheart Quiver", ddbDefinition: { description: "", properties: [] }, ddbItem: { chargesUsed: 0 }, data: { system: { uses: {} } } },
  });

  it("imports as a plain wondrous item, not a container", async () => {
    const { EQUIPMENT } = await import("../../../src/config/dictionary/items/equipment");
    expect(EQUIPMENT.NON_CONTAINERS).toContain("Brambleheart Quiver");
  });

  it("tracks the grown arrows as uses and enchants a picked arrow with +2", () => {
    const enricher = quiver();
    expect(enricher.override.uses.max).toBe("4");
    expect(enricher.override.uses.recovery[0].formula).toBe("1d3 + 1");
    const pick = enricher.additionalActivities[0];
    expect(pick.overrides.data.restrictions).toMatchObject({ type: "consumable", categories: ["ammo"] });
    expect(pick.overrides.itemConsumeValue).toBe("1");
    expect(enricher.effects[0]).toMatchObject({ type: "enchant", activityMatch: "Pick a Magic Arrow", magicalBonus: { bonus: "2" } });
  });

  it("grows a Spike Growth field from the command word until the start of your next turn", () => {
    const activities = quiver().additionalActivities;
    expect(activities.map((a: any) => a.init.name)).toEqual(["Pick a Magic Arrow", "Thorn Command", "Thorn Field", "Thorn Field: Movement Damage"]);
    const field = activities[2];
    expect(field.build.targetOverride.template).toMatchObject({ type: "radius", size: "20" });
    expect(field.build.durationOverride).toMatchObject({ units: "round", value: "1" });
    expect(field.overrides.data.behaviors).toHaveLength(2);
  });
});
