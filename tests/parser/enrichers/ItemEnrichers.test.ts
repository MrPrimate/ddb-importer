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

type TEnricher = new (options: any) => any;

beforeAll(async () => {
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
    expect(build(Enricher).override.uses.autoDestroy).toBe(false);
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

describe("hazard gear regions", () => {
  it("Caltrops save on entry with the speed rider", () => {
    const e = build(ItemEnrichers.Caltrops);
    expect(e.activity.data.save.dc.formula).toBe("15");
    expect(e.activity.data.behaviors[0].config.events).toEqual(["tokenEnter"]);
    expect(build(ItemEnrichers.Caltrops).effects[0].changes[0].key).toBe("system.attributes.movement.multiplier");
    expect(build(ItemEnrichers.Caltrops, { is2014: true }).effects[0].changes[0].key).toBe("system.attributes.movement.bonus");
  });

  it("Ball Bearings prone save on entry", () => {
    const e = build(ItemEnrichers.BallBearings);
    expect(e.activity.data.save.dc.formula).toBe("10");
    expect(e.activity.data.behaviors[0].config.events).toEqual(["tokenEnter"]);
    expect(e.effects[0].statuses).toEqual(["Prone"]);
  });

  it("Oil douses a space that burns on entry or turn end when lit", () => {
    const e = build(ItemEnrichers.Oil);
    const macro = e.activity.data.behaviors.find((b: any) => b.type === "ddbMacro");
    expect(macro.config.events).toEqual(["tokenEnter", "tokenTurnEnd"]);
    expect(macro.config.args.activityName).toBe("Burning Oil Damage");
    expect(e.additionalActivities.map((a: any) => a.init.name)).toEqual(["Burning Oil Damage", "Douse a Creature"]);
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
    const enricher = build(ItemEnrichers.DemonPaddedArmor, { name: "Demon Padded Armor" });
    const [bonusEffect, enchantEffect] = enricher.effects;

    // the +1 needs no user action
    expect((bonusEffect.changes ?? []).map((c: any) => `${c.key}:${c.value}`)).toEqual(["attack:1", "damage:1"]);
    expect(JSON.parse(String(bonusEffect.changes[0].conditions))).toEqual(unarmed);

    // the 1d8 slashing rewrites the strike, which only an enchantment can do
    expect(enchantEffect.type).toBe("enchant");
    expect((enchantEffect.changes ?? []).map((c: any) => `${c.key}=${c.value}`)).toEqual([
      "system.damage.base.number=1",
      "system.damage.base.denomination=8",
      "system.damage.base.types=slashing",
      // a "-" prefixed value removes the entry from the Set
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
