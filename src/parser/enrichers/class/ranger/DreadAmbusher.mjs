/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DreadAmbusher extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Ambusher's Leap",
      targetType: "self",
      activationType: "encounterStart",
    };
  }

  get additionalActivities() {
    return this.is2014
      ? [
        {
          constructor: {
            name: "Bonus Damage",
            type: "damage",
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

  get effects() {
    return [
      {
        name: "Ambusher's Leap",
        activityNameMatch: "Ambusher's Leap",
        changes: [
          DDBEnricherData.ChangeHelper.addChange("10", 10, "system.attributes.movement.walk"),
        ],
        options: {
          durationSeconds: 6,
        },
        daeSpecialDuration: ["turnEnd"],
      },
    ];
  }

}
