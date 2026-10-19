/**
 * Feat enricher hints for ruleset branches the audit captures cannot pin on their own. These
 * assert the hints a DDBFeature consumes, not the built document.
 */
import * as FeatEnrichers from "../../../src/parser/enrichers/feat/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

describe("InspiringLeader", () => {
  it("builds the 2014 ten-minute speech: level plus Charisma temp HP for six allies", () => {
    const [speech]: any[] = makeEnricherData(FeatEnrichers.InspiringLeader, { is2014: true }).additionalActivities;
    expect(speech.init).toEqual({ name: "Inspiring Speech", type: "heal" });
    expect(speech.build.activationOverride).toMatchObject({ type: "minute", value: 10 });
    expect(speech.build.healingPart.custom.formula).toBe("@details.level + @abilities.cha.mod");
    expect(speech.build.targetOverride.affects).toMatchObject({ count: "6", type: "ally" });
  });
});

/**
 * Arcana Unleashed familiar feats. Each builds its own Find Familiar summons (the feats require
 * Familiar Friend, so every one carries Fortified Familiar's HP bonus), and each imbued summon
 * links one resistance effect that dnd5e applies to the summoned familiar. The imbuing feats also
 * carry the official enchant, which copies rider summons onto the Find Familiar spell.
 */
describe("Arcana Unleashed familiar feats", () => {
  const title = (t: string) => `${t.charAt(0).toUpperCase()}${t.slice(1)}`;

  it("Familiar Friend summons from the free use, a level-scaling slot or a ritual", () => {
    const enricher = makeEnricherData(FeatEnrichers.FamiliarFriend, { name: "Familiar Friend (Intelligence)" });
    expect(enricher.identifier).toBe("familiar-friend");
    const [free, slot, ritual, helpful, fortified] = enricher.additionalActivities;
    expect(free.id).toBe("famFriendFree000");
    expect(free.overrides).toMatchObject({
      noConsumeTargets: true,
      addItemConsume: true,
      itemConsumeTargetName: undefined,
      addSpellSlotConsume: false,
      data: { bonuses: { hp: "2 * @details.level" } },
    });
    expect(slot.overrides).toMatchObject({
      addItemConsume: false,
      addSpellSlotConsume: true,
      spellSlotConsumeTarget: "1",
      addSpellSlotScalingMode: "level",
      addConsumptionScalingMax: "9",
      data: { bonuses: { hp: "2 * @details.level" } },
    });
    expect(ritual.init?.name).toBe("Find Familiar (Ritual)");
    expect(ritual.build?.activationOverride).toMatchObject({ type: "minute", value: 70 });
    expect(ritual.overrides).toMatchObject({ noConsumeTargets: true, addItemConsume: false, addSpellSlotConsume: false });
    expect(helpful.init?.name).toBe("Helpful Friend");
    expect(fortified.init).toMatchObject({ name: "Fortified Familiar", type: "enchant" });
    expect(fortified.overrides?.data).toMatchObject({ restrictions: { type: "spell" } });
    expect(enricher.effects).toEqual([expect.objectContaining({
      type: "enchant",
      activityMatch: "Fortified Familiar",
      changes: [expect.objectContaining({ key: "activities[summon].bonuses.hp", value: "2 * @details.level" })],
    })]);
  });

  it.each([
    [FeatEnrichers.OtherworldlyFamiliar, "Otherworldly Familiar", "Otherworldly", "Otherworldly Power", ["necrotic", "poison", "psychic", "radiant", "thunder"]],
    [FeatEnrichers.ElementalFamiliar, "Elemental Familiar (Wisdom)", "Elemental", "Elemental Energy", ["acid", "cold", "fire", "lightning", "thunder"]],
  ])("%#: imbued summons per damage type, a rider copy of each and the enchant", (Enricher, name, prefix, enchantName, types) => {
    const enricher = makeEnricherData(Enricher as typeof FeatEnrichers.ElementalFamiliar, { name });
    const activities = enricher.additionalActivities;
    const summons = activities.filter((a: any) => a.init.type === "summon");
    const usable = summons.filter((a: any) => a.overrides?.addItemConsume);
    const riders = summons.filter((a: any) => !a.overrides?.addItemConsume);
    const names = types.map((t) => `${prefix} ${title(t)} Familiar`);

    expect(usable.map((a: any) => a.init.name)).toEqual(names);
    expect(riders.map((a: any) => a.init.name)).toEqual(names);
    expect(new Set(summons.map((a: any) => a.id)).size).toBe(types.length * 2);
    for (const summon of summons) {
      expect(summon.id).toHaveLength(16);
      expect(summon.overrides?.data).toMatchObject({
        bonuses: { hp: "2 * @details.level" },
        creatureTypes: ["celestial", "fey", "fiend"],
        summon: { mode: "cr", prompt: true },
      });
    }
    // usable summons spend Familiar Friend's free cast and a level-scaling slot, the player
    // unticking whichever was not used; rider copies leave payment to the enchanted spell
    for (const summon of usable) {
      expect(summon.overrides).toMatchObject({
        itemConsumeTargetName: "feat:familiar-friend",
        addSpellSlotConsume: true,
        addSpellSlotScalingMode: "level",
        addConsumptionScalingMax: "9",
      });
    }
    for (const summon of riders) {
      expect(summon.overrides).toMatchObject({ noConsumeTargets: true, addItemConsume: false, addSpellSlotConsume: false });
    }

    const resistances = enricher.effects.filter((e: any) => e.name.endsWith("Resistance"));
    expect(resistances.map((e: any) => [e.activityMatch, e.changes[0].value])).toEqual(
      types.map((t, i) => [names[i], t]),
    );

    const enchant = activities.find((a: any) => a.init.type === "enchant");
    expect(enchant?.init?.name).toBe(enchantName);
    expect(enchant?.overrides?.data).toMatchObject({ restrictions: { type: "spell" } });
    const profile = enricher.effects.find((e: any) => e.type === "enchant");
    expect(profile).toMatchObject({ name: enchantName, activityMatch: enchantName });
    expect(profile?.data?.flags?.ddbimporter?.activityRiders).toEqual(riders.map((a: any) => a.id));

    expect(enricher.override.descriptionSuffix).toContain("Implementation Details");
  });

  it("Elemental Familiar scopes Prone to Energy Pulse and notes the size limit", () => {
    const enricher = makeEnricherData(FeatEnrichers.ElementalFamiliar, { name: "Elemental Familiar (Charisma)" });
    expect(enricher.clearAutoEffects).toBe(true);
    expect(enricher.effects[0]).toMatchObject({
      activityMatch: "Energy Pulse",
      statuses: ["prone"],
      options: { description: expect.stringContaining("Medium or smaller") },
    });
  });

  it("Warlike Familiar's Intercept Attack rolls the proficiency bonus AC boost", () => {
    const activity = makeEnricherData(FeatEnrichers.WarlikeFamiliar, { name: "Warlike Familiar (Charisma)" }).activity;
    expect(activity).toMatchObject({ activationType: "reaction", data: { roll: { name: "Armor Class Bonus", formula: "@prof" } } });
  });
});

describe("feat NakudamasElectricBloodline", () => {
  const name = "Nakudama’s Electric Bloodline";
  const attack = (activityName: string) => ({
    type: "attack",
    name: activityName,
    damage: { includeBase: true, parts: [{ number: 1, denomination: 12, bonus: "@mod", types: ["lightning"] }] },
  });

  it("rolls the feat's tongue dice scale on both tongue attacks and leaves the grapple save alone", async () => {
    const data = {
      system: {
        activities: {
          str: attack("Electric Tongue (Str.)"),
          dex: attack("Electric Tongue (Dex.)"),
          save: { type: "save", name: "Electric Body", damage: { parts: [{ number: 1, denomination: 10, types: ["lightning"] }] } },
        },
      },
    };
    const e: any = makeEnricherData(FeatEnrichers.NakudamasElectricBloodline, { name, data });
    // the feat itself, not one of its actions, so the scale identifier comes from its own name
    e.ddbEnricher.findActionParent = () => null;
    expect(e.tongueFormula).toBe("@scale.nakudamas-electric-bloodline.tongue + @mod");
    await e.override.func({ enricher: { data } });
    for (const key of ["str", "dex"]) {
      const parts = (data.system.activities as any)[key].damage.parts;
      expect(parts).toHaveLength(1);
      expect(parts[0].custom).toEqual({ enabled: true, formula: "@scale.nakudamas-electric-bloodline.tongue + @mod" });
      expect(parts[0].types).toEqual(["lightning"]);
    }
    expect((data.system.activities as any).save.damage.parts[0].denomination).toBe(10);
  });

  it("adds the lightning resistance DDB sends no modifier for", () => {
    const [effect] = makeEnricherData(FeatEnrichers.NakudamasElectricBloodline, { name }).effects;
    expect(effect.options?.transfer).toBe(true);
    expect(effect.changes?.map((change: any) => change.key)).toEqual(["system.traits.dr.value"]);
  });
});

describe("Greater Mark feats", () => {
  it("keep their DDB actions as activities beside the intuition die upgrade", () => {
    const enricher = makeEnricherData(FeatEnrichers._GreaterMarkOf, { name: "Greater Mark of Warding" });
    // the Generic action build is what carries Improved Warding, Subdue Animal and Mark of Inspiration
    expect(enricher.useDefaultAdditionalActivities).toBe(true);
    expect(enricher.override).toBeNull();
    // Foundry 13: the passive effect clears any inherited duration
    expect(enricher.effects).toEqual([expect.objectContaining({
      options: expect.objectContaining({ transfer: true }),
      changes: [{ key: "system.scale.mark-of-warding.die.faces", mode: 4, value: "6", priority: 20 }],
    })]);
    expect(enricher.effects).toHaveLength(1);
  });

  it("Greater Mark of Handling's text-built Frightened belongs to Subdue Animal alone", () => {
    const enricher = makeEnricherData(FeatEnrichers._GreaterMarkOf, { name: "Greater Mark of Handling" });
    expect(enricher.effects).toHaveLength(2);
    // noCreate merges into the parser's "Status: Frightened" rather than adding a second effect
    expect(enricher.effects[1]).toEqual({
      name: "Subdue Animal: Frightened",
      noCreate: true,
      activityMatch: "Subdue Animal",
    });
    expect(enricher.effects[0].changes?.[0].key).toBe("system.scale.mark-of-handling.die.faces");
  });
});

/**
 * Feats that raise "X or Y" key an activity off the raised ability. A recorded pick gives one
 * activity; the muncher, or a character with no pick, gets one per ability (the official shape).
 */
describe("feat activities keyed off the raised ability", () => {
  const FEAT_ID = 4242;
  const pickedBy = (kind: "choice" | "modifier" | "none", ability: string) => ({
    ddbParser: { isMuncher: false, ddbDefinition: { id: FEAT_ID } },
    character: {
      choices: {
        feat: kind === "choice" ? [{ componentId: FEAT_ID, componentTypeId: 7, type: 2, optionValue: 11 }] : [],
        choiceDefinitions: [{ id: "7-2", options: [{ id: 11, label: `${ability} Score` }] }],
      },
      modifiers: {
        feat: kind === "modifier"
          ? [{ componentId: FEAT_ID, type: "bonus", subType: `${ability.toLowerCase()}-score` }]
          : [{ componentId: FEAT_ID, type: "bonus", subType: "choose-strength-or-dexterity" }],
        class: [], race: [], background: [], item: [], condition: [],
      },
    },
  });

  it.each(["choice", "modifier"] as const)("builds one Fairy Trickster save from a pick recorded as a %s", (kind) => {
    const e: any = makeEnricherData(FeatEnrichers.FairyTrickster, pickedBy(kind, "Charisma"));
    expect(e.activity.name).toBe("Flustering Strike");
    expect(e.activity.data.save.dc.calculation).toBe("cha");
    expect(e.additionalActivities).toEqual([]);
  });

  it.each([
    ["muncher", { ddbParser: { isMuncher: true, ddbDefinition: { id: FEAT_ID } } }],
    ["no pick", pickedBy("none", "Charisma")],
  ])("builds a Fairy Trickster save per ability for the %s", (_label, options) => {
    const e: any = makeEnricherData(FeatEnrichers.FairyTrickster, options);
    expect(e.activity.name).toBe("Flustering Strike (Dexterity)");
    expect(e.activity.data.save.dc.calculation).toBe("dex");
    expect(e.additionalActivities).toEqual([
      expect.objectContaining({
        duplicate: true,
        overrides: expect.objectContaining({ name: "Flustering Strike (Charisma)" }),
      }),
    ]);
    // one Flustered effect for every save
    expect(e.effects[0].activityTypesMatch).toEqual(["save"]);
  });

  it("splits Purple Dragon Commandant's Encourage Ally per ability without a pick", () => {
    const unpicked: any = makeEnricherData(FeatEnrichers.PurpleDragonCommandant, pickedBy("none", "Dexterity"));
    expect(unpicked.activity.name).toBe("Encourage Ally (Strength)");
    expect(unpicked.activity.data.healing.bonus).toBe("@abilities.str.mod");
    expect(unpicked.additionalActivities[0].overrides.name).toBe("Encourage Ally (Dexterity)");
    expect(unpicked.additionalActivities[0].overrides.data.healing.bonus).toBe("@abilities.dex.mod");

    const picked: any = makeEnricherData(FeatEnrichers.PurpleDragonCommandant, pickedBy("modifier", "Dexterity"));
    expect(picked.activity.name).toBe("Encourage Ally");
    expect(picked.activity.data.healing.bonus).toBe("@abilities.dex.mod");
    expect(picked.additionalActivities).toEqual([]);
  });
});

describe("feat uses DDB sends with the Other reset", () => {
  const action = (name: string, numberUsed = 0) => ({ name, limitedUse: { maxUses: 1, numberUsed, resetType: 4 } });

  it.each([
    [FeatEnrichers.ColdCaster, "Frostbite", "turn"],
    [FeatEnrichers.BoonOfPoisonMastery, "Perfect Poisoner", "turn"],
    [FeatEnrichers.BoonOfFortunesFavor, "Saving Throw Reroll", "turnStart"],
    [FeatEnrichers.ActionHero, "Heroic Moment", "day"],
  ])("%o takes the period its text gives and keeps the DDB action activities", (Enricher, actionName, period) => {
    const e: any = makeEnricherData(Enricher as any, { actions: { feat: [action(actionName as string, 1)] } });
    expect(e.useDefaultAdditionalActivities).toBe(true);
    expect(e.override.uses).toEqual({ spent: 1, max: "1", recovery: [{ period, type: "recoverAll", formula: undefined }] });
  });

  it("gives Charm Twister no uses and frees its Twisted Hex", () => {
    const e: any = makeEnricherData(FeatEnrichers.CharmTwister, { actions: { feat: [action("Twisted Hex: Wisdom"), action("Unrelated")] } });
    expect(e.override).toEqual({ uses: { spent: 0, max: "", recovery: [] }, noConsumeTargetActivities: ["Twisted Hex: Wisdom"] });
  });
});
