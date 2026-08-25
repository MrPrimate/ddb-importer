import DDBEnricherData from "../../data/DDBEnricherData";

export default class AberrantGround extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Aberrant Ground",
      targetType: "self",
      activationType: "special",
      data: {
        target: {
          override: true,
          template: {
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
        ],
      },
    };
  }

}
