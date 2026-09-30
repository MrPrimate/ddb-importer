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
      options: expect.objectContaining({ expiry: "turnEnd" }),
    })]);
    // dnd5e 5.3 has no movement multiplier: the custom "*0" covers every speed, and the
    // per-mode overrides hold each speed at 0 against later additions
    const changes = (enricher.effects[0] as any).changes;
    expect(changes[0]).toMatchObject({ key: "system.attributes.movement.all", type: "custom", value: "*0" });
    expect(changes.slice(1).map((c: any) => [c.key, c.type, c.value])).toEqual(
      ["walk", "fly", "swim", "climb", "burrow"].map((mode) => [`system.attributes.movement.${mode}`, "override", "0"]),
    );
    // expiry only: no counted duration and no raw data.duration shadow
    expect((enricher.effects[0] as any).options).toEqual({ expiry: "turnEnd" });
    expect(enricher.effects[0].data).toBeUndefined();
  });
});

/**
 * dnd5e 5.3 has no rule changes to scope advantage to a skill or ability, so these two carry the
 * advantage on midi-QOL and AC5e flags only.
 */
describe("scoped advantage on module flags", () => {
  it("gives Awe advantage on the three Charisma skills", () => {
    const effect = makeEnricherData(ForcefulPresenceAwe).effects[0];
    expect(effect.changes ?? []).toEqual([]);
    expect(effect.midiChanges?.map((c) => c.key)).toEqual([
      "flags.midi-qol.advantage.skill.itm",
      "flags.midi-qol.advantage.skill.prf",
      "flags.midi-qol.advantage.skill.per",
    ]);
    expect(effect.ac5eChanges?.map((c) => [c.key, c.value])).toEqual([
      ["flags.automated-conditions-5e.check.advantage", "skill.itm || skill.prf || skill.per"],
    ]);
  });

  it("gives Auspex advantage on Intelligence and Wisdom checks and saves", () => {
    const effect = makeEnricherData(FeatEnrichers.GreaterDisciplineAuspex).effects[0];
    expect(effect.midiChanges).toHaveLength(4);
    expect(effect.ac5eChanges?.map((c) => c.key)).toEqual([
      "flags.automated-conditions-5e.check.advantage",
      "flags.automated-conditions-5e.save.advantage",
    ]);
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

describe("Crossbow Expert", () => {
  it("emits only the midi nearby-foes flag", () => {
    for (const is2014 of [false, true]) {
      const effects = makeEnricherData(FeatEnrichers.CrossbowExpert, { is2014 }).effects;
      expect(effects).toHaveLength(1);
      expect(effects[0].midiOnly).toBe(true);
    }
  });
});

/**
 * 2024 Great Weapon Master's Heavy weapon bonus is applied by the GWM enhancer at roll time on
 * dnd5e 5.3, so only the 2014 trade carries an effect.
 */
describe("Great Weapon Master", () => {
  it("keeps the 2014 trade as a disabled toggle on the melee weapon bonuses", () => {
    const effects = makeEnricherData(FeatEnrichers.GreatWeaponMaster, { is2014: true }).effects;
    expect(effects).toHaveLength(1);
    expect(effects[0].options).toMatchObject({ transfer: true, disabled: true });
    expect((effects[0].changes ?? []).map((c) => [c.key, c.type, c.value])).toEqual([
      ["system.bonuses.mwak.attack", "add", "-5"],
      ["system.bonuses.mwak.damage", "add", "+10"],
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
    it("builds the 2014 ten-minute speech: level plus Charisma temp HP for six allies", () => {
      const [speech]: any[] = makeEnricherData(FeatEnrichers.InspiringLeader, { is2014: true }).additionalActivities;
      expect(speech.init).toEqual({ name: "Inspiring Speech", type: "heal" });
      expect(speech.build.activationOverride).toMatchObject({ type: "minute", value: 10 });
      expect(speech.build.healingPart.custom.formula).toBe("@details.level + @abilities.cha.mod");
      expect(speech.build.targetOverride.affects).toMatchObject({ count: "6", type: "ally" });
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
  it("carries the weapon attack advantage on midi flags under the 1Attack duration", () => {
    const [effect] = makeEnricherData(FeatEnrichers.SquireOfSolamniaPreciseStrike).effects;
    expect(effect.midiOnly).toBe(true);
    expect(effect.daeSpecialDurations).toEqual(["1Attack"]);
    expect(effect.midiChanges?.map((c) => c.key)).toEqual([
      "flags.midi-qol.advantage.attack.mwak",
      "flags.midi-qol.advantage.attack.rwak",
    ]);
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

/**
 * Arcana Unleashed familiar feats. Each builds its own Find Familiar summons (the feats require
 * Familiar Friend, so every one carries Fortified Familiar's HP bonus), and each imbued summon
 * links one resistance effect that dnd5e applies to the summoned familiar.
 */
describe("Arcana Unleashed familiar feats", () => {
  it("Familiar Friend summons the familiar with its HP bonus from the free use or a spell slot", () => {
    const enricher = makeEnricherData(FeatEnrichers.FamiliarFriend, { name: "Familiar Friend (Intelligence)" });
    const [free, slot, helpful] = enricher.additionalActivities;
    expect(free.id).toBe("famFriendFree000");
    expect(free.overrides).toMatchObject({ addItemConsume: true, data: { bonuses: { hp: "2 * @details.level" } } });
    expect(slot.build?.consumptionOverride?.targets).toEqual([
      expect.objectContaining({ type: "spellSlots", target: "1", value: "1" }),
    ]);
    expect(slot.overrides).toMatchObject({ addItemConsume: false, data: { bonuses: { hp: "2 * @details.level" } } });
    expect(helpful.init?.name).toBe("Helpful Friend");
  });

  it.each([
    [FeatEnrichers.OtherworldlyFamiliar, "Otherworldly Familiar", "Otherworldly", ["necrotic", "poison", "psychic", "radiant", "thunder"]],
    [FeatEnrichers.ElementalFamiliar, "Elemental Familiar (Wisdom)", "Elemental", ["acid", "cold", "fire", "lightning", "thunder"]],
  ])("%#: one imbued summon per damage type, each linking its resistance", (Enricher, name, prefix, types) => {
    const enricher = makeEnricherData(Enricher as typeof FeatEnrichers.ElementalFamiliar, { name });
    const summons = enricher.additionalActivities;
    expect(summons.map((a: any) => a.init.name)).toEqual(types.map((t) => `${prefix} ${t.charAt(0).toUpperCase()}${t.slice(1)} Familiar`));
    expect(new Set(summons.map((a: any) => a.id)).size).toBe(types.length);
    for (const summon of summons) {
      expect(summon.overrides?.data).toMatchObject({
        bonuses: { hp: "2 * @details.level" },
        creatureTypes: ["celestial", "fey", "fiend"],
        summon: { mode: "cr", prompt: true },
      });
    }
    const resistances = enricher.effects.filter((e: any) => e.name.endsWith("Resistance"));
    expect(resistances.map((e: any) => [e.activityMatch, e.changes[0].value])).toEqual(
      types.map((t) => [`${prefix} ${t.charAt(0).toUpperCase()}${t.slice(1)} Familiar`, t]),
    );
  });

  it("Elemental Familiar scopes Prone to Energy Pulse", () => {
    const enricher = makeEnricherData(FeatEnrichers.ElementalFamiliar, { name: "Elemental Familiar (Charisma)" });
    expect(enricher.clearAutoEffects).toBe(true);
    expect(enricher.effects[0]).toMatchObject({ activityMatch: "Energy Pulse", statuses: ["prone"] });
  });

  it("Warlike Familiar's Intercept Attack rolls the proficiency bonus AC boost", () => {
    const activity = makeEnricherData(FeatEnrichers.WarlikeFamiliar, { name: "Warlike Familiar (Charisma)" }).activity;
    expect(activity).toMatchObject({ activationType: "reaction", data: { roll: { name: "Armor Class Bonus", formula: "@prof" } } });
  });
});
