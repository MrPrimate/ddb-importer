import DDBEnricherData from "../data/DDBEnricherData";

export default class SpikeGrowth extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["plants"] }),
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenMoveIn", "tokenMoveWithin"],
            activityName: "Movement Damage",
            oncePerTurn: false,
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Movement Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          noSpellslot: true,
          generateDamage: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 2, denomination: 4, type: "piercing", scalingMode: "none", scalingNumber: null,
            }),
          ],
          activationOverride: {
            type: "special",
            condition: "Moves 5 feet in the area (2d4 per 5 feet moved)",
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
