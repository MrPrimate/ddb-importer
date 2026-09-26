// @vitest-environment jsdom
/**
 * Region-behavior pins for the monster-side enrichers: the generic turn-start
 * aura and ally-buff aura (driven by the trait text) and the importer-built
 * summon stat blocks (Flaming Sphere, Guardian of Faith, Conjured Animals and
 * Elementals, Faithful Hound), which no audit domain replays - the summon stubs
 * are synthesised at import time, not captured from DDB.
 *
 * No vi.mock preamble, for the reasons given in ClassEnrichers.test.ts.
 */
import TurnStartAuraSave from "../../../src/parser/enrichers/monster/Generic/TurnStartAuraSave";
import AllyBuffAura from "../../../src/parser/enrichers/monster/Generic/AllyBuffAura";
import FlameDamage from "../../../src/parser/enrichers/monster/FlamingSphere/FlameDamage";
import GuardianAura from "../../../src/parser/enrichers/monster/GuardianOfFaith/GuardianAura";
import PackDamage from "../../../src/parser/enrichers/monster/ConjuredAnimals/PackDamage";
import ElementDamage from "../../../src/parser/enrichers/monster/ConjuredElemental/ElementDamage";
import Bark from "../../../src/parser/enrichers/monster/FaithfulHound/Bark";
import SRDEffects from "../../../src/parser/enrichers/effects/SRDEffects";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

/** A monster feature enricher: the trait text sits on the parser, the feature name on `data`. */
function trait(Enricher: TEnricher, name: string, strippedHtml: string, extra: Record<string, any> = {}): any {
  const { ddbParser = {}, ...options } = extra;
  return makeEnricherData(Enricher, {
    name,
    actions: null,
    data: { name },
    ddbParser: { strippedHtml, ...ddbParser },
    ...options,
  });
}

function macro(activity: any): any {
  return activity.data.behaviors.find((b: any) => b.type === "ddbMacro");
}

/**
 * The activity that places the aura: the whole built aura when the parser read no roll, otherwise
 * the "Place Aura" utility beside the parser's roll.
 */
function placer(e: any): { template: any; affects: string | undefined; behaviors: any[] } {
  const extra = (e.additionalActivities ?? []).find((a: any) => a.init?.name === "Place Aura");
  if (extra) {
    return { template: extra.build.targetOverride.template, affects: extra.build.targetOverride.affects?.type, behaviors: extra.overrides.data.behaviors };
  }
  return { template: e.activity.data?.target?.template, affects: e.activity.data?.target?.affects?.type, behaviors: e.activity.data?.behaviors ?? [] };
}

function auraMacro(e: any): any {
  return placer(e).behaviors.find((b: any) => b.type === "ddbMacro");
}

describe("monster Generic TurnStartAuraSave", () => {
  const rakdos = "Any creature that starts its turn within 30 feet of Rakdos must make a DC 25 Wisdom saving throw.";

  it("places the aura with its own utility and fires the parser's roll, which places nothing", () => {
    const e = trait(TurnStartAuraSave, "Captivating Presence", rakdos);
    // switching the aura on rolls nothing: the parsed save is what the region fires
    expect(e.activity).toMatchObject({ name: "Captivating Presence", activationType: "special", targetType: "creature", targetCount: "1", noTemplate: true });
    expect(e.keepParsedActivities).toBe(true);
    const [place] = e.additionalActivities;
    expect(place.init).toEqual({ name: "Place Aura", type: "utility" });
    // the text names the monster, so the parser found no template and the size is read here
    expect(placer(e).template).toMatchObject({ type: "radius", size: "30" });
    expect(auraMacro(e).config).toMatchObject({ events: ["tokenTurnStart"], excludeSelf: true, args: { activityName: "Captivating Presence" } });
  });

  it("leaves the parser's template alone when it already extracted one", () => {
    const e = trait(TurnStartAuraSave, "Gibbering",
      "Each creature that starts its turn within 20 feet of the mouther must succeed on a DC 10 Wisdom saving throw.",
      { ddbParser: { actionData: { target: { template: { size: "20" } } } } });
    expect(placer(e).template).toMatchObject({ type: "radius", size: "20" });
    expect(auraMacro(e).config.events).toEqual(["tokenTurnStart"]);
  });

  it("also fires on entry when the trait says so", () => {
    const e = trait(TurnStartAuraSave, "Arcane Leak",
      "Any creature that starts its turn within 10 feet of the adranach or enters that area for the first time on a turn takes 10 (3d6) radiant damage.");
    expect(auraMacro(e).config.events).toEqual(["tokenEnter", "tokenTurnStart"]);
    // the aura following the monster onto a creature is not that creature entering it
    expect(auraMacro(e).config.enterOn).toBe("movement");
  });

  it("builds the whole aura when the parser read no roll for it", () => {
    const e = trait(TurnStartAuraSave, "Chill Aura",
      "The ogre fills the area within 10 feet of it with bitter cold. At the start of the ogre's turn, flames in the aura go out. Any creature that starts its turn within 10 feet of the ogre takes 7 (2d6) cold damage.");
    expect(e.type).toBe("utility");
    expect(e.activity.name).toBe("Chill Aura");
    expect(e.activity.activationType).toBe("special");
    expect(placer(e).template).toMatchObject({ type: "radius", size: "10" });
    expect(auraMacro(e).config).toMatchObject({ events: ["tokenTurnStart"], args: { activityName: "Aura Damage" } });
    const [fired] = e.additionalActivities;
    expect(fired.init).toEqual({ name: "Aura Damage", type: "damage" });
    expect(fired.build.damageParts[0]).toMatchObject({ number: 2, denomination: 6, types: ["cold"] });
    expect(fired.overrides.noeffect).toBe(true);
  });

  it("fires the parser's roll rather than building one when the parser already has it", () => {
    const e = trait(TurnStartAuraSave, "Chill Aura",
      "Any creature that starts its turn within 10 feet of the ogre takes 7 (2d6) cold damage.",
      { ddbParser: { actionData: { damageParts: [{}], target: { template: { size: "10" } } } } });
    expect(e.type).toBeNull();
    expect(e.additionalActivities.map((a: any) => a.init.name)).toEqual(["Place Aura"]);
    expect(auraMacro(e).config.args.activityName).toBe("Chill Aura");
  });

  it("emits nothing for an owner-turn variant sharing the name", () => {
    const e = trait(TurnStartAuraSave, "Chilling Presence",
      "At the start of each of the thuellai's turns, each creature within 15 feet of it must succeed on a DC 17 Constitution saving throw.");
    expect(e.activity).toEqual({});
  });

  it("fires at turn end for an aura worded that way, and at both ends when both are named", () => {
    const end = trait(TurnStartAuraSave, "Test Aura", "Any creature that ends its turn within 30 feet of the thing takes 5 necrotic damage.");
    expect(auraMacro(end).config.events).toEqual(["tokenTurnEnd"]);
    expect(placer(end).template).toMatchObject({ type: "radius", size: "30" });
    const both = trait(TurnStartAuraSave, "Test Aura",
      "A creature that starts its turn within 5 feet of it, or ends its turn within 5 feet of it, takes 3 fire damage.");
    expect(auraMacro(both).config.events).toEqual(["tokenTurnStart", "tokenTurnEnd"]);
  });

  it.each([
    ["An enemy that starts its turn within 30 feet of the giant must make a DC 13 Charisma saving throw."],
    ["Each hostile creature that starts its turn within 10 feet of it must succeed on a DC 15 Wisdom saving throw."],
    ["Each creature of the noble's choice that starts its turn within 5 feet of it must succeed on a DC 19 Wisdom saving throw."],
    ["Each creature of the noble\u2019s choice that starts its turn within 5 feet of it must succeed on a DC 19 Wisdom saving throw."],
  ])("cards enemies only for: %s", (text) => {
    const e = trait(TurnStartAuraSave, "Test Aura", text);
    expect(e.activity.targetType).toBe("enemy");
    expect(placer(e).affects).toBe("enemy");
  });

  it("keeps the parser's template but still narrows to enemies", () => {
    const e = trait(TurnStartAuraSave, "Test Aura", "Any enemy that starts its turn within 30 feet of it must save.",
      { ddbParser: { actionData: { target: { template: { size: "30" } } } } });
    expect(e.activity.targetType).toBe("enemy");
    expect(placer(e).affects).toBe("enemy");
  });

  it.each([
    ["The ground in a 20-foot Emanation originating from the tree is difficult terrain. A creature that ends its turn in the Emanation takes 5 necrotic damage.", "20"],
    ["It is surrounded by a 15-foot-radius wind storm. Each creature that starts its turn in the area must save. The storm's area is difficult terrain for any creature other than it.", "15"],
    ["It emits an aura of corruption 30 feet in every direction, and the ground in the aura is difficult terrain for other creatures. Any creature that starts its turn in the aura must save.", "30"],
  ])("reads a size stated before the turn clause and adds terrain: %s", (text, size) => {
    const e = trait(TurnStartAuraSave, "Test Aura", text);
    expect(placer(e).template.size).toBe(size);
    expect(placer(e).behaviors.map((b: any) => b.type)).toEqual(["difficultTerrain", "ddbMacro"]);
  });

  it("treats the monster's own space as a 1 ft emanation", () => {
    const e = trait(TurnStartAuraSave, "Test Aura", "Constitution Saving Throw: DC 12, any creature that starts its turn in the swarm's space.");
    expect(placer(e).template).toMatchObject({ type: "radius", size: "1" });
    expect(auraMacro(e).config).toMatchObject({ events: ["tokenTurnStart"], excludeSelf: true });
  });

  it("reads 'a radius of N feet'", () => {
    const e = trait(TurnStartAuraSave, "Test Aura",
      "It radiates an aura to a radius of 20 feet. Each creature that starts its turn in the aura must save.");
    expect(placer(e).template.size).toBe("20");
    expect(placer(e).behaviors.map((b: any) => b.type)).toEqual(["ddbMacro"]);
  });

  it.each([
    ["Boon of Dread", "Any non-Undead creature that starts its turn within 30 feet of the priest must save.", { excludeTypes: ["undead"] }],
    ["Aura of Annihilation", "The aura deals 5 necrotic damage to any creature that ends its turn within 30 feet of the bodak. Undead and fiends ignore this effect.", { excludeTypes: ["undead", "fiend"] }],
    ["Dread", "Any creature, other than a devil, that starts its turn within 10 feet of Bael must save.", { excludeTypes: ["fiend"] }],
    ["Drone", "Constitution Saving Throw: DC 12, each creature that starts its turn within 30 feet of the chasme (demons automatically succeed on this save).", { excludeTypes: ["fiend"] }],
    ["Aberrant Form", "Any non-Aberration creature that starts its turn within 5 feet of the zealot must save.", { excludeTypes: ["aberration"] }],
    ["Confounding Ugliness", "Any Humanoid that starts its turn within 60 feet of the hag must save.", { types: ["humanoid"] }],
  ])("carries the type exemption the %s text states", (name, text, filters) => {
    const e = trait(TurnStartAuraSave, name, text);
    expect(auraMacro(e).config).toMatchObject(filters);
  });

  it.each([
    ["Drone", "Each creature that starts its turn within 10 feet of the gigant must succeed on a DC 19 Constitution saving throw."],
    ["Dread", "Any creature that starts its turn within 10 feet of it must save."],
  ])("leaves %s unfiltered on a monster whose text states no exemption", (name, text) => {
    const config = auraMacro(trait(TurnStartAuraSave, name, text)).config;
    expect(config.excludeTypes ?? []).toEqual([]);
    expect(config.types ?? []).toEqual([]);
  });
});

describe("monster Generic AllyBuffAura", () => {
  it("Aura of Authority: allies inside get a standalone attack + save advantage effect", () => {
    const e = trait(AllyBuffAura, "Aura of Authority",
      "While in a 10-foot Emanation originating from the hobgoblin, the hobgoblin and its allies have Advantage on attack rolls and saving throws, provided the hobgoblin doesn't have the Incapacitated condition.");
    expect(e.type).toBe("utility");
    expect(e.activity.targetType).toBe("ally");
    expect(e.activity.data.target.template).toMatchObject({ type: "radius", size: "10" });
    expect(e.activity.data.behaviors).toEqual([
      expect.objectContaining({ type: "applyActiveEffect", config: { effects: ["Aura of Authority"], sizes: [], types: [] } }),
    ]);
    const [effect] = e.effects;
    expect(effect).toMatchObject({ name: "Aura of Authority", standalone: true });
    expect(effect.changes.map((c: any) => [c.key, c.type, c.value])).toEqual([
      ["attack", "dnd5e.advantage", "1"],
      ["save", "dnd5e.advantage", "1"],
    ]);
  });

  it("Marshal Undead (2024): 60 feet, undead allies only", () => {
    const e = trait(AllyBuffAura, "Marshal Undead",
      "Undead creatures of Lord Soth's choice (excluding himself) in a 60-foot Emanation originating from him have Advantage on attack rolls and saving throws.");
    expect(e.activity.data.target.template.size).toBe("60");
    expect(e.activity.data.behaviors[0].config.types).toEqual(["undead"]);
  });

  it("Aura of Bravery: stock condition immunities, no standalone effect", () => {
    const e = trait(AllyBuffAura, "Aura of Bravery",
      "Creatures of the knight's choice in a 30-foot Emanation originating from it have Immunity to the Charmed and Frightened conditions while there.");
    expect(e.activity.data.target.template.size).toBe("30");
    expect(e.activity.data.behaviors[0].config.effects).toEqual([
      SRDEffects.conditionImmunity("charmed"),
      SRDEffects.conditionImmunity("frightened"),
    ]);
    expect(e.effects).toEqual([]);
  });

  it("turn-undead save advantage is not expressible and emits nothing", () => {
    const e = trait(AllyBuffAura, "Turning Defiance",
      "The ghast and any ghouls within 30 feet of it have advantage on saving throws against effects that turn Undead.");
    expect(e.type).toBeNull();
    expect(e.activity).toEqual({});
    expect(e.effects).toEqual([]);
  });
});

describe("summon-side auras", () => {
  it("Flaming Sphere: Flame Damage carries the 5-foot emanation and the turn-end trigger, native arm only", () => {
    const e = trait(FlameDamage, "Flame Damage", "");
    expect(e.activity.data.target.template).toMatchObject({ type: "radius", size: "5" });
    const behavior = macro(e.activity);
    expect(behavior.config).toMatchObject({ events: ["tokenTurnEnd"], excludeSelf: true, activity: "" });
    expect(behavior.ddbimporter?.auraeffectsNever).toBeUndefined();
    expect(e.effects[0]).toMatchObject({ auraeffectsOnly: true, midiOnly: true });
  });

  it("Guardian of Faith: a Place Aura that rolls nothing, firing the save for enemies entering (and at turn start in 2024)", () => {
    const legacy = trait(GuardianAura, "Guardian Aura", "", { is2014: true });
    // the save is what the region fires; it spends 20 of the 60-damage pool each time
    expect(legacy.activity).toMatchObject({ id: "ddbGuardianAuraS", targetType: "enemy", noTemplate: true, addItemConsume: true, itemConsumeValue: "20" });
    expect(legacy.activity.data.behaviors).toBeUndefined();
    expect(placer(legacy)).toMatchObject({ template: { type: "radius", size: "10" }, affects: "enemy" });
    expect(auraMacro(legacy).config).toMatchObject({ events: ["tokenEnter"], enterOn: "movement", excludeSelf: true, activity: "ddbGuardianAuraS" });

    const modern = trait(GuardianAura, "Guardian Aura", "");
    expect(auraMacro(modern).config.events).toEqual(["tokenEnter", "tokenTurnStart"]);
  });

  it("Conjured Animals: Place Aura fires Pack Damage on enter, the pack moving close, and turn end", () => {
    const e = trait(PackDamage, "Pack Damage", "");
    expect(e.activity).toMatchObject({ id: "ddbPackDamageSav", noTemplate: true });
    expect(placer(e).template).toMatchObject({ type: "radius", size: "10" });
    const behavior = auraMacro(e);
    // "whenever the pack moves within 10 feet of a creature" counts; the pack appearing does not
    expect(behavior.config).toMatchObject({ events: ["tokenEnter", "tokenTurnEnd"], enterOn: "movementOrArea", excludeSelf: true, activity: "ddbPackDamageSav" });
    expect(behavior.ddbimporter?.auraeffectsNever).toBeUndefined();
  });

  it("Conjured Elemental: the element's damage type, fired by a Place Aura on enter or turn start", () => {
    const e = trait(ElementDamage, "Fire Element", "");
    expect(e.activity.data.damage.parts[0].types).toEqual(["fire"]);
    expect(e.activity.noTemplate).toBe(true);
    expect(placer(e).template).toMatchObject({ type: "radius", size: "5" });
    expect(auraMacro(e).config).toMatchObject({ events: ["tokenEnter", "tokenTurnStart"], enterOn: "movement", excludeSelf: true, activity: "ddbElemDamageSav" });
  });

  it("Faithful Hound: Bark whispers the owner for Small or larger creatures within 30 feet", () => {
    const e = trait(Bark, "Bark", "");
    expect(e.type).toBe("utility");
    expect(e.activity.data.target.template).toMatchObject({ type: "radius", size: "30" });
    const behavior = macro(e.activity);
    expect(behavior.name).toBe("Bark");
    expect(behavior.config).toMatchObject({
      function: "notify",
      events: ["tokenEnter"],
      sizes: ["sm", "med", "lg", "huge", "grg"],
      excludeSelf: true,
    });
    expect(behavior.config.args.message).toContain("{token}");
  });
});
