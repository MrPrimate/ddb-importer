import DDBEnricherData from "../data/DDBEnricherData";

export default class WallOfWater extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Place Wall",
      data: {
        target: {
          override: true,
          template: {
            type: "wall",
            size: "30",
            width: "1",
            height: "10",
            units: "ft",
          },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Create Ring",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateDamage: false,
          generateConsumption: true,
          generateTarget: true,
          targetOverride: {
            override: true,
            template: {
              count: "1",
              contiguous: false,
              type: "sphere",
              size: "10",
              units: "ft",
            },
            affects: {},
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      noTemplate: true,
    };
  }

}
