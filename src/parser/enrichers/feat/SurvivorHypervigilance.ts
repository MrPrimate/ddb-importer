import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Ravenloft Survivor origin feat, the "Survivor: Hypervigilance" DDB action. dnd5e and AC5e have
 * no initiative reroll below a threshold (AC5e d20 modifiers are min/max only), so it stays a
 * description-only activity.
 */
export default class SurvivorHypervigilance extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Hypervigilance",
      activationType: "special",
      activationCondition: "You roll Initiative and the d20 shows 9 or lower; you must use the reroll",
      targetType: "self",
    };
  }

}
