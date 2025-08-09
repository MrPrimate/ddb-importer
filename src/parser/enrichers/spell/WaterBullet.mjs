/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class WaterBullet extends DDBEnricherData {

  get activity() {
    return {
      name: "1-10 feet",
      data: {
        range: {
          override: true,
          units: "ft",
          value: "10",
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 5,
              denomination: 6,
              type: "bludgeoning",
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
        id: "ddbWaterBullet11",
        overrides: {
          name: "11-60 feet",
          data: {
            range: {
              override: true,
              units: "ft",
              value: "60",
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 4,
                  denomination: 6,
                  type: "bludgeoning",
                }),
              ],
            },
          },
        },
      },
      {
        duplicate: true,
        id: "ddbWaterBullet61",
        overrides: {
          name: "61-90 feet",
          data: {
            range: {
              override: true,
              units: "ft",
              value: "90",
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 3,
                  denomination: 6,
                  type: "bludgeoning",
                }),
              ],
            },
          },
        },
      },
    ];
  }
}
