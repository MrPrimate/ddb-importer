import DDBEnricherData from "../data/DDBEnricherData";

export default class StormSphere extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
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

  override get additionalActivities(): IDDBAdditionalActivity[] {
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

  override get effects(): IDDBEffectHint[] {
    return [
      {
        activityMatch: "Cast Spell",
        name: "Within Storm Sphere",
      },
    ];
  }

}
