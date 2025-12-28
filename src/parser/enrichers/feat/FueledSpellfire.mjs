/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class FueledSpellfire extends DDBEnricherData {
  get activity() {
    return {
      activationType: "special",
      targetType: "enemy",
      data: {
        roll: {
          name: "Roll Largest Hit Dice",
          formula: "(@scaling)d(@attributes.hd.largestFace)",
        },
        consumption: {
          scaling: {
            allowed: true,
            max: "2",
          },
          spellSlot: true,
          targets: [
            {
              type: "hitDice",
              value: "1",
              target: "largest",
              scaling: {
                mode: "amount",
                formula: "",
              },
            },
          ],
        },
      },
    };
  }
}
