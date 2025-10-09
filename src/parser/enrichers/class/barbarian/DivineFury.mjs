/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DivineFury extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      addItemConsume: true,
      data: {
        damage: {
          critical: {
            allow: true,
            parts: [
              DDBEnricherData.basicDamagePart({
                bonus: "(floor(@classes.barbarian.levels / 2))",
                number: 1,
                denomination: 6,
                types: ["necrotic", "radiant"],
              }),
            ],
          },
        },
      },
    };
  }

  get override() {
    return {
      data: {
        "system.uses": {
          "spent": 1,
          "recovery": [
            {
              "period": "turnStart",
              "type": "recoverAll",
            },
          ],
          "max": "1",
        },
      },
    };
  }
}
