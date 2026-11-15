import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Ravenloft Survivor origin feat, the "Survivor: Steel Yourself" DDB action. The bonus lands on a
 * save that has already failed, so it is a roll for the player to add by hand. The once-per-Long-Rest
 * use stays on the feat item, where DDB puts it.
 */
export default class SurvivorSteelYourself extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Steel Yourself",
      activationType: "reaction",
      activationCondition: "You fail a saving throw to avoid or end the Charmed or Frightened condition",
      targetType: "self",
      addItemConsume: true,
      data: {
        roll: {
          prompt: false,
          visible: true,
          name: "Save Bonus",
          formula: "@prof",
        },
      },
    };
  }

}
