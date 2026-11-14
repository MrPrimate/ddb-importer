import DDBEnricherData from "../../data/DDBEnricherData";

export default class ImprovedShadowStep extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.TELEPORT;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
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
