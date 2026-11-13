import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Each bolt is a separate save placed as a 5-foot sphere under the cloud; outdoors in a storm the
 * bolt deals an extra die. The bolt names follow the SRD spell.
 */
export default class CallLightning extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        name: "Place Storm Cloud Template",
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Lightning Strike",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDuration: true,
          noSpellslot: true,
          generateDamage: true,
          generateSave: true,
          damageParts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 10, type: "lightning", scalingMode: "whole", scalingNumber: 1 })],
          generateRange: true,
          rangeOverride: {
            value: "",
            units: "spec",
            special: "Beneath storm cloud",
          },
          generateTarget: true,
          targetOverride: {
            override: true,
            affects: {
              type: "creature",
              count: "",
            },
            template: {
              count: "",
              contiguous: false,
              type: "sphere",
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
          name: "Lightning Strike (Storm)",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDuration: true,
          noSpellslot: true,
          generateDamage: true,
          generateSave: true,
          damageParts: [DDBEnricherData.basicDamagePart({
            number: 4,
            denomination: 10,
            type: "lightning",
            scalingMode: "whole",
            scalingNumber: 1,
          })],
          generateRange: true,
          rangeOverride: {
            value: "",
            units: "spec",
            special: "Beneath storm cloud",
          },
          generateTarget: true,
          targetOverride: {
            override: true,
            affects: {
              type: "creature",
              count: "",
            },
            template: {
              count: "",
              contiguous: false,
              type: "sphere",
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
