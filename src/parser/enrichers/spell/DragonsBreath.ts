import DDBEnricherData from "../data/DDBEnricherData";

export default class DragonsBreath extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Cast",
      noTemplate: true,
      overrideTarget: true,
      targetType: "creature",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Breathe",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: true,
        },
        overrides: {
          noSpellslot: true,
          data: {
            damage: {
              onSave: "half",
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 3,
                  denomination: 6,
                  types: ["acid", "cold", "fire", "lightning", "poison"],
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

}
