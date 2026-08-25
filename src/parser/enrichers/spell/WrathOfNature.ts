import DDBEnricherData from "../data/DDBEnricherData";

export default class WrathOfNature extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["plants"] }),
        ],
      },
    };
  }


  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          target: {
            affects: {
              type: "enemy",
            },
          },
        },
      },
    };
  }

}
