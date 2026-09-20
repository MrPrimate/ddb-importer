import Chef from "../../../src/parser/enrichers/feat/Chef";
import ForcefulPresenceAwe from "../../../src/parser/enrichers/feat/ForcefulPresenceAwe";
import * as FeatEnrichers from "../../../src/parser/enrichers/feat/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

describe("Sentinel Halted", () => {
  it.each([false, true])("halts all movement modes until turn end (2014: %s)", (is2014) => {
    const enricher = makeEnricherData(FeatEnrichers.Sentinel, { name: "Sentinel", is2014 });
    expect(enricher.useDefaultAdditionalActivities).toBe(true);
    expect(enricher.addToDefaultAdditionalActivities).toBe(true);
    expect(enricher.effects).toEqual([expect.objectContaining({
      name: "Halted",
      activityMatch: "Sentinel Attack",
      changes: [{ key: "system.attributes.movement.multiplier", type: "multiply", value: "0", priority: 20 }],
      data: { duration: { value: 6, expiry: "turnEnd", expired: null } },
    })]);
  });
});

describe("Chef activity snippets", () => {
  it("points Eat Treat at the section that describes it", () => {
    const enricher = makeEnricherData(Chef);
    const activities = enricher.additionalActivities;

    // "Create Bolstering Treats" contains the DDB label, so it resolves on its own name;
    // "Eat Treat" has no textual relation to it and has to be told.
    expect(activities.map((a: any) => a.init.name)).toEqual(["Create Bolstering Treats", "Eat Treat"]);
    expect(activities[0].overrides).toBeUndefined();
    expect(activities[1].overrides?.useActivitySnippet).toEqual({ section: "Bolstering Treats" });
  });
});

/**
 * These two used to emit nothing without midi-QOL or AC5e. dnd5e 6.0 rule changes carry the
 * scope in a condition evaluated against the roll being made, so the advantage now lands with
 * no modules installed. The audit worksheets cannot see change data, so pin it here.
 */
describe("advantage scoped by a change condition", () => {
  it("gates Awe on the three Charisma skills", () => {
    const effect = makeEnricherData(ForcefulPresenceAwe).effects[0];
    const changes = effect.changes ?? [];
    expect(effect.midiChanges).toBeUndefined();
    expect(effect.ac5eChanges).toBeUndefined();
    expect(changes).toEqual([
      expect.objectContaining({ key: "check", value: "1", type: "dnd5e.advantage" }),
    ]);
    expect(JSON.parse(String(changes[0].conditions))).toEqual({
      k: "roll.skill", o: "in", v: ["itm", "prf", "per"],
    });
  });

  it("gates Auspex on the two abilities, for checks and saves alike", () => {
    const changes = makeEnricherData(FeatEnrichers.GreaterDisciplineAuspex).effects[0].changes ?? [];
    expect(changes.map((c) => c.key)).toEqual(["check", "save"]);
    for (const change of changes) {
      expect(change).toMatchObject({ value: "1", type: "dnd5e.advantage" });
      expect(JSON.parse(String(change.conditions))).toEqual({ k: "roll.ability", o: "in", v: ["int", "wis"] });
    }
  });
});

describe("Kindred feat consumption targets", () => {
  const CONSUMERS = [
    ["AlacrityBurstOfSpeed", FeatEnrichers.AlacrityBurstOfSpeed],
    ["DaywalkerEndureRadiance", FeatEnrichers.DaywalkerEndureRadiance],
    ["FeralWhispersCallOfTheWild", FeatEnrichers.FeralWhispersCallOfTheWild],
    ["GreaterDisciplineAuspex", FeatEnrichers.GreaterDisciplineAuspex],
    ["GreaterDisciplineCelerity", FeatEnrichers.GreaterDisciplineCelerity],
    ["GreaterDisciplinePotence", FeatEnrichers.GreaterDisciplinePotence],
    ["GreaterDisciplineProtean", FeatEnrichers.GreaterDisciplineProtean],
    ["SuperiorDisciplineCelerity", FeatEnrichers.SuperiorDisciplineCelerity],
    ["SuperiorDisciplineObfuscate", FeatEnrichers.SuperiorDisciplineObfuscate],
    ["SuperiorDisciplinePotence", FeatEnrichers.SuperiorDisciplinePotence],
    ["SupremeDisciplineAuspex", FeatEnrichers.SupremeDisciplineAuspex],
    ["SupremeDisciplineCelerity", FeatEnrichers.SupremeDisciplineCelerity],
    ["SupremeDisciplineFortitude", FeatEnrichers.SupremeDisciplineFortitude],
    ["SupremeDisciplineOblivion", FeatEnrichers.SupremeDisciplineOblivion],
    ["SupremeDisciplinePotence", FeatEnrichers.SupremeDisciplinePotence],
  ] as const;

  it.each(CONSUMERS)("%s uses the portable Blood Potency identifier", (_name, Enricher) => {
    expect(makeEnricherData(Enricher).activity.itemConsumeTargetName).toBe("feat:blood-potency");
  });
});

describe("War Caster", () => {
  it("adds the opportunity-spell reaction and leaves the concentration advantage to the generator", () => {
    const e = makeEnricherData(FeatEnrichers.WarCaster);
    expect(e.type).toBe("utility");
    expect(e.activity).toMatchObject({ name: "Opportunity Spell", activationType: "reaction" });
    // the DDB modifier's "maintain your concentration" restriction resolves through
    // RestrictionRules to attributes.concentration.roll.mode; a second copy here doubled it
    expect(e.effects).toEqual([]);
    expect(e.override).toMatchObject({ midiManualReaction: true });
  });
});

describe("native expiry owns the duration (no raw data.duration shadow)", () => {
  it("Dragonscarred Fearsome Power frightens until the end of the feat user's next turn", () => {
    const [frightened] = makeEnricherData(FeatEnrichers.Dragonscarred).effects;
    expect(frightened).toMatchObject({ name: "Frightened", activityMatch: "Fearsome Power", statuses: ["Frightened"] });
    expect(frightened.options).toEqual({ expiry: "sourceEnd" });
    expect(frightened.data).toBeUndefined();
  });
});

/**
 * dnd5e's off-hand damage roll drops a positive `@mod`; the 2024 feat restores it for a Light
 * crossbow. The rule is scoped by a change condition on the roll; the crossbow base items stand in
 * for "crossbow" since no such property exists, and Light narrows it to the hand crossbow.
 */
describe("Crossbow Expert Light crossbow extra attack", () => {
  it("adds the modifier back on an off-hand crossbow attack (2024)", () => {
    const effects = makeEnricherData(FeatEnrichers.CrossbowExpert).effects;
    expect(effects.map((e) => e.midiOnly ?? false)).toEqual([true, false]);
    const changes = effects[1].changes ?? [];
    expect(changes).toEqual([
      expect.objectContaining({ key: "damage", value: "@abilities.dex.mod", type: "dnd5e.bonus" }),
    ]);
    expect(JSON.parse(String(changes[0].conditions))).toEqual([
      { k: "roll.attack.mode", o: "in", v: ["offhand"] },
      { k: "item.type.baseItem", o: "in", v: ["handcrossbow", "heavycrossbow", "lightcrossbow"] },
      { k: "item.properties", o: "has", v: "lgt" },
      { k: "abilities.dex.mod", o: "gte", v: 1 },
    ]);
  });

  it("emits only the midi nearby-foes flag for the 2014 feat", () => {
    const effects = makeEnricherData(FeatEnrichers.CrossbowExpert, { is2014: true }).effects;
    expect(effects).toHaveLength(1);
    expect(effects[0].midiOnly).toBe(true);
  });
});

/**
 * 2024 Great Weapon Master adds the proficiency bonus to Heavy weapon hits. The rolled weapon's
 * properties are visible to the rule under `item`, so the feat's transfer effect carries a
 * damage rule; the Damage activity stays as the manual fallback.
 */
describe("Great Weapon Master heavy weapon mastery", () => {
  it("adds proficiency to Heavy weapon attack damage through a rule (2024)", () => {
    const effects = makeEnricherData(FeatEnrichers.GreatWeaponMaster).effects;
    expect(effects).toHaveLength(1);
    expect(effects[0].options).toMatchObject({ transfer: true });
    const changes = effects[0].changes ?? [];
    expect(changes).toEqual([
      expect.objectContaining({ key: "damage", value: "@prof", type: "dnd5e.bonus" }),
    ]);
    expect(JSON.parse(String(changes[0].conditions))).toEqual([
      { k: "roll.attack.classification", o: "exact", v: "weapon" },
      { k: "item.properties", o: "has", v: "hvy" },
    ]);
  });

  it("keeps the 2014 trade as a disabled toggle, as attack and damage rules", () => {
    const effects = makeEnricherData(FeatEnrichers.GreatWeaponMaster, { is2014: true }).effects;
    expect(effects).toHaveLength(1);
    expect(effects[0].options).toMatchObject({ transfer: true, disabled: true });
    expect((effects[0].changes ?? []).map((c) => [c.key, c.type, c.value])).toEqual([
      ["attack", "dnd5e.bonus", "-5"],
      ["damage", "dnd5e.bonus", "10"],
    ]);
  });
});

/**
 * These hints used to name DDB actions the character does not carry (wrong bucket, or a
 * 2024-only action on a 2014 build), which the audit reports as "No <action> feat action
 * found". The character audit only sees the warning, so the hint shapes are pinned here.
 */
describe("feat action hints match what DDB ships", () => {
  it("reads Energy Redirection from the feat bucket and rolls 2d12 + Con", () => {
    const boon = makeEnricherData(FeatEnrichers.BoonOfEnergyResistance);
    expect(boon.additionalActivities).toEqual([{ action: { name: "Energy Redirection", type: "feat" } }]);
    const redirect: any = makeEnricherData(FeatEnrichers.EnergyRedirection).activity;
    expect(redirect.data.damage.parts[0]).toMatchObject({ number: 2, denomination: 12, bonus: "@abilities.con.mod" });
    expect(redirect.data.save).toMatchObject({ ability: ["dex"], dc: { calculation: "con" } });
  });

  describe("Telekinetic builds Shove itself", () => {
    // DDB generates the "Telekinetic Shove" action only once the feat's ability is chosen
    it("keys the DC off the chosen ability", () => {
      const e: any = makeEnricherData(FeatEnrichers.Telekinetic, { ddbParser: { _chosen: [{ label: "Wisdom" }] } });
      expect(e.activity).toEqual({ type: "none" });
      expect(e.additionalActivities.some((a: any) => a.action)).toBe(false);
      const [shove] = e.additionalActivities;
      expect(shove.init).toEqual({ name: "Shove", type: "save" });
      expect(shove.build.saveOverride).toEqual({ ability: ["str"], dc: { calculation: "wis", formula: "" } });
      expect(shove.build.rangeOverride).toEqual({ units: "ft", value: "30" });
      expect(shove.build.targetOverride.affects).toMatchObject({ count: "1", type: "creature" });
      expect(shove.overrides).toMatchObject({ activationType: "bonus", overrideActivation: true });
    });

    it("falls back to the spellcasting ability with no choice recorded", () => {
      const e: any = makeEnricherData(FeatEnrichers.Telekinetic, { ddbParser: { _chosen: [] } });
      expect(e.additionalActivities[0].build.saveOverride.dc.calculation).toBe("spellcasting");
    });

    it("uses the spellcasting ability for the muncher", () => {
      const e: any = makeEnricherData(FeatEnrichers.Telekinetic, { ddbParser: { isMuncher: true, _chosen: [{ label: "Charisma" }] } });
      expect(e.additionalActivities[0].build.saveOverride.dc.calculation).toBe("spellcasting");
    });
  });

  it("Durable asks for Speedy Recovery only on 2024 builds", () => {
    expect(makeEnricherData(FeatEnrichers.Durable, { is2014: true }).additionalActivities).toEqual([]);
    expect(makeEnricherData(FeatEnrichers.Durable).additionalActivities)
      .toEqual([{ action: { name: "Speedy Recovery", type: "feat" } }]);
  });

  describe("Inspiring Leader builds Bolstering Performance itself", () => {
    it("wants no activity on 2014 builds", () => {
      expect(makeEnricherData(FeatEnrichers.InspiringLeader, { is2014: true }).additionalActivities).toEqual([]);
    });

    it("builds both ability variants for the muncher, ignoring any recorded choice", () => {
      const hints: any[] = makeEnricherData(FeatEnrichers.InspiringLeader, {
        ddbParser: { isMuncher: true, _chosen: [{ label: "Wisdom" }] },
      }).additionalActivities;
      expect(hints.some((a) => a.action)).toBe(false);
      expect(hints.map((a) => a.init.name))
        .toEqual(["Bolstering Performance: Temp HP (Wisdom)", "Bolstering Performance: Temp HP (Charisma)"]);
      expect(hints.map((a) => a.build.healingPart.custom.formula))
        .toEqual(["@details.level + @abilities.wis.mod", "@details.level + @abilities.cha.mod"]);
      expect(hints[0].build.healingPart.types).toEqual(["temphp"]);
      expect(hints[0].build.activationOverride.type).toBe("special");
      expect(hints[0].build.targetOverride.affects).toMatchObject({ count: "6", type: "ally" });
    });

    // DDB records the feat's ability pick as a "Wisdom" / "Charisma" choice label
    it("builds only the chosen ability's variant on a character import", () => {
      const hints: any[] = makeEnricherData(FeatEnrichers.InspiringLeader, {
        ddbParser: { isMuncher: false, _chosen: [{ label: "Charisma" }] },
      }).additionalActivities;
      expect(hints.map((a) => a.init.name)).toEqual(["Bolstering Performance: Temp HP"]);
      expect(hints[0].build.healingPart.custom.formula).toBe("@details.level + @abilities.cha.mod");
    });

    it("falls back to both variants when the character has not picked an ability yet", () => {
      const hints: any[] = makeEnricherData(FeatEnrichers.InspiringLeader, {
        ddbParser: { isMuncher: false, _chosen: [] },
      }).additionalActivities;
      expect(hints.map((a) => a.build.healingPart.custom.formula))
        .toEqual(["@details.level + @abilities.wis.mod", "@details.level + @abilities.cha.mod"]);
    });
  });
});

describe("DefensiveDuelist expiry by ruleset (dnd5e #7434)", () => {
  it("2014: the bonus covers that attack only, so the current turn is the ceiling and DAE ends it on the attack", () => {
    const [effect] = makeEnricherData(FeatEnrichers.DefensiveDuelist, { is2014: true }).effects;
    expect(effect.options?.expiry).toBe("turnEnd");
    expect(effect.daeSpecialDurations).toEqual(["isAttacked"]);
  });

  it("2024: the bonus lasts until the start of your next turn", () => {
    const [effect] = makeEnricherData(FeatEnrichers.DefensiveDuelist, { is2014: false }).effects;
    expect(effect.options?.expiry).toBe("sourceStart");
    expect(effect.daeSpecialDurations).toEqual([]);
  });
});

describe("Squire of Solamnia Precise Strike", () => {
  it("carries the weapon attack advantage on the core mode keys under the midi 1Attack duration", () => {
    const [effect] = makeEnricherData(FeatEnrichers.SquireOfSolamniaPreciseStrike).effects;
    expect(effect.midiOnly).toBe(true);
    expect(effect.daeSpecialDurations).toEqual(["1Attack"]);
    expect(effect.changes).toEqual([
      { key: "system.rolls.attack.mwak.mode", value: "1", type: "add", priority: 20 },
      { key: "system.rolls.attack.rwak.mode", value: "1", type: "add", priority: 20 },
    ]);
    expect(effect.midiChanges).toBeUndefined();
  });
});

/**
 * The Blood Potency pool maximum is the bare Kindred scale, so these feats raise the scale value
 * itself. A scale value is a plain number, changed before ability modifiers exist.
 */
describe("Kindred Blood Point maximum feats", () => {
  const SCALE_KEY = "system.scale.kindred.blood-points.value";

  it("adds Boon of Generations' flat 5 to the scale value", () => {
    const effect = makeEnricherData(FeatEnrichers.BoonOfGenerations).effects[0];
    expect(effect.options).toEqual({ transfer: true });
    expect(effect.changes).toEqual([{ key: SCALE_KEY, value: "5", type: "add", priority: 20 }]);
  });

  it.each([
    [3, "3"],
    // minimum 1
    [0, "1"],
    [-1, "1"],
  ])("writes a Constitution modifier of %i into Vitae Concentration as %s", (mod, value) => {
    const enricher = makeEnricherData(FeatEnrichers.VitaeConcentration, {
      ddbParser: { ddbCharacter: { abilities: { withEffects: { con: { mod } } } } },
    });
    // a literal: "@abilities.con.mod" and max() both cast to 0 on a numeric scale value
    expect(enricher.effects[0].changes).toEqual([{ key: SCALE_KEY, value, type: "add", priority: 20 }]);
  });

  it.each([
    ["BoonOfGenerations", FeatEnrichers.BoonOfGenerations],
    ["VitaeConcentration", FeatEnrichers.VitaeConcentration],
  ] as const)("%s clears the limited use DDB hangs the increase on", (_name, Enricher) => {
    expect(makeEnricherData(Enricher).override.uses).toEqual({ spent: null, max: null, recovery: [] });
  });

  it("falls back to the minimum of 1 for a compendium build with no character", () => {
    expect(makeEnricherData(FeatEnrichers.VitaeConcentration).effects[0].changes?.[0].value).toBe("1");
  });
});
