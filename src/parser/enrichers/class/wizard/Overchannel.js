/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class Overchannel extends DDBEnricherMixin {

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
          spent: 0,
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
              spent: 0,
              max: "20",
              recovery: [{ period: "lr", type: "recoverAll" }],
            },
            damage: {
              parts: [
                DDBEnricherMixin.basicDamagePart({
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
