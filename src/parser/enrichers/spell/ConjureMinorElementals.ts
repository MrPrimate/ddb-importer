import DDBEnricherData from "../data/DDBEnricherData";

export default class ConjureMinorElementals extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Cast",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Extra Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          noTemplate: true,
          data: {
            range: {
              units: "ft",
              value: "15",
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  denomination: 8,
                  number: 2,
                  types: ["acid", "cold", "fire", "lightning"],
                  scalingMode: "whole",
                  scalingNumber: 1,
                }),
              ],
            },
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [{
      name: "Conjured Minor Elementals",
      activityMatch: "Cast",
      options: {
        durationSeconds: 600,
      },
    }];
  }
}
