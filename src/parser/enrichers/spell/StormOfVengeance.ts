import DDBEnricherData from "../data/DDBEnricherData";

export default class StormOfVengeance extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
        ],
      },
    };
  }

}
