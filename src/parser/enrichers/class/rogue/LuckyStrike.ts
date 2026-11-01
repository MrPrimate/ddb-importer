import DDBEnricherData from "../../data/DDBEnricherData";
import { fortuneDieConsumption, luckCheckRoll } from "./_FortuneRogue";

/** Fortune Rogue (OTFY). A Luck check replaces the attack roll; a hit triggers Sneak Attack. */
export default class LuckyStrike extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Lucky Strike Check",
      activationType: "special",
      activationCondition: "You make an attack roll against a creature; use the Luck check in its place",
      targetType: "self",
      additionalConsumptionTargets: [fortuneDieConsumption()],
      data: luckCheckRoll("Luck Check (Attack Roll)"),
    };
  }

}
