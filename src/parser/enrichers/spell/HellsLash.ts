import DDBEnricherData from "../data/DDBEnricherData";

export default class HellsLash extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Cast",
      splitDamage: true,
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Turn Start Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            condition: "Turn Start",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 4,
              type: "fire",
              scalingMode: "whole",
              scalingFormula: "1",
            }),
          ],
        },
      },
      {
        init: {
          name: "Turn End Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDamage: false,
          generateConsumption: false,
          noSpellslot: true,
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
            condition: "Turn End",
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: `${this.name}: Tethered`,
        activityMatch: "Cast",
      },
    ];
  }

}
