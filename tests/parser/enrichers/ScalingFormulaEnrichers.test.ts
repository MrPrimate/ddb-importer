import AuraOfConquest from "../../../src/parser/enrichers/class/paladin/AuraOfConquest";
import StormAuraTundra from "../../../src/parser/enrichers/class/barbarian/StormAuraTundra";
import ElementalEpitome from "../../../src/parser/enrichers/class/monk/ElementalEpitome";
import Moxie from "../../../src/parser/enrichers/class/pugilist/Moxie";
import FavoredFoe from "../../../src/parser/enrichers/class/ranger/FavoredFoe";
import TentacleOfTheDeepsAttack from "../../../src/parser/enrichers/class/warlock/TentacleOfTheDeepsAttack";
import PhoenixRocketSword from "../../../src/parser/enrichers/item/PhoenixRocketSword";
import Requiem from "../../../src/parser/enrichers/item/Requiem";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

const build = (Enricher: new (options: any) => any, options: Parameters<typeof makeEnricherData>[1] = {}): any =>
  makeEnricherData(Enricher, options);

describe("scale and scaling formulas", () => {
  it("Aura of Conquest deals half the paladin level and keeps its radius scale out of the damage", () => {
    const e = build(AuraOfConquest);
    expect(e.activity.data.damage.parts[0].custom.formula).toBe("floor(@classes.paladin.levels / 2)");
    // the same-named scale is the aura radius, which the character import would swap into the damage
    expect(e.override.data.flags.ddbimporter.skipScale).toBe(true);
  });

  it("Storm Aura (Tundra) reads the storm-herald subclass scale", () => {
    expect(JSON.stringify(build(StormAuraTundra).activity)).toContain("@scale.storm-herald.storm-aura-tundra");
  });

  // dnd5e's @scaling is the scaling value (increase + 1), i.e. the charges or questions spent
  it("Phoenix Rocket Sword's push DC is 10 + the charges expended", () => {
    const rocket = build(PhoenixRocketSword).additionalActivities.find((a: any) => a.init.name === "Rocket");
    expect(rocket.build.saveOverride.dc.formula).toBe("10 + @scaling");
  });

  it("Requiem's addiction DC is the printed base + 1 per question asked", () => {
    expect(build(Requiem, { name: "Requiem Bliss" }).activity.data.save.dc.formula).toBe("12 + @scaling");
    expect(build(Requiem, { name: "Requiem Clay" }).activity.data.save.dc.formula).toBe("10 + @scaling");
  });

  it("Requiem's scaling max is the most questions the drug answers", () => {
    // dnd5e's scaling max is the highest scaling value offered, which is questions asked
    expect(build(Requiem, { name: "Requiem Bliss" }).activity.addConsumptionScalingMax).toBe("10");
    expect(build(Requiem, { name: "Requiem Clay" }).activity.addConsumptionScalingMax).toBe("5");
  });
});

describe("feature-held scales rooted on their class", () => {
  const RANGER = { ddbCharacter: { raw: { classes: [{ name: "Rogue", _id: "rogue000000000aa" }, { name: "Ranger", _id: "ranger00000000aa" }] } } };

  it("Favored Foe reads its die scale against the ranger's level", () => {
    expect(build(FavoredFoe, { ddbParser: RANGER }).override.data.flags)
      .toEqual({ dnd5e: { advancementRoot: "ranger00000000aa" } });
    // the muncher has no character, so no root
    expect(build(FavoredFoe).override.data.flags).toEqual({});
  });
});

describe("damage formulas CharacterFeatureFactory._setLevelScales used to mask", () => {
  it("Moxie's Unarmed Strike activities roll the Fisticuffs die and opt out of the Moxie point scale", () => {
    const e = build(Moxie);
    for (const name of ["One-Two Punch", "Stick and Move"]) {
      const hint = e.additionalActivities.find((a: any) => a.action?.name === name);
      expect(hint.overrides.data.damage.parts).toEqual([
        expect.objectContaining({ types: ["bludgeoning"], custom: { enabled: true, formula: "@scale.pugilist.fisticuffs + @abilities.str.mod" } }),
      ]);
    }
    expect(e.override.data.flags.ddbimporter.skipScale).toBe(true);
  });

  it("Tentacle of the Deeps deals flat scaled cold damage with no ability modifier", () => {
    const parts = build(TentacleOfTheDeepsAttack).activity.data.damage.parts;
    expect(parts).toEqual([
      expect.objectContaining({ types: ["cold"], custom: { enabled: true, formula: "@scale.the-fathomless.tentacle-of-the-deeps" } }),
    ]);
  });

  it("Elemental Epitome's damage is one Martial Arts die", () => {
    const hint = build(ElementalEpitome).additionalActivities.find((a: any) => a.init?.name === "Elemental Epitome Damage");
    expect(hint.build.damageParts[0].custom.formula).toBe("@scale.monk.die");
  });
});
