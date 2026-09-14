import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Sanctuary Vessel (The Genie, 2014): creatures that finish a short rest inside the vessel
 * regain extra hit points equal to the warlock's proficiency bonus.
 */
export default class SanctuaryVessel extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Restful Vessel",
      activationType: "special",
      activationCondition: "When a creature finishes a Short Rest inside the vessel",
      targetType: "creature",
      rangeSelf: true,
      // the DDB action spends a Hit Die; the extra healing is on top of the rest, not a cost
      noConsumeTargets: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@prof",
          types: ["healing"],
        }),
      },
    };
  }

}
