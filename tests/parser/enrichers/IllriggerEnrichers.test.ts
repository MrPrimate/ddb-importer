/**
 * Illrigger (MCDM) enricher branches the audit captures cannot reach on their own: the chosen
 * option paths (Master of Hell, Terrorizing Force), the muncher fallbacks with no choice, and the
 * cross-feature lookup Infernal Majesty makes for the Terrorizing Force damage type.
 *
 * These assert the enricher hints, not the built document.
 */
import * as ClassEnrichers from "../../../src/parser/enrichers/class/_module";
import DDBEnricherData from "../../../src/parser/enrichers/data/DDBEnricherData";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

const Illrigger = ClassEnrichers.Illrigger;

function build(Enricher: new (options: any) => any, options: Parameters<typeof makeEnricherData>[1] = {}): any {
  return makeEnricherData(Enricher, options);
}

describe("illrigger InterdictBoons", () => {
  it("builds nothing on the parent so each boon document supplies its own activities", () => {
    const e = build(Illrigger.InterdictBoons);
    expect(e.type).toBe("none");
    expect(e.useDefaultAdditionalActivities).toBe(false);
  });
});

describe("illrigger MasterOfHell", () => {
  it("builds every hellstorm when there is no choice (muncher)", () => {
    const e = build(Illrigger.MasterOfHell);
    expect(e.activity.name).toBe("Inferno");
    expect(e.additionalActivities.map((a: any) => a.init.name))
      .toEqual(["Pestilence", "Darkness", "Burning: End of Turn Save"]);
    // the Darkness blindness stays a timed effect below dnd5e 6.0 (no regions)
    expect(e.effects.map((effect: any) => effect.activityMatch)).toEqual(["Inferno", "Pestilence", "Darkness"]);
  });

  it("builds only the chosen hellstorm on a character import", () => {
    const e = build(Illrigger.MasterOfHell, { ddbParser: { _chosen: [{ label: "Pestilence" }] } });
    expect(e.activity.name).toBe("Pestilence");
    expect(e.activity.data.save).toEqual({ ability: ["con"], dc: { calculation: "cha", formula: "" } });
    expect(e.activity.data.damage.parts.map((p: any) => p.types)).toEqual([["poison"], ["necrotic"]]);
    expect(e.activity.data.target).toMatchObject({
      override: true,
      affects: { type: "enemy" },
      template: { type: "sphere", size: "50", units: "ft" },
    });
    expect(e.additionalActivities).toEqual([]);
    expect(e.effects).toHaveLength(1);
    expect(e.effects[0].statuses).toEqual(["Poisoned"]);
  });

  it("applies the Darkness blindness whether or not the target saves", () => {
    const e = build(Illrigger.MasterOfHell, { ddbParser: { _chosen: [{ label: "Darkness" }] } });
    expect(e.effects[0].onSave).toBe(true);
    expect(e.effects[0].statuses).toEqual(["Blinded"]);
  });
});

describe("illrigger TerrorizingForce", () => {
  it("enables only the chosen damage type", () => {
    const e = build(Illrigger.TerrorizingForce, { ddbParser: { _chosen: [{ label: "Fire" }] } });
    const enabled = e.effects.filter((effect: any) => !effect.options.disabled).map((effect: any) => effect.name);
    expect(enabled).toEqual(["Terrorizing Force: Fire"]);
    const fire = e.effects.find((effect: any) => effect.name === "Terrorizing Force: Fire");
    expect(fire.options.transfer).toBe(true);
    expect(fire.changes.map((c: any) => [c.key, c.value])).toEqual([
      ["system.bonuses.mwak.damage", "1d8[fire]"],
      ["system.bonuses.rwak.damage", "1d8[fire]"],
    ]);
  });

  it("leaves every type disabled without a choice", () => {
    const e = build(Illrigger.TerrorizingForce);
    expect(e.effects).toHaveLength(4);
    expect(e.effects.every((effect: any) => effect.options.disabled)).toBe(true);
  });
});

/** An illrigger class entry carrying the named features, for the ddbData class lookups. */
function illriggerClass(level: number, features: { id: number; name: string; requiredLevel?: number }[]) {
  return {
    definition: { name: "Illrigger" },
    subclassDefinition: null,
    level,
    classFeatures: features.map((f) => ({ definition: { id: f.id, name: f.name, requiredLevel: f.requiredLevel ?? 1 } })),
  };
}

const TERRORIZING_FORCE_ID = 10763994;

describe("illrigger TerrorizingForce.chosenType", () => {
  it("reads the option hanging off the Terrorizing Force feature", () => {
    const e = build(Illrigger.TerrorizingForce, {
      character: {
        classes: [illriggerClass(3, [{ id: TERRORIZING_FORCE_ID, name: "Terrorizing Force" }])],
        options: { class: [{ componentId: TERRORIZING_FORCE_ID, componentTypeId: 1, definition: { name: "Cold" } }], race: [], feat: [] },
      },
    });
    const enabled = e.effects.filter((effect: any) => !effect.options.disabled).map((effect: any) => effect.name);
    expect(enabled).toEqual(["Terrorizing Force: Cold"]);
  });

  it("ignores a same-named option from another feature", () => {
    const e = build(Illrigger.TerrorizingForce, {
      character: {
        classes: [illriggerClass(3, [{ id: TERRORIZING_FORCE_ID, name: "Terrorizing Force" }])],
        options: { class: [{ componentId: 1234, componentTypeId: 1, definition: { name: "Fire" } }], race: [], feat: [] },
      },
    });
    expect(e.effects.every((effect: any) => effect.options.disabled)).toBe(true);
  });
});

describe("illrigger InfernalMajesty", () => {
  it("adds a second die of the Terrorizing Force type chosen on DDB and notes it is fixed", () => {
    const e = build(Illrigger.InfernalMajesty, {
      character: {
        classes: [illriggerClass(20, [{ id: TERRORIZING_FORCE_ID, name: "Terrorizing Force" }])],
        options: { class: [{ componentId: TERRORIZING_FORCE_ID, componentTypeId: 1, definition: { name: "Necrotic" } }], race: [], feat: [] },
      },
    });
    const keys = e.effects[0].changes.map((c: any) => `${c.key}=${c.value}`);
    expect(keys).toContain("system.bonuses.mwak.damage=1d8[necrotic]");
    expect(keys).toContain("system.attributes.movement.fly=60");
    expect(e.override.descriptionSuffix).toContain("necrotic damage, the type chosen when this character was imported");
  });

  it("keeps the resistances and flight when no Terrorizing Force type is known", () => {
    const e = build(Illrigger.InfernalMajesty);
    const keys = e.effects[0].changes.map((c: any) => c.key);
    expect(keys).not.toContain("system.bonuses.mwak.damage");
    expect(keys.filter((k: string) => k === "system.traits.dr.value")).toHaveLength(3);
    expect(e.override.descriptionSuffix).toBeUndefined();
  });
});

describe("illrigger target effects and consumption", () => {
  it("applies the proficiency penalty to the target's saves (DAE reads @prof from the caster)", () => {
    const e = build(Illrigger.Bedevil);
    expect(e.effects[0].changes[0]).toMatchObject({
      key: "system.bonuses.abilities.save",
      value: "-@prof",
    });
    expect(e.effects[0].changes[0]).not.toHaveProperty("replacement");
  });

  it("spends the Invoke Hell use and a seal for Enervating Spell", () => {
    const e = build(Illrigger.InvokeHellArchitectOfRuin);
    const enervating = e.additionalActivities.find((a: any) => a.action?.name === "Invoke Hell: Enervating Spell");
    expect(enervating.overrides.itemConsumeTargetName).toBe("Invoke Hell");
    expect(enervating.overrides.additionalConsumptionTargets).toEqual([
      { type: "itemUses", target: "Baleful Interdict", value: "1", scaling: { mode: "", formula: "" } },
    ]);
  });
});

describe("illrigger Veil of Lies", () => {
  it("ends the invisibility on an attack or a spell under DAE", () => {
    const e = build(Illrigger.BelialsInterdiction);
    expect(e.effects[0]).toMatchObject({ activityMatch: "Veil of Lies", daeSpecialDurations: ["1Attack", "1Spell"] });
  });
});

describe("illrigger BalefulInterdict Incontrovertible", () => {
  const moloch = { id: 10764016, name: "Moloch's Interdiction", requiredLevel: 7 };

  it("gives interdicted creatures Wisdom and Charisma save disadvantage from 18th level with Moloch", () => {
    const e = build(Illrigger.BalefulInterdict, { character: { classes: [illriggerClass(18, [moloch])] } });
    expect(e.effects[0].changes.map((c: any) => c.key)).toEqual([
      "system.abilities.wis.save.roll.mode",
      "system.abilities.cha.save.roll.mode",
    ]);
  });

  it.each([
    ["below 18th level", illriggerClass(13, [moloch])],
    ["without Moloch's Interdiction", illriggerClass(20, [])],
  ])("adds nothing %s", (_label, klass) => {
    const e = build(Illrigger.BalefulInterdict, { character: { classes: [klass] } });
    expect(e.effects[0].changes).toEqual([]);
  });
});

describe("illrigger areas and ranges", () => {
  it.each([
    ["ConflagrantChannel", { rangeType: "ft", rangeValue: 60, rangeSpecial: "An unoccupied space you can see" }],
    ["FlashOfBrimstone", { rangeType: "ft", rangeValue: 5 }],
    ["IronGaol", { rangeType: "touch" }],
    ["ShadowShroud", { rangeType: "touch" }],
    ["InfernalConduit", { rangeType: "touch" }],
  ])("%s uses the range shorthands", (enricher, range) => {
    const e = build((Illrigger as Record<string, any>)[enricher]);
    expect(e.activity).toMatchObject(range);
    expect(e.activity.data?.range).toBeUndefined();
  });

  it("drains with the interdict DC by touch", () => {
    const e = build(Illrigger.InfernalConduit);
    const drain = e.additionalActivities[0];
    expect(drain.build.saveOverride.dc).toEqual({ calculation: "cha", formula: "" });
    expect(drain.overrides).toEqual({ rangeType: "touch" });
  });
});

describe("illrigger small automation", () => {
  it("adds an escape check at the interdict DC to Acheron's Chain", () => {
    const e = build(Illrigger.AcheronsChain);
    expect(e.additionalActivities).toHaveLength(1);
    expect(e.additionalActivities[0].init).toMatchObject({ name: "Escape Check", type: "check" });
    expect(e.additionalActivities[0].build.checkOverride.dc).toEqual({ calculation: "cha", formula: "" });
    expect(e.additionalActivities[0].overrides.activationType).toBe("action");
  });

  it("rolls the largest Hit Die for Blood Price", () => {
    const e = build(Illrigger.BloodPrice);
    expect(e.activity.data.roll.formula).toBe("1d(@attributes.hd.largestFace)");
  });

  it("resolves Superior Interdict's seal target through replaceActivityUses", () => {
    const e = build(Illrigger.SuperiorInterdict);
    expect(e.override).toEqual({ replaceActivityUses: true });
  });

  it("tells the table to restore Quid Pro Quo's use when the target saves", () => {
    const e = build(Illrigger.QuidProQuo);
    expect(e.override.descriptionSuffix).toContain("If the target succeeds on its saving throw, restore the use.");
  });
});

describe("illrigger 5.x specifics", () => {
  it("repeats the Inferno save at the end of each burning turn", () => {
    const e = build(Illrigger.MasterOfHell, { ddbParser: { _chosen: [{ label: "Inferno" }] } });
    const burning = e.additionalActivities.find((a: any) => a.init.name === "Burning: End of Turn Save");
    expect(burning.build.saveOverride).toEqual({ ability: ["dex"], dc: { calculation: "cha", formula: "" } });
    expect(burning.build.onSave).toBe("none");
    expect(burning.build.damageParts.map((p: any) => p.types)).toEqual([["fire"], ["necrotic"]]);
    const overTime = e.effects[0].midiChanges[0];
    expect(overTime.key).toBe("flags.midi-qol.OverTime");
    expect(overTime.value).toContain("turn=end");
  });

  it("gives Soul's Doom a damage modification on every damage type", () => {
    const e = build(Illrigger.SoulsDoom);
    const keys = e.effects[0].changes.map((c: any) => c.key);
    expect(keys).toContain("system.traits.dm.amount.fire");
    expect(keys).not.toContain("system.traits.dm.amount.ALL");
    expect(e.effects[0].changes.every((c: any) => c.value.includes("@prof"))).toBe(true);
  });

  it("ends Bedevil on the next save under DAE", () => {
    const e = build(Illrigger.Bedevil);
    expect(e.effects[0].daeSpecialDurations).toEqual(["isSave"]);
  });
});
