/* eslint-disable class-methods-use-this */
import Generic from "../Generic.mjs";

export default class SlayersPrey extends Generic {

  get addAutoAdditionalActivities() {
    return true;
  }

  get activity() {
    return {
      name: "Apply",
    };
  }

  get additionalActivities() {
    return [
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
                Generic.basicDamagePart({
                  number: 1,
                  denomination: 6,
                  type: Generic.allDamageTypes(),
                }),
              ],
            },
            range: {
              units: "spec",
            },
          },
        },
      },
    ];
  }

}
