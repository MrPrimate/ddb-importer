/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class WallOfStone extends DDBEnricherMixin {

  get type() {
    return "save";
  }

  get activity() {
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

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Place Long Panels",
          type: "save",
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

  get override() {
    return {
      noTemplate: true,
    };
  }

}
