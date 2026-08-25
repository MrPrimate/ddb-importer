import DDBEnricherData from "../data/DDBEnricherData";

export default class EruptingEarth extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["rocks"] }),
        ],
      },
    };
  }

}
