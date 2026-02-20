/* eslint-disable jsdoc/require-description */
/* eslint-disable class-methods-use-this */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBActivityData} DDBActivityData */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBAdditionalActivity} DDBAdditionalActivity */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBEffectHint} DDBEffectHint */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBOverrideData} DDBOverrideData */

import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class VigilantRebuke extends DDBEnricherData {

  get type() {
    return "save";
  }

  /**
   * @returns {DDBActivityData}
   */
  get activity() {
    return {
      targetType: "enemy",
      data: {
        save: {
          ability: ["cha"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 8,
              bonus: "@abilities.cha.mod",
              types: ["force"],
            }),
          ],
        },
      },
    };
  }

}
