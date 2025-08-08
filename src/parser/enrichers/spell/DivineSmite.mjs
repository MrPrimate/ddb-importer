/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class DivineSmite extends DDBEnricherData {
  get activity() {
    return {
      data: {
        useConditionText: `!["fiend", "undead"].includes(raceOrType)`,
        damage: {
          critical: {
            allow: true,
          },
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 8,
              types: ["radiant"],
              scalingMode: "whole",
              scalingNumber: 1,
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
          name: "vs Fiends or Undead",
          data: {
            useConditionText: `["fiend", "undead"].includes(raceOrType)`,
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 3,
                  denomination: 8,
                  types: ["radiant"],
                  scalingMode: "whole",
                  scalingNumber: 1,
                }),
              ],
            },
          },
        },
      },
    ];
  }
}
