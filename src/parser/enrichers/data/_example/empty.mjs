/* eslint-disable jsdoc/require-description */
/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBActivityData} DDBActivityData */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBAdditionalActivity} DDBAdditionalActivity */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBEffectHint} DDBEffectHint */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBOverrideData} DDBOverrideData */

export default class Empty extends DDBEnricherData {

  get type() {
    return null;
  }

  /**
   * @returns {DDBActivityData | null}
   */
  get activity() {
    return null;
  }

  /**
   * @returns {DDBEffectHint[]}
   */
  get effects() {
    return [];
  }

  /**
   * @returns {DDBAdditionalActivity[]}
   */
  get additionalActivities() {
    return [];
  }

  /**
   * @returns {DDBOverrideData | null}
   */
  get override() {
    return null;
  }

  // keep this if you want to use the default generated actions
  get useDefaultAdditionalActivities() {
    return true;
  }

  // use this if you want to add to default actions
  get addToDefaultAdditionalActivities() {
    return true;
  }

  get builtFeaturesFromActionFilters() {
    return [];
  }

}
