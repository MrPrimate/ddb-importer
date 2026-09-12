import DDBEnricherData from "../../data/DDBEnricherData";

export default class DreadAmbusher extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Ambusher's Leap",
      targetType: "self",
      activationType: "encounter",
      noConsumeTargets: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return this.is2014
      ? [
        {
          init: {
            name: "Bonus Damage",
            type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
          },
          build: {
            generateDamage: true,
            generateTarget: true,
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
                    types: DDBEnricherData.allDamageTypes(),
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

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Ambusher's Leap",
        activityMatch: "Ambusher's Leap",
        changes: [
          DDBEnricherData.ChangeHelper.addChange("10", 10, "system.attributes.movement.speeds.walk"),
        ],
        options: {
          // "your Speed increases by 10 feet until the end of that turn" - a self buff
          expiry: "turnEnd",
        },
      },
    ];
  }

}
