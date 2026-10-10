import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The Magus Class. Used as a Spellcasting Focus, Enspelled Terror frightens one target of a level
 * 1+ spell until the end of its next turn on a failed Wisdom save. Channel the Beyond (Necrotic or
 * Radiant damage swap) is text only.
 */
export default class GildedPate extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Enspelled Terror",
      activationType: "special",
      activationCondition: "You cast a level 1+ spell using the Gilded Pate as your Spellcasting Focus",
      targetType: "creature",
      targetCount: 1,
      noConsumeTargets: true,
      data: {
        save: {
          ability: ["wis"],
          dc: { calculation: "spellcasting", formula: "" },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Frightened",
        activityMatch: "Enspelled Terror",
        statuses: ["frightened"],
        options: {
          transfer: false,
          expiry: "targetEnd",
        },
      },
    ];
  }

}
