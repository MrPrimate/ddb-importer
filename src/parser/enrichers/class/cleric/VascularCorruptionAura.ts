import DDBEnricherData from "../../data/DDBEnricherData";

export default class VascularCorruptionAura extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Activate Aura",
      activationType: "action",
      targetType: "creature",
      addItemConsume: true,
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
            events: ["tokenEnter", "tokenTurnStart"],
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
            DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, type: "necrotic" }),
          ],
          activationOverride: {
            type: "special",
            condition: "Hostile creature with blood enters the aura or starts its turn there (skip bloodless creatures)",
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
