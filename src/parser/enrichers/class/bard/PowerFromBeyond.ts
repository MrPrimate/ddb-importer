import DDBEnricherData from "../../data/DDBEnricherData";

export default class PowerFromBeyond extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Power from Beyond: Healing Bonus",
      noConsumeTargets: true,
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 6,
          type: "healing",
        }),
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Power from Beyond: Damage Bonus",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        overrides: {
          addItemConsume: true,
          targetType: "creature",
          data: {
            range: {
              units: "spec",
            },
            damage: DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              type: "force",
            }),
          },
        },
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      uses: {
        max: "1",
        spent: 0,
        recovery: [{ period: "turnStart", type: "recoverAll", formula: undefined }],
      },
    };
  }

}
