import DDBEnricherData from "../data/DDBEnricherData";

export default class StormSphere extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast Spell",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenTurnEnd"],
            activityId: "ddbStormSpZoneS1",
          }),
        ],
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
        duplicate: true,
        id: "ddbStormSpZoneS1",
        overrides: {
          name: "Ongoing Save",
          activationType: "special",
          activationCondition: "Ends its turn in the sphere",
          removeSpellSlotConsume: true,
          noConsumeTargets: true,
          noTemplate: true,
          data: {
            range: {
              override: true,
              units: "spec",
            },
            target: {
              override: true,
            },
            behaviors: [],
          },
        },
      },
      {
        init: {
          name: "Shoot Lightning",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateAttack: true,
          generateConsumption: false,
          noSpellslot: true,
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
