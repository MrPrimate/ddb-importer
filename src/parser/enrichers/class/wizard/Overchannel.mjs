/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Overchannel extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "First Use",
      activationType: "special",
      addActivityConsume: true,
      data: {
        uses: {
          override: true,
          spent: null,
          max: "1",
          recovery: [{ period: "lr", type: "recoverAll" }],
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Second+ Use",
          type: "damage",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateDamage: true,
        },
        overrides: {
          addActivityConsume: true,
          targetType: "self",
          rangeSelf: true,
          data: {
            uses: {
              override: true,
              spent: null,
              max: "20",
              recovery: [{ period: "lr", type: "recoverAll" }],
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "(2 + @activity.uses.spent - 1)d12",
                  types: ["necrotic"],
                }),
              ],
            },
          },
        },
      },
    ];
  }

}
