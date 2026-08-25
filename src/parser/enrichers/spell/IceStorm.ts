import DDBEnricherData from "../data/DDBEnricherData";

export default class IceStorm extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["ice"] }),
        ],
      },
    };
  }

}
