/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class SylunsViper extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      name: "Cast",
      targetSelf: true,
      data: {
        sort: 1,
        heal: DDBEnricherData.basicDamagePart({
          bonus: "15",
          type: "temphp",
          scalingMode: "whole",
          scalingFormula: "5",
        }),
      },
    };
  }

  get clearAutoEffects() {
    return true;
  }

  get effects() {
    return [
      {
        name: "Spectral Snake",
        activityMatch: "Cast",
        options: {
          durationSeconds: 3600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.climb"),
        ],
      },
      {
        name: "Viper Poison",
        activityMatch: "Spectral Snake Attack",
        options: {
          durationSeconds: 6,
          durationRounds: 1,
        },
        daeSpecialDurations: ["turnStartSource"],
        statuses: ["Poisoned", "Incapacitated"],
      },
    ];
  }

  get addAutoAdditionalActivities() {
    return false;
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Spectral Snake Attack",
          type: "attack",
        },
        build: {
          generateAttack: true,
          generateDamage: true,
        },
        overrides: {
          activationType: "action",
          removeSpellSlotConsume: true,
          noConsumeTargets: true,
          noTemplate: true,
          targetType: "creature",
          data: {
            sort: 2,
            range: {
              override: true,
              value: 50,
              units: "ft",
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 1,
                  denomination: 6,
                  type: "force",
                  scalingMode: "whole",
                }),
              ],
            },
          },
        },
      },
    ];
  }
}
