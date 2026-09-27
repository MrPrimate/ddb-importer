import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

/**
 * The doomed creature takes extra damage equal to the illrigger's proficiency bonus, as a damage
 * modification on all damage (dnd5e 5.3's "ALL" key applies once per hit, not once per damage
 * type). The bonus is the illrigger's, written in at import by `originChange`.
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
    return [
      {
        name: "Soul's Doom",
        activityMatch: "Soul's Doom",
        options: {
          durationSeconds: 60,
          description: "Whenever you take damage, you take extra damage equal to the illrigger's proficiency bonus.",
        },
        changes: [
          this.originChange(
            DDBEnricherData.ChangeHelper.signedAddChange("@prof", 20, "system.traits.dm.amount.ALL"),
          ),
        ],
      },
    ];
  }

}
