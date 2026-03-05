import DDBEnricherData from "../../data/DDBEnricherData";

export default class FrigidExplorer extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Once per turn",
      data: {
        range: {
          units: "spec",
        },
      },
    };
  }

}
