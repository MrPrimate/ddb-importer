import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Knights Stygian level 7. Dreadful Incantation frightens a creature within 60 feet until the start
 * of the magus's next turn on a failed Wisdom save, after casting a level 1+ Necromancy spell or a
 * Knights Stygian Magic spell. Fearless (Frightened immunity) comes from DDB's modifier; Mortal
 * Terror (Psychic for Necrotic) is text only.
 */
export default class FaceOfFear extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Dreadful Incantation",
      activationType: "special",
      activationCondition: "You cast a level 1+ Necromancy spell or a spell from your Knights Stygian Magic",
      targetType: "creature",
      targetCount: 1,
      rangeValue: 60,
      rangeType: "ft",
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
        activityMatch: "Dreadful Incantation",
        statuses: ["frightened"],
        options: {
          expiry: "sourceStart",
        },
      },
    ];
  }

}
