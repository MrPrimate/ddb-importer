/**
 * Pins for the Arcana Unleashed evolving-item property table: the compendium ids must stay
 * unique and stable, a "<Property> <Base>" item must receive exactly its property as an
 * applied enchantment with riders and activities, the family root must only seed the
 * compendiums, and the host feats must wire their enchant activity to every rider.
 */
const loggerMock = vi.hoisted(() => ({
  warn: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  verbose: vi.fn(),
}));

vi.mock("../../../src/lib/_module", async () => ({
  logger: loggerMock,
  utils: (await vi.importActual<any>("../../../src/lib/Utils")).default,
  CompendiumHelper: { getCompendiumType: vi.fn(() => null), retrieveCompendiumSpellReferences: vi.fn(async () => []) },
  DDBCompendiumFolders: class {},
  DDBItemImporter: { buildHandler: vi.fn() },
}));
vi.mock("../../../src/parser/spells/CharacterSpellFactory", () => ({ default: class {} }));
vi.mock("../../../src/parser/spells/DDBSpell", () => ({ default: class {} }));
vi.mock("../../../src/parser/lib/_module", () => ({
  DDBDataUtils: {
    findSubClassByFeatureId: vi.fn(),
    classIdentifierName: (name: string) => name,
    getLimitedUses: vi.fn(),
  },
  DDBTemplateStrings: {
    parse: vi.fn((_ddb: any, _raw: any, text: string) => ({ text })),
  },
}));
vi.mock("../../../src/parser/enrichers/effects/_module", async () => ({
  AutoEffects: { effectModules: () => ({ ac5eInstalled: false }) },
  EnchantmentEffects: {},
  ChangeHelper: (await vi.importActual<any>("../../../src/parser/enrichers/effects/ChangeHelper")).default,
  EffectGenerator: {},
}));

import EvolvedItem from "../../../src/parser/enrichers/item/EvolvedItem";
import EvolvedItemProperties, { EVOLVED_PROPERTIES } from "../../../src/parser/enrichers/item/_EvolvedItemProperties";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

function enricherFor(name: string): EvolvedItem {
  return makeEnricherData(EvolvedItem, { name, actions: null });
}

function property(name: string) {
  return EvolvedItemProperties.byName(name)!;
}

const RIDER_COUNT = 1 + 1 + 1 + 1 + 6 + 9;
const STANDALONE_COUNT = EVOLVED_PROPERTIES.length + RIDER_COUNT;

describe("Evolved item property table", () => {
  it("carries the three printed tables", () => {
    const tiers = EVOLVED_PROPERTIES.reduce((acc, p) => ({ ...acc, [p.tier]: (acc[p.tier] ?? 0) + 1 }), {} as Record<string, number>);
    expect(tiers).toEqual({ rare: 12, veryRare: 12, legendary: 10 });
  });

  it("derives unique 16 character compendium ids for every enchantment, rider, host and activity", () => {
    const ids = EvolvedItemProperties.standaloneHints().map((hint) => hint.raw?._id as string);
    expect(ids).toHaveLength(STANDALONE_COUNT);
    for (const hint of EvolvedItemProperties.standaloneHints()) {
      expect(hint.standalone).toBe(true);
      expect(hint.raw?.flags?.ddbimporter?.parent?.name).toBe("Evolved Magic Item Properties");
    }
    for (const p of EVOLVED_PROPERTIES) {
      ids.push(EvolvedItemProperties.hostItemId(p), EvolvedItemProperties.enchantActivityId(p), EvolvedItemProperties.activityEffectId(p));
      ids.push(...EvolvedItemProperties.rawActivities(p).map((raw) => raw.id));
    }
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toHaveLength(16);
      expect(id.startsWith("ddb")).toBe(true);
    }
  });

  it("finds a property from the item name prefix only", () => {
    expect(EvolvedItemProperties.find("Studious Blade of the Guardian")?.name).toBe("Studious");
    expect(EvolvedItemProperties.find("Far-Seeing Rod of the Honed Mind")?.name).toBe("Far-Seeing");
    expect(EvolvedItemProperties.find("Blade of the Guardian")).toBeUndefined();
  });

  it("prefers the proxy-served printed text over the shipped paraphrase", () => {
    const resistant = property("Resistant");
    expect(EvolvedItemProperties.text(resistant)).toBe(resistant.text);
    const config = (globalThis as any).CONFIG;
    config.DDB = { EVOLVED_PROPERTIES: { Resistant: "Printed Resistant text.", Vigilant: "" } };
    try {
      expect(EvolvedItemProperties.text(resistant)).toBe("Printed Resistant text.");
      // a blank served entry falls back rather than blanking the description
      expect(EvolvedItemProperties.text(property("Vigilant"))).toBe(property("Vigilant").text);
      expect(EvolvedItemProperties.text(property("Studious"))).toBe(property("Studious").text);
      const effect = EvolvedItemProperties.enchantmentEffect(resistant);
      expect(effect.description).toContain("Printed Resistant text.");
      expect(effect.system?.changes?.find((c) => c.key === "system.description.value")?.value).toContain("Printed Resistant text.");
      expect(EvolvedItemProperties.hostItem(resistant).system.description.value).toContain("Printed Resistant text.");
    } finally {
      delete config.DDB;
    }
  });

  it("builds an enchantment that renames, re-rarities and describes the item", () => {
    const effect = EvolvedItemProperties.enchantmentEffect(property("Resistant"));
    expect(effect.type).toBe("enchantment");
    expect(effect.transfer).toBe(false);
    expect(effect.system?.changes?.map((c) => [c.key, c.type, c.value])).toEqual([
      ["name", "add", "Resistant {}"],
      ["system.rarities", "override", "veryRare"],
      ["system.properties", "add", "mgc"],
      ["system.description.value", "override", expect.stringContaining("{}<p><strong>Resistant.</strong>")],
      ["system.attunement", "override", "required"],
    ]);
  });
});

describe("EvolvedItem enricher", () => {
  it("seeds the whole compendium table from the family root without applying anything", () => {
    const enricher = enricherFor("Blade of the Guardian");
    expect(enricher.clearAutoEffects).toBe(false);
    expect(enricher.effects).toHaveLength(STANDALONE_COUNT);
    expect(enricher.effects.every((hint) => hint.standalone)).toBe(true);
    expect(enricher.additionalActivities).toEqual([]);
  });

  it("applies Studious as a transfer enchantment with a three-use daily roll", () => {
    const enricher = enricherFor("Studious Blade of the Guardian");
    expect(enricher.clearAutoEffects).toBe(true);
    const applied = enricher.effects.filter((hint) => !hint.standalone);
    expect(applied).toHaveLength(1);
    const enchantment = applied[0].raw!;
    const studious = property("Studious");
    expect(enchantment.type).toBe("enchantment");
    expect(enchantment.transfer).toBe(true);
    expect(enchantment._id).toBe(EvolvedItemProperties.enchantmentId(studious));
    expect(enchantment.flags.ddbimporter.enchantmentOrigin).toEqual({
      itemId: EvolvedItemProperties.hostItemId(studious),
      activityId: EvolvedItemProperties.enchantActivityId(studious),
      profileId: enchantment._id,
    });
    expect(enchantment.flags.ddbimporter.parent).toBeUndefined();
    // DDB already prefixed the name and printed the property text
    expect(enchantment.system.changes.map((c: any) => c.key)).toEqual(["system.rarities", "system.properties"]);

    const activities = enricher.additionalActivities;
    expect(activities).toHaveLength(1);
    expect(activities[0].init).toEqual({ name: "Studious: Add 1d6", type: "utility" });
    const data = activities[0].overrides?.data as any;
    expect(data.roll.formula).toBe("1d6");
    expect(data.consumption.targets).toEqual([{ type: "activityUses", target: "", value: "1", scaling: { mode: "", formula: "" } }]);
    expect(data.uses).toEqual({ spent: 0, max: "3", recovery: [{ period: "dawn", type: "recoverAll" }] });
    expect(data.flags.dnd5e.dependentOn).toBe(enchantment._id);
  });

  it("gives Withering two casts with their own daily use and the printed DC and attack", () => {
    const activities = enricherFor("Withering Blade of the Guardian").additionalActivities;
    expect(activities.map((a) => a.init?.name)).toEqual(["Cast Blight", "Cast Vampiric Touch"]);
    for (const activity of activities) {
      expect(activity.init?.type).toBe("cast");
      expect(activity.build?.generateCast).toBe(true);
      expect(activity.overrides?.addSpellUuid).toBe(activity.init?.name.replace("Cast ", ""));
      expect((activity.overrides?.data as any).spell.challenge).toEqual({ save: "17", attack: "9", override: true });
      expect((activity.overrides?.data as any).uses.max).toBe("1");
    }
    expect(activities[0].overrides?.id).not.toBe(activities[1].overrides?.id);
  });

  it("shares Restorative's single daily use between both casts", () => {
    const activities = enricherFor("Restorative Wand of Celestial Prowess").additionalActivities;
    expect(activities.map((a) => a.init?.name)).toEqual(["Cast Cure Wounds", "Cast Lesser Restoration"]);
    expect((activities[0].overrides?.data as any).uses).toBeDefined();
    expect((activities[0].overrides?.data as any).consumption.targets).toHaveLength(1);
    expect((activities[1].overrides?.data as any).uses).toBeUndefined();
    expect((activities[1].overrides?.data as any).consumption).toBeUndefined();
  });

  it("skips the casts DDB already ships as item spells", () => {
    const itemSpells = [
      { name: "Moonbeam", flags: { ddbimporter: { originalName: "Moonbeam", dndbeyond: { lookup: "item", lookupId: 11914391 } } } },
      { name: "Fount of Moonlight", flags: { ddbimporter: { dndbeyond: { lookup: "item", lookupId: 99 } } } },
    ];
    const enricher = makeEnricherData(EvolvedItem, {
      name: "Lunar Wand of Celestial Prowess",
      actions: null,
      ddbParser: { ddbDefinition: { id: 11914391 }, raw: { itemSpells } },
    });
    expect(enricher.shippedSpellNames).toEqual(["Moonbeam"]);
    expect(enricher.additionalActivities.map((a) => a.init?.name)).toEqual(["Cast Fount of Moonlight"]);
  });

  it("ships Resistant as nine disabled toggles hanging off the enchantment", () => {
    const enricher = enricherFor("Resistant Blade of the Guardian");
    const riders = enricher.effects.filter((hint) => !hint.standalone && hint.raw?.type !== "enchantment");
    expect(riders).toHaveLength(9);
    for (const rider of riders) {
      expect(rider.raw?.disabled).toBe(true);
      expect(rider.raw?.transfer).toBe(true);
      expect(rider.raw?.flags?.dnd5e?.dependentOn).toBe(EvolvedItemProperties.enchantmentId(property("Resistant")));
      expect(rider.raw?.system?.changes?.[0]?.key).toBe("system.traits.dr.value");
    }
    expect(enricher.additionalActivities).toEqual([]);
  });

  it("dual-arms Spellguarding and scopes Quickening's disadvantage to reaction attacks", () => {
    const spellguarding = enricherFor("Spellguarding Breastplate of the Tyrant").effects
      .find((hint) => !hint.standalone && hint.raw?.name === "Spellguarding Ward")!;
    expect(spellguarding.raw?.system?.changes?.[0]).toMatchObject({ key: "save", type: "dnd5e.advantage" });
    expect(spellguarding.ac5eChanges?.[0]?.value).toBe("isSpell || isMagical");
    expect(spellguarding.midiChanges?.[0]?.key).toBe("flags.midi-qol.magicResistance.all");

    const velocity = enricherFor("Quickening Rod of the Honed Mind").effects.find((hint) => hint.name === "Magical Velocity")!;
    expect(velocity.activityMatch).toBe("Quickening: Infuse Velocity");
    expect(velocity.options?.transfer).toBe(false);
    expect(velocity.ac5eChanges?.[0]?.value).toBe("activity.activation.type === 'reaction'");
    expect((velocity.data as any).flags.dnd5e.dependentOn).toBeDefined();
  });
});

describe("Evolved item host feats", () => {
  it("builds one enchant activity per property whose profile lists every rider", () => {
    const hosts = EvolvedItemProperties.hostItems({ spellUuids: { "blight": "Compendium.world.spells.Item.blight0000000000" } });
    expect(hosts).toHaveLength(EVOLVED_PROPERTIES.length);
    for (const host of hosts) {
      const p = property(host.flags.ddbimporter!.evolvedProperty as string);
      expect(host.type).toBe("feat");
      expect(host.system.type.value).toBe("enchantment");
      expect(host.flags.ddbimporter!.isEffectItem).toBe(true);
      expect(host.flags.ddbimporter!.effectName).toBe("Evolved Magic Item Properties");
      const enchant = host.system.activities[EvolvedItemProperties.enchantActivityId(p)] as any;
      expect(enchant.type).toBe("enchant");
      // the rule travels with every activity so a copy onto another item keeps its text
      const paragraph = EvolvedItemProperties.descriptionHtml(p);
      expect(host.system.description.value.startsWith(paragraph)).toBe(true);
      for (const activity of Object.values(host.system.activities) as any[]) {
        expect(activity.description.value).toBe(paragraph);
      }
      // and the enchantment appends the same paragraph to whatever it is applied to
      const descriptionChange = host.effects!.find((e) => e._id === EvolvedItemProperties.enchantmentId(p))!.system!.changes!
        .find((c) => c.key === "system.description.value")!;
      expect(descriptionChange.type).toBe("override");
      expect(descriptionChange.value).toMatch(/^\{\}<p>/);
      expect(enchant.restrictions.allowMagical).toBe(true);
      expect(enchant.enchant.self).toBe(false);
      const profile = enchant.effects[0];
      expect(profile._id).toBe(EvolvedItemProperties.enchantmentId(p));
      expect(host.effects!.find((e) => e._id === profile._id)?.type).toBe("enchantment");
      // every rider the profile names exists on the host and is suppressed there
      for (const id of profile.riders.activity) expect(host.system.activities[id]).toBeDefined();
      for (const id of profile.riders.effect) expect(host.effects!.find((e) => e._id === id)?.transfer).toBe(true);
      expect(host.flags.dnd5e!.riders).toEqual({ activity: profile.riders.activity, effect: profile.riders.effect });
    }
  });

  it("links cast activities to the compendium spell and utilities to their applied effect", () => {
    const withering = EvolvedItemProperties.hostItem(property("Withering"), { spellUuids: { "blight": "Compendium.world.spells.Item.blight0000000000" } });
    const casts = Object.values(withering.system.activities).filter((a: any) => a.type === "cast") as any[];
    expect(casts.map((a) => a.spell.uuid)).toEqual(["Compendium.world.spells.Item.blight0000000000", undefined]);
    expect(casts[0].spell.challenge).toEqual({ save: "17", attack: "9", override: true });
    expect(casts[0].uses.max).toBe("1");

    const quickening = EvolvedItemProperties.hostItem(property("Quickening"), { modules: { ac5e: true } });
    const velocityId = EvolvedItemProperties.activityEffectId(property("Quickening"));
    const infuse = Object.values(quickening.system.activities).find((a: any) => a.type === "utility") as any;
    expect(infuse.effects).toEqual([{ _id: velocityId, level: { min: null, max: null } }]);
    expect(infuse.duration).toMatchObject({ value: "1", units: "minute", concentration: true });
    const velocity = quickening.effects!.find((e) => e._id === velocityId)!;
    expect(velocity.transfer).toBe(false);
    expect(velocity.duration).toEqual({ value: 60, units: "seconds", expiry: "turnStart" });
    expect(velocity.system?.changes?.map((c) => c.key)).toEqual(["system.attributes.movement.multiplier", "flags.automated-conditions-5e.grants.attack.disadvantage"]);
    // the activity effect is carried by its activity, not the profile's rider list
    const enchant = quickening.system.activities[EvolvedItemProperties.enchantActivityId(property("Quickening"))] as any;
    expect(enchant.effects[0].riders.effect).not.toContain(velocityId);
  });
});
