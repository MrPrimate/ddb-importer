import DDBEnricherData from "../data/DDBEnricherData";

export default class Oil extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Douse a Space",
      targetType: "creature",
      activationType: "action",
      addItemConsume: true,
      data: {
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "square",
            size: "5",
            units: "ft",
          },
        },
        range: {
          override: true,
          value: "5",
          units: "ft",
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityName: "Burning Oil Damage",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Burning Oil Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          activationOverride: {
            type: "special",
            condition: "If lit: enters the oil or ends its turn there (burns for 2 rounds)",
          },
          targetOverride: {
            override: true,
            affects: {
              count: "1",
              type: "creature",
            },
            template: {},
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              bonus: "5",
              types: ["fire"],
            }),
          ],
        },
      },
      {
        init: {
          name: "Douse a Creature",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateAttack: true,
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
          activationOverride: {
            type: "action",
          },
          targetOverride: {
            override: true,
            affects: {
              count: "1",
              type: "creature",
            },
            template: {},
          },
        },
        overrides: {
          addItemConsume: true,
          data: {
            attack: {
              ability: "dex",
              type: {
                value: "ranged",
                classification: "weapon",
              },
            },
            range: {
              override: true,
              value: "20",
              units: "ft",
            },
          },
        },
      },
    ];
  }

}
