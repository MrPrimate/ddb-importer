/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class CallLightning extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      data: {
        name: "Place Storm Cloud Template",
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Damage",
          type: "save",
        },
        build: {
          noSpellslot: true,
          generateDamage: true,
          generateSave: true,
          damageParts: [DDBEnricherMixin.basicDamagePart({ number: 3, denomination: 10, type: "lightning", scalingMode: "whole", scalingNumber: "1" })],
          rangeOverride: {
            value: "",
            units: "spec",
            special: "Beneath storm cloud",
          },
          targetOverride: {
            template: {
              count: "",
              contiguous: false,
              type: "radius",
              size: "5",
              width: "",
              height: "",
              units: "ft",
            },
          },
          durationOverride: {
            units: "inst",
            concentration: false,
          },
        },
      },
      {
        constructor: {
          name: "Damage (Outdoors in a Storm)",
          type: "save",
        },
        build: {
          generateDamage: true,
          generateSave: true,
          damageParts: [DDBEnricherMixin.basicDamagePart({ number: 4, denomination: 10, type: "lightning", scalingMode: "whole", scalingNumber: "1" })],
          rangeOverride: {
            value: "",
            units: "spec",
            special: "Beneath storm cloud",
          },
          targetOverride: {
            template: {
              count: "",
              contiguous: false,
              type: "radius",
              size: "5",
              width: "",
              height: "",
              units: "ft",
            },
          },
          durationOverride: {
            units: "inst",
            concentration: false,
          },
        },
      },
    ];
  }

}
