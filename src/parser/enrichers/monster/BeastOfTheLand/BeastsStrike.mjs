/* eslint-disable class-methods-use-this */
// import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class BeastsStrike extends DDBEnricherData {

  get activity() {
    return {
      data: {
        damage: {
          includeBase: true,
          parts: [],
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Charge",
          data: {
            damage: {
              includeBase: true,
              parts: [
                DDBEnricherData.basicDamagePart({
                  bonus: "1d6",
                }),
              ],
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Prone",
        activityMatch: "Charge",
        statuses: ["prone"],
      },
    ];
  }

  get override() {
    return {
      data: {
        "system.damage.base": {
          types: ["bludgeoning", "piercing", "slashing"],
          bonus: "",
        },
      },
    };
  }

}
