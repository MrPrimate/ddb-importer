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
