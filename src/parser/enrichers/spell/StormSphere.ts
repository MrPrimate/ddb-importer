import DDBEnricherData from "../data/DDBEnricherData";

export default class StormSphere extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity() {
    return {
      name: "Cast Spell",
      data: {
        save: {
          ability: ["str"],
          dc: {
            calculation: "spellcasting",
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 6,
              types: ["bludgeoning"],
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Shoot Lightning",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateAttack: true,
          generateConsumption: false,
          generateActivation: true,
          generateRange: true,
        },
        overrides: {
          targetType: "enemy",
          noTemplate: true,
          activationType: "bonus",
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 4,
              denomination: 6,
              types: ["lightning"],
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
          data: {
            range: {
              value: "60",
              units: "ft",
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        activityMatch: "Cast Spell",
        name: "Within Storm Sphere",
      },
    ];
  }

}
