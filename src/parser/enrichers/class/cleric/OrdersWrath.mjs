/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class OrdersWrath extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      noeffect: true,
      activationType: "special",
      data: {
        sort: 2,
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.order.divine-strike",
              types: ["psychic"],
            }),
          ],
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Curse",
          type: "utility",
        },
        build: {
          targetType: "creature",
          activationOverride: "special",
        },
        overrides: {
          activationType: "special",
          data: {
            sort: 1,
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Cursed by Order's Wrath",
      },
    ];
  }
}
