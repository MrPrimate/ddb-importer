import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Frost Sorcery: after Cold spell damage to a Large or smaller creature, spend Sorcery Points to cut
 * its Speed by 15 feet each until the end of its next turn (the scaling step adds a point); at 0 Speed
 * DDB's Cryomancy damage action deals the 2d6 Cold.
 */
export default class ColdHearted extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Freeze in Place",
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "You deal Cold damage to a Large or smaller creature with a spell",
      addItemConsume: true,
      itemConsumeTargetName: "sorcery-points",
      addScalingMode: "amount",
      addScalingFormula: "1",
      data: {
        consumption: { scaling: { allowed: true, max: "" } },
      },
    };
  }

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

}
