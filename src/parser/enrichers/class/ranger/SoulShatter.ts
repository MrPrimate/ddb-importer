import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Soul Shatter (World of Warcraft Demon Hunter): rolling Initiative with no soul fragments left
 * regains one. The Soul Cleave damage increase is built by SoulFragments.
 */
export default class SoulShatter extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Regain Soul Fragment",
      activationType: "special",
      activationCondition: "You roll Initiative and have no soul fragments",
      targetType: "self",
      addItemConsume: true,
      itemConsumeTargetName: "soul-fragments",
      itemConsumeValue: -1,
    };
  }

}
