import DDBEnricherData from "../../data/DDBEnricherData";

export default class DreadAmbusher extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Ambusher's Leap",
      targetType: "self",
      activationType: "encounterStart",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return this.is2014
      ? [
        {
          init: {
            name: "Bonus Damage",
            type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
          },
          build: {
            generateDamage: true,
            generateTargets: true,
            generateRange: true,
          },
          overrides: {
            targetType: "enemy",
            activationType: "special",
            data: {
              damage: {
                parts: [
                  DDBEnricherData.basicDamagePart({
                    number: 1,
                    denomination: 8,
                    type: DDBEnricherData.allDamageTypes(),
                  }),
                ],
              },
              range: {
                units: "spec",
              },
            },
          },
        },
      ]
      : [
        { action: { name: "Dreadful Strike", type: "class" } },
      ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Ambusher's Leap",
        activityMatch: "Ambusher's Leap",
        changes: [
          DDBEnricherData.ChangeHelper.addChange("10", 10, "system.attributes.movement.walk"),
        ],
        options: {
          durationSeconds: 6,
        },
        daeSpecialDuration: ["turnEnd" as const],
      },
    ];
  }

}
