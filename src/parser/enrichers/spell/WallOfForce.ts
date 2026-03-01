import DDBEnricherData from "../data/DDBEnricherData";

export default class WallOfForce extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Place Panels",
      data: {
        img: "icons/magic/water/barrier-ice-wall-snow.webp",
        target: {
          override: true,
          template: {
            count: "10",
            contiguous: true,
            type: "wall",
            size: "10",
            width: "0.02",
            height: "10",
            units: "ft",
          },
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Create Dome/Globe",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateDamage: true,
          generateConsumption: true,
          generateSave: true,
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

  get override() {
    return {
      noTemplate: true,
    };
  }

}
