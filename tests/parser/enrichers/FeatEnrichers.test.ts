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
