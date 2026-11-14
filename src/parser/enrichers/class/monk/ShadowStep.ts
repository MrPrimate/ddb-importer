import DDBEnricherData from "../../data/DDBEnricherData";

/** Shadow Step: a 60-foot teleport between areas of Dim Light or Darkness, as the PHB has it. */
export default class ShadowStep extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.TELEPORT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Shadow Step",
      activationType: "bonus",
      activationCondition: "While entirely within Dim Light or Darkness",
      targetType: "self",
      data: {
        range: {
          override: true,
          value: "60",
          units: "ft",
        },
      },
    };
  }

}
