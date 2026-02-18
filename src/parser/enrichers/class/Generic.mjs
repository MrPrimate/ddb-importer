/* eslint-disable jsdoc/require-description */
/* eslint-disable class-methods-use-this */
/** @typedef {import('../data/DDBEnricherData.mjs').DDBActivityData} DDBActivityData */
/** @typedef {import('../data/DDBEnricherData.mjs').DDBAdditionalActivity} DDBAdditionalActivity */
/** @typedef {import('../data/DDBEnricherData.mjs').DDBEffectHint} DDBEffectHint */
/** @typedef {import('../data/DDBEnricherData.mjs').DDBOverrideData} DDBOverrideData */

import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Generic extends DDBEnricherData {

  get actionType() {
    return "class";
  }

  get useDefaultAdditionalActivities() {
    return true;
  }

  /**
   * @returns {DDBOverrideData|null}
   */
  get override() {
    // console.warn(`Generic override for ${this.data.name}`, {
    //   this: this,
    // });
    return null;
  }

}
