import DDBEnricherData from "../data/DDBEnricherData";

export default class WardingWind extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
          DDBEnricherData.BehaviorHelper.applyEffect({ effects: DDBEnricherData.SRDEffects.condition("deafened") }),
        ],
      },
    };
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

}
