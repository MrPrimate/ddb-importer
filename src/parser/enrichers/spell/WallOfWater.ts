import DDBEnricherData from "../data/DDBEnricherData";

export default class WallOfWater extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
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
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["liquid"] }),
        ],
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
              // the ringed wall: 20 ft diameter, 20 ft high, 1 ft thick
              type: "ring",
              size: "10",
              width: "1",
              height: "20",
              units: "ft",
            },
            affects: {},
          },
        },
        overrides: {
          data: {
            behaviors: [
              DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["liquid"] }),
            ],
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
