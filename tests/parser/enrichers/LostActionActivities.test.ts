/**
 * Pins for the 2026-09-05 "lost DDB action activity" pass: named enrichers that only shipped
 * effects and so replaced the Generic fallback's action-matched activity with nothing. The audit
 * worksheet shows the built activity for the fixture's own configuration; these cover the other
 * side of the is2014 / chosen-option / muncher branches and the module-only change values the
 * harness cannot see.
 */
import * as ClassEnrichers from "../../../src/parser/enrichers/class/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

function build(Enricher: TEnricher, options: Parameters<typeof makeEnricherData>[1] = {}): any {
  return makeEnricherData(Enricher, options);
}

describe("cleric ChannelDivinityPathToTheGrave", () => {
  it("is a 2014 action that makes the target vulnerable until it is damaged", () => {
    const e = build(ClassEnrichers.Cleric.ChannelDivinityPathToTheGrave, { is2014: true });
    expect(e.activity).toMatchObject({ activationType: "action", itemConsumeTargetName: "Channel Divinity" });
    expect(e.effects[0].daeSpecialDurations).toEqual(["isDamaged"]);
    expect(e.effects[0].changes.every((c: any) => c.key === "system.traits.dv.value")).toBe(true);
  });

  it("is a 2024 bonus action curse with disadvantage on attacks and saves until the cleric's next turn", () => {
    const e = build(ClassEnrichers.Cleric.ChannelDivinityPathToTheGrave);
    expect(e.activity.activationType).toBe("bonus");
    expect(e.effects[0].options.expiry).toBe("sourceStart");
    expect(e.effects[0].changes.map((c: any) => [c.key, c.type])).toEqual([["attack", "dnd5e.advantage"], ["save", "dnd5e.advantage"]]);
  });
});

describe("cleric BlessingOfTheTrickster", () => {
  it("touches for an hour in 2014 and reaches 30 ft until a long rest in 2024", () => {
    const old = build(ClassEnrichers.Cleric.BlessingOfTheTrickster, { is2014: true });
    expect(old.activity).toMatchObject({ rangeType: "touch" });
    expect(old.effects[0].options).toEqual({ durationSeconds: 3600 });
    const modern = build(ClassEnrichers.Cleric.BlessingOfTheTrickster);
    expect(modern.activity).toMatchObject({ rangeType: "ft", rangeValue: 30 });
    expect(modern.effects[0].options).toEqual({ expiry: "longRest" });
    expect(modern.effects[0].changes[0].key).toBe("system.skills.ste.roll.mode");
  });
});

describe("monk ShadowArts", () => {
  it("casts Darkness for one focus point and transfers the darkvision in 2024", () => {
    const e = build(ClassEnrichers.Monk.ShadowArts);
    expect(e.type).toBe("cast");
    expect(e.activity).toMatchObject({ addSpellUuid: "Darkness", itemConsumeTargetName: "Monk's Focus", itemConsumeValue: 1, noSpellslot: true });
    expect(e.additionalActivities).toEqual([]);
    expect(e.effects[0].options.transfer).toBe(true);
  });

  it("offers the four 2014 spells at two ki each and no darkvision", () => {
    const e = build(ClassEnrichers.Monk.ShadowArts, { is2014: true });
    expect(e.activity.itemConsumeValue).toBe(2);
    expect(e.additionalActivities.map((a: any) => a.overrides.addSpellUuid)).toEqual(["Darkvision", "Pass without Trace", "Silence"]);
    expect(e.additionalActivities.every((a: any) => a.duplicate)).toBe(true);
    expect(e.effects).toEqual([]);
  });
});

describe("wizard EnchantingConversationalist", () => {
  it("ships all three skills disabled for the muncher", () => {
    const e = build(ClassEnrichers.Wizard.EnchantingConversationalist, { ddbParser: { isMuncher: true } });
    expect(e.effects).toHaveLength(3);
    expect(e.effects.every((h: any) => h.options.transfer && h.options.disabled)).toBe(true);
  });

  it("emits one enabled effect scoped to the chosen skill on a character import", () => {
    const e = build(ClassEnrichers.Wizard.EnchantingConversationalist, { ddbParser: { _chosen: [{ label: "Persuasion" }] } });
    expect(e.effects).toHaveLength(1);
    expect(e.effects[0].options).toEqual({ transfer: true, disabled: false });
    const change = e.effects[0].changes[0];
    expect(change).toMatchObject({ key: "check", type: "dnd5e.bonus", value: "max(1, @abilities.int.mod)" });
    expect(JSON.parse(change.conditions)).toEqual({ k: "roll.skill", o: "exact", v: "per" });
  });
});

describe("gunslinger CriticalShot", () => {
  it("points both module thresholds at the Deadeye scale and limits them to ranged weapon attacks", () => {
    const e = build(ClassEnrichers.Gunslinger.CriticalShot);
    const [ac5e, midi] = e.effects;
    expect(ac5e.ac5eOnly).toBe(true);
    expect(ac5e.ac5eChanges[0].value).toBe("set=@scale.deadeye.critical-shot; actionType.rwak");
    expect(midi.midiOnly).toBe(true);
    expect(midi.midiChanges[0]).toMatchObject({ key: "flags.midi-qol.critical.rwak", value: "@scale.deadeye.critical-shot" });
    expect(e.effects.every((h: any) => h.options.transfer)).toBe(true);
  });
});

describe("rogue DreadIncarnate", () => {
  it("restores a Bloodthirst use and rolls Sneak Attack with 1s and 2s treated as 3s", () => {
    const e = build(ClassEnrichers.Rogue.DreadIncarnate);
    expect(e.activity).toMatchObject({ itemConsumeTargetName: "Bloodthirst", itemConsumeValue: "-1" });
    const [sneak] = e.additionalActivities;
    expect(sneak.init).toEqual({ name: "Sneak Attack (Murderous Intent)", type: "damage" });
    expect(sneak.build.damageParts[0].custom.formula).toBe("(@scale.rogue.sneak-attack.number)d6min3");
    expect(e.effects[0].changes[0]).toMatchObject({ key: "system.scale.rogue.sneak-attack.modifiers", value: "min3" });
  });
});

describe("wizard HypnoticGaze", () => {
  it("is a Wisdom save against the spell DC applying charmed and incapacitated at speed 0", () => {
    const e = build(ClassEnrichers.Wizard.HypnoticGaze);
    expect(e.type).toBe("save");
    expect(e.activity.data.save).toEqual({ ability: ["wis"], dc: { calculation: "spellcasting", formula: "" } });
    expect(e.effects[0].statuses).toEqual(["charmed", "incapacitated"]);
    expect(e.effects[0].changes[0]).toMatchObject({ key: "system.attributes.movement.multiplier", value: "0" });
    expect(e.effects[0].options.expiry).toBe("sourceEnd");
  });
});

describe("paladin AuraOfDevotion", () => {
  it("places the Aura of Protection template and applies a standalone charmed immunity", () => {
    const e = build(ClassEnrichers.Paladin.AuraOfDevotion);
    expect(e.activity.data.target.template.size).toBe("@scale.paladin.aura-of-protection");
    expect(e.activity.data.behaviors[0].config.effects).toEqual(["Aura of Devotion"]);
    const [standalone, aura] = e.effects;
    expect(standalone.standalone).toBe(true);
    expect(standalone.changes[0]).toMatchObject({ key: "system.traits.ci.value", value: "charmed" });
    expect(aura.auraeffectsOnly).toBe(true);
    expect(aura.auraeffects.distanceFormula).toBe("@scale.paladin.aura-of-protection");
  });
});

describe("sorcerer ElementalAffinity", () => {
  it("always offers the Charisma damage bonus activity", () => {
    expect(build(ClassEnrichers.Sorcerer.ElementalAffinity).type).toBe("damage");
  });
});

describe("wizard MomentaryStasis", () => {
  it("is a Constitution save on the Int-mod pool that incapacitates on a fail", () => {
    const e = build(ClassEnrichers.Wizard.MomentaryStasis);
    expect(e.type).toBe("save");
    expect(e.activity).toMatchObject({ activationType: "action", rangeValue: 60, addItemConsume: true });
    expect(e.activity.data.save).toEqual({ ability: ["con"], dc: { calculation: "spellcasting", formula: "" } });
    expect(e.effects[0].statuses).toEqual(["Incapacitated"]);
    expect(e.effects[0].options.expiry).toBe("sourceEnd");
    expect(e.effects[0].daeSpecialDurations).toEqual(["isDamaged"]);
  });
});

describe("druid BlightedShape", () => {
  it("offers a manual Wild Shape activity that applies the AC and darkvision effect", () => {
    const e = build(ClassEnrichers.Druid.BlightedShape);
    expect(e.activity).toMatchObject({ activationType: "special", targetType: "self" });
    expect(e.effects[0].options.transfer).toBeUndefined();
  });
});

describe("druid WrathOfTheSea carries Stormborn", () => {
  it("gates the flight and resistance effect at druid level 10 on the activation", () => {
    const e = build(ClassEnrichers.Druid.WrathOfTheSea);
    expect(e.activity.data.visibility).toEqual({ identifier: "druid" });
    const stormborn = e.effects.find((h: any) => h.name === "Stormborn");
    expect(stormborn.activityMatch).toBe("Activate Emanation/Aura");
    expect(stormborn.data.flags.ddbimporter.effectIdLevel).toEqual({ min: 10, max: null });
    expect(stormborn.changes.map((c: any) => c.value)).toEqual(["@attributes.movement.speeds.walk", "cold", "lightning", "thunder"]);
    expect(build(ClassEnrichers.Druid.Stormborn).effects).toEqual([]);
  });
});

describe("monk ElementalAttunement carries Stride of the Elements", () => {
  it("splits the enchantment at monk 11 and rides the speeds on the upper profile", () => {
    const e = build(ClassEnrichers.Monk.ElementalAttunement);
    const [low, high, stride] = e.effects;
    expect(low.data.flags.ddbimporter.effectIdLevel).toEqual({ min: null, max: 10 });
    expect(low.data.flags.ddbimporter.effectRiders).toEqual([]);
    expect(high.data.flags.ddbimporter.effectIdLevel).toEqual({ min: 11, max: null });
    expect(high.data.flags.ddbimporter.effectRiders).toEqual(["ddbStrideElemEff"]);
    expect(high.data.flags.ddbimporter.activityRiders).toEqual(["ddbElementStriAt", "ddbElementStriSa"]);
    expect(stride).toMatchObject({ name: "Stride of the Elements", data: { _id: "ddbStrideElemEff" } });
    expect(stride.options.transfer).toBe(true);
    expect(stride.changes.map((c: any) => c.key)).toEqual(["system.attributes.movement.speeds.fly", "system.attributes.movement.speeds.swim"]);
    expect(build(ClassEnrichers.Monk.StrideOfTheElements).effects).toEqual([]);
  });
});
