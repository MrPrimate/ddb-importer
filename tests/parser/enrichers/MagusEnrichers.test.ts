/**
 * Behavioural pins for The Magus Class enrichers (Mage Hand Press).
 *
 * The audit harness runs module-free, so the AC5e and midi change values are invisible in the
 * worksheets, and the level-gated pieces (Sigil Surge on Mystic Mark, Weave Destiny on Seal Fate)
 * only show at the capture's level. Both are pinned here.
 */
import EsotericEye from "../../../src/parser/enrichers/class/magus/EsotericEye";
import MysticMark from "../../../src/parser/enrichers/class/magus/MysticMark";
import SealFate from "../../../src/parser/enrichers/class/magus/SealFate";
import MasterOfTheArcane from "../../../src/parser/enrichers/class/magus/MasterOfTheArcane";
import JadeMark from "../../../src/parser/enrichers/class/magus/JadeMark";
import BitterWind from "../../../src/parser/enrichers/spell/BitterWind";
import AdamantScale from "../../../src/parser/enrichers/item/AdamantScale";
import SRDSummonItem from "../../../src/parser/enrichers/item/SRDSummonItem";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

function build(Enricher: TEnricher, options: Record<string, any> = {}): any {
  return makeEnricherData(Enricher, options);
}

/** A level `level` Magus whose classFeatures carry the named features at their levels. */
function magus(level: number, features: [string, number][] = []): Record<string, any> {
  return {
    classes: [{
      level,
      definition: { name: "Magus", classFeatures: [] },
      classFeatures: features.map(([name, requiredLevel]) => ({ definition: { name, requiredLevel } })),
    }],
  };
}

describe("Esoteric Eye", () => {
  it("scopes the spell attack Advantage and save Disadvantage to the magus under AC5e", () => {
    const [effect] = build(EsotericEye, { name: "Esoteric Eye" }).effects;
    expect(effect.activityMatch).toBe("Observe Creature");
    expect(effect.options.expiry).toBe("sourceEnd");
    expect(effect.ac5eChanges).toEqual([
      expect.objectContaining({ key: "flags.automated-conditions-5e.grants.attack.advantage", value: "isSpell && effectOriginTokenId === tokenId" }),
      expect.objectContaining({ key: "flags.automated-conditions-5e.save.disadvantage", value: "isSpell && effectOriginTokenId === opponentId" }),
    ]);
  });

  it("recovers every use on a Long Rest and one on a Short Rest", () => {
    const { uses } = build(EsotericEye, { name: "Esoteric Eye" }).override;
    expect(uses.max).toBe("max(1, @abilities.int.mod)");
    expect(uses.recovery).toEqual([
      expect.objectContaining({ period: "lr", type: "recoverAll" }),
      expect.objectContaining({ period: "sr", type: "formula", formula: "1" }),
    ]);
  });
});

describe("Mystic Mark", () => {
  it("is a self enchant that renames itself and rides the mark's activities onto the item", () => {
    const enricher = build(MysticMark, { name: "Mystic Mark", character: magus(2, [["Mystic Mark", 2]]) });
    expect(enricher.type).toBe("enchant");
    expect(enricher.activity).toEqual(expect.objectContaining({ name: "Activate", id: MysticMark.ACTIVATE_ID }));
    expect(enricher.activity.data.enchant.self).toBe(true);
    const mark = enricher.effects.find((e: any) => e.name === "Mystic Mark");
    expect(mark.type).toBe("enchant");
    expect(mark.data.flags.ddbimporter.activityRiders).toEqual([
      MysticMark.AEGIS_ID, MysticMark.ENSPELL_ID, MysticMark.STORE_ID, MysticMark.RELEASE_ID,
    ]);
    expect(mark.changes).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: `system.activities.${MysticMark.ACTIVATE_ID}.name`, value: "Deactivate" }),
    ]));
    expect(enricher.additionalActivities.map((a: any) => [a.init.id, a.init.type])).toEqual([
      [MysticMark.AEGIS_ID, "utility"],
      [MysticMark.ENSPELL_ID, "enchant"],
      [MysticMark.STORE_ID, "ddbmacro"],
      [MysticMark.RELEASE_ID, "ddbmacro"],
    ]);
  });

  it("builds an Aegis resistance and an Enspell weapon enchantment for each damage type", () => {
    const effects = build(MysticMark, { name: "Mystic Mark", character: magus(2, [["Mystic Mark", 2]]) }).effects;
    expect(effects).toHaveLength(27);
    const fire = effects.find((e: any) => e.name === "Aegis (Fire)");
    expect(fire.changes).toEqual([expect.objectContaining({ key: "system.traits.dr.value", value: "fire" })]);
    const enspell = effects.find((e: any) => e.name === "Enspell (Fire)");
    expect(enspell.type).toBe("enchant");
    expect(enspell.changes.map((c: any) => [c.key, c.value])).toEqual([
      ["name", "{} (Enspell: Fire)"],
      ["system.damage.base.types", "fire"],
      ["system.damage.versatile.types", "fire"],
    ]);
  });

  it("adds Sigil Surge's 1d6 of the chosen type to the enchanted weapon from level 11", () => {
    const effects = build(MysticMark, {
      name: "Mystic Mark",
      character: magus(11, [["Mystic Mark", 2], ["Sigil Surge", 11]]),
    }).effects;
    const part = effects.find((e: any) => e.name === "Enspell (Radiant)").changes
      .find((c: any) => c.key === "activities[attack].damage.parts");
    expect(JSON.parse(part.value)).toEqual({ number: 1, denomination: 6, types: ["radiant"] });
  });

  it("spends a spell slot of the stored spell's level on Aegis and Enspell, restricted to weapons for Enspell", () => {
    const activities = build(MysticMark, { name: "Mystic Mark" }).additionalActivities;
    for (const activity of activities.slice(0, 2)) {
      expect(activity.overrides).toEqual(expect.objectContaining({
        addSpellSlotConsume: true,
        addSpellSlotScalingMode: "level",
        addConsumptionScalingMax: "5",
      }));
    }
    expect(activities[1].overrides.data.restrictions).toEqual({ type: "weapon", allowMagical: true });
  });
});

describe("Mystic Mark stored spell", () => {
  it("stores and releases the spell through the mysticMark macro", () => {
    const activities = build(MysticMark, { name: "Mystic Mark" }).additionalActivities;
    const macros = activities.filter((a: any) => a.init.type === "ddbmacro");
    expect(macros.map((a: any) => [a.init.name, a.build.activationOverride.type, JSON.parse(a.build.ddbMacroOverride.parameters).action]))
      .toEqual([["Store Spell", "special", "store"], ["Release Spell", "bonus", "release"]]);
    expect(macros.every((a: any) => a.build.ddbMacroOverride.function === "ddb.generic.mysticMark")).toBe(true);
    // the Aegis or Enspell activity spends the slot; storing and releasing spend nothing
    expect(macros.every((a: any) => a.build.consumptionOverride.targets.length === 0)).toBe(true);
  });
});

describe("Seal Fate", () => {
  it("is once per Short or Long Rest before Starfinder", () => {
    const { uses } = build(SealFate, { name: "Seal Fate", character: magus(14, [["Seal Fate", 14]]) }).override;
    expect(uses.max).toBe("1");
    expect(uses.recovery).toEqual([expect.objectContaining({ period: "sr", type: "recoverAll" })]);
  });

  it("has three uses with Weave Destiny, one back on a Short Rest", () => {
    const { uses } = build(SealFate, {
      name: "Seal Fate",
      character: magus(20, [["Seal Fate", 14], ["Starfinder", 20]]),
    }).override;
    expect(uses.max).toBe("3");
    expect(uses.recovery).toEqual([
      expect.objectContaining({ period: "lr", type: "recoverAll" }),
      expect.objectContaining({ period: "sr", type: "formula", formula: "1" }),
    ]);
  });
});

describe("Magus capstones", () => {
  it("refreshes the level 14 feature by name and spends Spell Surge on its casts", () => {
    const enricher = build(MasterOfTheArcane, { name: "Master of the Arcane" });
    expect(enricher.activity.additionalConsumptionTargets).toEqual([
      expect.objectContaining({ type: "itemUses", target: "Arcane Vortex", value: "-1" }),
    ]);
    expect(enricher.additionalActivities.map((a: any) => [a.init.name, a.overrides.itemConsumeTargetName, a.overrides.addSpellUuid])).toEqual([
      ["Spell Surge: Chain Lightning", "Spell Surge", "Chain Lightning"],
      ["Spell Surge: Contingency", "Spell Surge", "Contingency"],
    ]);
    expect(enricher.override.replaceActivityUses).toBe(true);
  });
});

describe("Jade Mark", () => {
  it("overexposes the Enspell target to Critical Hits on 19-20 under AC5e and midi", () => {
    const overexposed = build(JadeMark, { name: "Jade Mark" }).effects.find((e: any) => e.name === "Overexposed");
    expect(overexposed.ac5eChanges).toEqual([
      expect.objectContaining({ key: "flags.automated-conditions-5e.grants.attack.criticalThreshold", value: "set=19" }),
    ]);
    expect(overexposed.midiChanges).toEqual([
      expect.objectContaining({ key: "flags.midi-qol.grants.criticalThreshold", value: "19" }),
    ]);
  });
});

describe("Bitter Wind", () => {
  it("keeps its region automation for the level 3 spell only", () => {
    const level3 = build(BitterWind, { name: "Bitter Wind", ddbParser: { ddbDefinition: { level: 3 } } });
    expect(level3.type).toBe("utility");
    expect(level3.additionalActivities).toHaveLength(1);
    const cantrip = build(BitterWind, { name: "Bitter Wind", ddbParser: { ddbDefinition: { level: 0 } } });
    expect(cantrip.type).toBeNull();
    expect(cantrip.activity).toBeNull();
    expect(cantrip.additionalActivities).toEqual([]);
  });
});

describe("Spell component items", () => {
  it("are a single use and apply their benefit to the spell's target, not the owner", () => {
    const enricher = build(AdamantScale, { name: "Adamant Scale" });
    expect(enricher.override.uses).toEqual(expect.objectContaining({ max: "1", recovery: [] }));
    expect(enricher.clearAutoEffects).toBe(true);
    const [effect] = enricher.effects;
    expect(effect.activityMatch).toBe("Consume with Mage Armor");
    expect(effect.options.transfer).toBe(false);
    expect(effect.changes).toEqual([expect.objectContaining({ key: "system.attributes.ac.formulas", value: "15 + @abilities.dex.mod" })]);
  });
});

describe("Restless Cremains", () => {
  it("summons one Dust Mephit per charge spent, for 10 minutes", () => {
    const enricher = build(SRDSummonItem, { name: "Restless Cremains", ddbParser: { originalName: "Restless Cremains" } });
    expect(enricher.type).toBe("summon");
    const activity = enricher.activity;
    expect(activity.profileKeys).toEqual([{ count: "@scaling", name: "SRDCreatureDustMephit2024" }]);
    expect(activity).toEqual(expect.objectContaining({
      addItemConsume: true,
      addScalingMode: "amount",
      addScalingFormula: "1",
      addConsumptionScalingMax: "9",
      activationType: "special",
    }));
    expect(activity.data.duration).toEqual({ value: "10", units: "minute" });
  });
});
