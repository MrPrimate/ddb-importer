import DDBEnricherData from "../data/DDBEnricherData";

export default class HellsLash extends DDBEnricherData {

  get activity() {
    return {
      name: "Cast",
      splitDamage: true,
    };
  }

  get additionalActivities() {
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
            type: "turnStart",
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
            type: "turnEnd",
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: `${this.name}: Tethered`,
        activityMatch: "Cast",
      },
    ];
  }

}
