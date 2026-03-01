import DDBEnricherData from "../data/DDBEnricherData";

export default class CallLightning extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      data: {
        name: "Place Storm Cloud Template",
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          noSpellslot: true,
          generateDamage: true,
          generateSave: true,
          damageParts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 10, type: "lightning", scalingMode: "whole", scalingNumber: 1 })],
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
        init: {
          name: "Damage (Outdoors in a Storm)",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDamage: true,
          generateSave: true,
          damageParts: [DDBEnricherData.basicDamagePart({
            number: 4,
            denomination: 10,
            type: "lightning",
            scalingMode: "whole",
            scalingNumber: 1,
          })],
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
