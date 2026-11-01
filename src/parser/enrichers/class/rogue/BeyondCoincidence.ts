import DDBEnricherData from "../../data/DDBEnricherData";
import { luckCheckRoll } from "./_FortuneRogue";

/**
 * Fortune Rogue (OTFY). Holds the Fortune Dice pool (half the Rogue level, rounded up, from the
 * hand-built fortune-dice scale; DDB only sends the resolved count). Favored Talent and Lucky Break
 * each spend a die on a Luck check.
 */
export default class BeyondCoincidence extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Favored Talent",
      activationType: "special",
      activationCondition: "You make an ability check; use the Luck check result instead",
      targetType: "self",
      addItemConsume: true,
      data: luckCheckRoll("Luck Check"),
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Lucky Break",
          activationType: "action",
          activationCondition: "Magic action: describe the outcome, the GM sets the DC",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Fortune Dice",
        max: "@scale.fortune-rogue.fortune-dice",
        period: "lr",
      }),
    };
  }

}
