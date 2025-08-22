/* eslint-disable class-methods-use-this */
// import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class BeastsStrike extends DDBEnricherData {

  get activity() {
    return {
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 8,
              types: ["slashing"],
              bonus: "@mod",
            }),
          ],
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
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 1,
                  denomination: 8,
                  types: ["slashing"],
                  bonus: "@mod + 1d6",
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

}
