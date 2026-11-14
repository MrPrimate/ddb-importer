import DDBEnricherData from "../../data/DDBEnricherData";

/** Eldritch Knight Arcane Charge: a 30-foot teleport when you use Action Surge, as the PHB has it. */
export default class ArcaneCharge extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.TELEPORT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Arcane Charge",
      activationType: "special",
      activationCondition: "When you use your Action Surge",
      targetType: "self",
      data: {
        range: {
          override: true,
          value: "30",
          units: "ft",
        },
      },
    };
  }

}
