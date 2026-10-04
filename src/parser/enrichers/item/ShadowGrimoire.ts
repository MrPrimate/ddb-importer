import DDBEnricherData from "../data/DDBEnricherData";
import FabledItem from "./_FabledItem";
import HoardItem from "./_HoardItem";
import { itemActivity, itemProperty } from "./_ItemActivities";

/**
 * Shadow Grimoire, a fabled sentient spellbook DDB ships as "(Base)", "(5th Level)" to "(17th
 * Level)" plus an unsuffixed record describing every level, read as level 20. The book's own glyph
 * of warding (once per dusk, a 20-foot sphere, Dexterity save for half) is DC 13 and 5d8 cold,
 * DC 14 and 6d8 from 9th, DC 15 and 7d8 from 13th. The owner gains by level:
 * - 5th: the scroll page, a spell cast from the book 3 times per dusk
 * - 9th: 30 feet of darkvision (a parser modifier)
 * - 13th: a bonus action step from dim light or darkness to another shadow up to 200 feet away
 * - 17th: once per long rest, plane shift to the Shadow Realm with up to eight willing creatures
 */
export default class ShadowGrimoire extends FabledItem {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const tier = this.level >= 13 ? 2 : this.level >= 9 ? 1 : 0;
    const activities: IDDBAdditionalActivity[] = [
      itemProperty("Glyph of Warding", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: `${13 + tier}` },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 5 + tier, denomination: 8, types: ["cold"] })],
        onSave: "half",
        condition: "The grimoire triggers its glyph when it feels threatened",
        template: { type: "sphere", size: "20" },
        range: { value: null, units: "self" },
        uses: { max: "1", period: "dusk" },
        noeffect: true,
      }),
    ];
    if (this.level >= 5) {
      activities.push(itemProperty("Scroll Page", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "action",
        condition: "Cast the current scroll-page spell from the book as if from a scroll, with no material component",
        selfTarget: true,
        uses: { max: "3", period: "dusk" },
        noeffect: true,
      }));
    }
    if (this.level >= 13) {
      activities.push(itemActivity("Shadow Step", DDBEnricherData.ACTIVITY_TYPES.TELEPORT, {}, {
        activationOverride: { type: "bonus", value: 1, condition: "The area you occupy is in dim light or darkness: emerge from another shadow" },
        rangeOverride: { value: "200", units: "ft" },
      }));
    }
    if (this.level >= 17) {
      activities.push(itemProperty("Journey to the Shadow Realm", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "action",
        condition: "Transport yourself and up to eight willing creatures to the Shadow Realm as if you had cast plane shift",
        targetCount: "9",
        uses: { max: "1", period: "lr" },
        noeffect: true,
      }));
    }
    // the text's "until the next dusk" is a recovery, not a duration
    return activities.map((activity) => HoardItem.withDuration(activity));
  }

  /**
   * DDB attaches the Glyph of Warding spell, which the item-spell path turns into a cast using the
   * caster's DC. The book's own glyph has a fixed DC and damage, built above, so the cast goes.
   */
  override async cleanup(): Promise<void> {
    const activities = (this.data as { system?: { activities?: Record<string, I5eActivity> } }).system?.activities;
    if (!activities) return;
    for (const [id, activity] of Object.entries(activities)) {
      if (activity.type === "cast" && (activity.name ?? "").startsWith("Glyph of Warding")) delete activities[id];
    }
  }

}
