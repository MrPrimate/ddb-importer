import DDBEnricherData from "../data/DDBEnricherData";

export default class IceKnife extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Attack",
      targetType: "creature",
      overrideTemplate: true,
      noTemplate: true,
      data: {
        midiProperties: {
          triggeredActivityId: "addSaveVsBlasDam",
          triggeredActivityTargets: "retarget",
          triggeredActivityRollAs: "self",
          triggeredActivityConditionText: "true",
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save vs Blast Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
          id: "addSaveVsBlasDam",
        },
        build: {
          generateSave: true,
          generateDamage: true,
          generateConsumption: false,
          generateActivation: true,
          generateTarget: true,
          noSpellslot: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 6,
              types: ["cold"],
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
        },
        overrides: {
          activationType: "special",
          overrideActivation: true,
          overrideTarget: true,
          data: {
            midiProperties: {
              confirmTargets: "always",
            },
            target: {
              affects: {
                type: "creature",
              },
              template: {
                type: "radius",
                size: "5",
                units: "ft",
              },
            },
          },
        },
      },
    ];
  }

}
