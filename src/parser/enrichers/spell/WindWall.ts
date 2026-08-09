import DDBEnricherData from "../data/DDBEnricherData";

export default class WindWall extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      splitDamage: true,
      data: {
        target: {
          override: true,
          template: {
            count: "5",
            contiguous: true,
            type: "wall",
            size: "10",
            width: "1",
            height: "15",
            units: "ft",
          },
        },
      },
    };
  }

}
