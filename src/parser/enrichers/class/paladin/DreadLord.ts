import DDBEnricherData from "../../data/DDBEnricherData";

export default class DreadLord extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Dread Lord",
      targetType: "creature",
      data: {
        duration: {
          override: true,
          value: "1",
          units: "minute",
        },
        target: {
          override: true,
          affects: {
            type: "enemy",
          },
          template: {
            count: "1",
            contiguous: false,
            type: "radius",
            size: "30",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenTurnStart"],
            activityName: "Aura Damage",
            excludeSelf: true,
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Aura Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateDamage: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 4, denomination: 10, type: "psychic" }),
          ],
          activationOverride: {
            type: "special",
            condition: "Enemy frightened of the paladin starts its turn in the aura (skip unfrightened enemies)",
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
          data: {
            range: {
              override: true,
              units: "spec",
            },
          },
        },
      },
    ];
  }

}
