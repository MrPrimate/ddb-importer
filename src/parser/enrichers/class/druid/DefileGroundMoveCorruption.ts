import DDBEnricherData from "../../data/DDBEnricherData";

export default class DefileGroundMoveCorruption extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Move Corruption",
      targetType: "enemy",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
        ],
      },
    };
  }

}
