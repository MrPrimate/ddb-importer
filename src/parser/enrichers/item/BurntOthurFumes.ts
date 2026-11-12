import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity } from "./_ItemActivities";

export default class BurntOthurFumes extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Initial Exposure",
      activationType: "special",
      activationCondition: "When exposed to the inhaled poison",
      addItemConsume: true,
      removeDamageParts: true,
      noTemplate: true,
      targetType: "creature",
      targetCount: "1",
      damageParts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, type: "poison" })],
      data: {
        save: { ability: ["con"], dc: { calculation: "", formula: "13" } },
        damage: { includeBase: false, onSave: "none" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity("Continuing Exposure", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        // special, not turnStart: the save only happens while the poison lasts
        activationType: "special",
        activationCondition:
          "Affected creature's turn start; poison ends after three successful saves (track manually)",
        targetType: "creature",
        targetCount: "1",
        rangeType: "any",
        data: {
          save: { ability: ["con"], dc: { calculation: "", formula: "13" } },
          damage: {
            includeBase: false,
            onSave: "none",
            parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, type: "poison" })],
          },
        },
      }),
    ];
  }

  // exposure spends the stack's quantity, and the item stays at quantity 0 so the follow-up stays
  override get override(): IDDBOverrideData {
    return { spendOwnQuantity: true };
  }

}
