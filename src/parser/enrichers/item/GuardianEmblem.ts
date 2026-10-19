import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Guardian Emblem: a Reaction spends a charge to turn a critical hit on you or a creature within
 * 30 feet into a normal hit (attaching or removing the emblem is the action the text names first).
 */
export default class GuardianEmblem extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Turn Critical Hit",
      activationType: "reaction",
      activationCondition: "You or a creature you can see within 30 feet suffers a critical hit",
      targetType: "creature",
    };
  }

}
