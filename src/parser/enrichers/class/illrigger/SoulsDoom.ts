import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

/**
 * The doomed creature takes extra damage equal to the illrigger's proficiency bonus once per hit.
 * dnd5e 5.2 has no "ALL" damage modification: one per damage type would add the bonus again for
 * every extra type in a hit, and midi's damage reduction only adds under one DR order setting. So
 * the effect marks the doomed creature and the description asks for the bonus by hand.
 */
export default class SoulsDoom extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Soul's Doom",
      activationType: "special",
      activationCondition: "When you place or move a seal with a bonus action",
      targetType: "creature",
      targetCount: 1,
      rangeType: "ft",
      rangeValue: 30,
      data: {
        duration: {
          units: "minute",
          value: "1",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    const prof = this.ddbParser?.ddbCharacter?.profBonus;
    const bonus = prof ? ` (+${prof})` : "";
    return [
      {
        name: "Soul's Doom",
        activityMatch: "Soul's Doom",
        options: {
          durationSeconds: 60,
          description: `Whenever this creature takes damage, it takes extra damage equal to the illrigger's proficiency bonus${bonus}, once per hit. Add it by hand.`,
        },
      },
    ];
  }

}
