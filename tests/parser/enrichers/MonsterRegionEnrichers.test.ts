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

describe("monster Generic TurnStartAuraSave", () => {
  const rakdos = "Any creature that starts its turn within 30 feet of Rakdos must make a DC 25 Wisdom saving throw.";

  it("supplies the emanation when the text names the monster and the parser found no template", () => {
    const e = trait(TurnStartAuraSave, "Captivating Presence", rakdos);
    expect(e.activity.targetType).toBe("creature");
    expect(e.activity.data.target.template).toMatchObject({ type: "radius", size: "30" });
    expect(macro(e.activity).config).toMatchObject({ events: ["tokenTurnStart"], excludeSelf: true });
  });

  it("leaves the parser's template alone when it already extracted one", () => {
    const e = trait(TurnStartAuraSave, "Gibbering",
      "Each creature that starts its turn within 20 feet of the mouther must succeed on a DC 10 Wisdom saving throw.",
      { ddbParser: { actionData: { target: { template: { size: "20" } } } } });
    expect(e.activity.targetType).toBeUndefined();
    expect(e.activity.data.target).toBeUndefined();
    expect(macro(e.activity).config.events).toEqual(["tokenTurnStart"]);
  });

  it("also fires on entry when the trait says so", () => {
    const e = trait(TurnStartAuraSave, "Arcane Leak",
      "Any creature that starts its turn within 10 feet of the adranach or enters that area for the first time on a turn takes 10 (3d6) radiant damage.");
    expect(macro(e.activity).config.events).toEqual(["tokenEnter", "tokenTurnStart"]);
  });

  it("emits nothing for an owner-turn variant sharing the name", () => {
    const e = trait(TurnStartAuraSave, "Chilling Presence",
      "At the start of each of the thuellai's turns, each creature within 15 feet of it must succeed on a DC 17 Constitution saving throw.");
    expect(e.activity).toEqual({});
  });

  it.each([
    ["Dread", { excludeTypes: ["fiend"] }],
    ["Aberrant Form", { excludeTypes: ["aberration"] }],
    ["Confounding Ugliness", { types: ["humanoid"] }],
  ])("carries the type exemption for %s", (name, filters) => {
    const e = trait(TurnStartAuraSave, name, `Any creature that starts its turn within 10 feet of ${name} must save.`);
    expect(macro(e.activity).config).toMatchObject(filters);
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
    expect(behavior.ddbimporter.auraeffectsNever).toBe(true);
    expect(e.effects[0]).toMatchObject({ auraeffectsOnly: true, midiOnly: true });
  });

  it("Guardian of Faith: enemies entering, plus turn start in 2024", () => {
    const legacy = trait(GuardianAura, "Guardian Aura", "", { is2014: true });
    expect(legacy.activity.targetType).toBe("enemy");
    expect(legacy.activity.data.target.template).toMatchObject({ type: "radius", size: "10" });
    expect(macro(legacy.activity).config.events).toEqual(["tokenEnter", "tokenMoveIn"]);
    expect(legacy.activity).toMatchObject({ addItemConsume: true, itemConsumeValue: "20" });

    const modern = trait(GuardianAura, "Guardian Aura", "");
    expect(macro(modern.activity).config.events).toEqual(["tokenEnter", "tokenMoveIn", "tokenTurnStart"]);
  });

  it("Conjured Animals: Pack Damage fires on enter and turn end without the Aura Effects arm", () => {
    const e = trait(PackDamage, "Pack Damage", "");
    expect(e.activity.id).toBe("ddbPackDamageSav");
    expect(e.activity.data.target.template).toMatchObject({ type: "radius", size: "10" });
    const behavior = macro(e.activity);
    expect(behavior.config).toMatchObject({ events: ["tokenEnter", "tokenTurnEnd"], excludeSelf: true });
    expect(behavior.ddbimporter.auraeffectsNever).toBe(true);
  });

  it("Conjured Elemental: the element's damage type and an enter/turn-start trigger", () => {
    const e = trait(ElementDamage, "Fire Element", "");
    expect(e.activity.data.damage.parts[0].types).toEqual(["fire"]);
    expect(e.activity.data.target.template).toMatchObject({ type: "radius", size: "5" });
    expect(macro(e.activity).config).toMatchObject({ events: ["tokenEnter", "tokenTurnStart"], excludeSelf: true });
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
