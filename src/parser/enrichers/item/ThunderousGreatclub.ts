import DDBEnricherData from "../data/DDBEnricherData";
import { itemProperty } from "./_ItemActivities";

/**
 * Thunderous Greatclub: Strength 20 while attuned (DDB's modifier) and an extra 1d8 thunder on a
 * hit. Clap of Thunder is a 30 foot cone, a DC 15 Strength save or Prone, with no use limit.
 * Earthquake is a 50 foot radius once per dawn (the item's single use): a DC 20 Dexterity save or
 * Prone, a DC 20 Constitution save for creatures concentrating, and a fissure whose creatures make
 * a DC 20 Dexterity save or fall in. Only Clap of Thunder and Earthquake knock creatures prone, and
 * none of the saves roll the club's weapon damage; the object and structure damage is text only.
 */
export default class ThunderousGreatclub extends DDBEnricherData {

  static CLAP = "Clap of Thunder";

  static EARTHQUAKE = "Earthquake";

  // the parser's Prone links to every save, the concentration and fissure saves included
  override get clearAutoStatusEffect(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(ThunderousGreatclub.CLAP, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["str"], formula: "15" },
        activationType: "action",
        condition: "Strike the club against a hard surface; the clap is audible out to 300 feet, and nonmagical objects in the cone that aren't worn or carried take 3d8 thunder damage",
        template: { type: "cone", size: "30" },
        range: { value: null, units: "self" },
        noeffect: false,
      }),
      itemProperty(ThunderousGreatclub.EARTHQUAKE, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "20" },
        activationType: "action",
        condition: "Strike the club against the ground; creatures on the ground in the area. Structures in contact with the ground take 50 bludgeoning damage. Once per dawn",
        template: { type: "radius", size: "50" },
        range: { value: null, units: "self" },
        charges: "1",
        noeffect: false,
      }),
      itemProperty("Earthquake: Concentration Save", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["con"], formula: "20" },
        condition: "A creature on the ground in the Earthquake area that is concentrating: on a failure its concentration is broken",
        range: { value: "50", units: "ft" },
        targetCount: "",
        noeffect: true,
      }),
      itemProperty("Earthquake: Fissure", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "20" },
        condition: "A 30-foot-deep, 10-foot-wide fissure you open anywhere in the Earthquake area: a creature on its spot falls in on a failure, or moves with its edge on a success",
        range: { value: "50", units: "ft" },
        targetCount: "",
        noeffect: true,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Thunderous Greatclub: Prone",
        activitiesMatch: [ThunderousGreatclub.CLAP, ThunderousGreatclub.EARTHQUAKE],
        statuses: ["Prone"],
        options: { transfer: false, durationSeconds: null, expiry: null },
      },
    ];
  }

}
