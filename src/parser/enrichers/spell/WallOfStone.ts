import DDBEnricherData from "../data/DDBEnricherData";

export default class WallOfStone extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Place Square Panels",
      data: {
        target: {
          override: true,
          template: {
            count: "10",
            contiguous: true,
            type: "wall",
            size: "10",
            width: "0.5",
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
          name: "Place Long Panels",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDamage: false,
          generateConsumption: true,
          generateSave: true,
          generateTarget: true,
          targetOverride: {
            override: true,
            template: {
              count: "10",
              contiguous: true,
              type: "wall",
              size: "20",
              width: "0.25",
              height: "10",
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
