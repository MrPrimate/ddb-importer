/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class WallOfWater extends DDBEnricherMixin {

  get type() {
    return "save";
  }

  get activity() {
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

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Create Ring",
          type: "utility",
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

  get override() {
    return {
      noTemplate: true,
    };
  }

}
