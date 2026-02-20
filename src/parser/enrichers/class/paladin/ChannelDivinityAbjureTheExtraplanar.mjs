/* eslint-disable jsdoc/require-description */
/* eslint-disable class-methods-use-this */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBActivityData} DDBActivityData */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBAdditionalActivity} DDBAdditionalActivity */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBEffectHint} DDBEffectHint */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBOverrideData} DDBOverrideData */

import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ChannelDivinityAbjureTheExtraplanar extends DDBEnricherData {

  get type() {
    return "save";
  }

  /**
   * @returns {DDBActivityData}
   */
  get activity() {
    return {
      name: "Abjure the Extraplanar",
      targetType: "ally",
      addItemConsume: true,
      data: {
        duration: {
          units: "minute",
          value: "1",
        },
      },
    };
  }

  /**
   * @returns {DDBEffectHint[]}
   */
  get effects() {
    return [{
      name: "Abjured",
      options: {
        durationSeconds: 60,
      },
      daeSpecialDurations: ["isDamaged"],
    }];
  }

}
