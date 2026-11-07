import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Spirits' Fury (Path of the Spiritual Guardian, World of Warcraft; the WoW Shaman's Enhancement
 * Specialization): a roll of 18-20 on a melee weapon attack made as part of the Attack action grants
 * one more attack with that weapon, once per turn. DDB files it as an Action.
 */
export default class SpiritsFury extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Bonus Attack",
      activationType: "special",
      activationCondition: "Once per turn: you roll 18-20 on a melee weapon attack made as part of the Attack action",
      targetType: "self",
    };
  }

}
