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
