/* eslint-disable jsdoc/require-description */
/* eslint-disable class-methods-use-this */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBActivityData} DDBActivityData */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBAdditionalActivity} DDBAdditionalActivity */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBEffectHint} DDBEffectHint */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBOverrideData} DDBOverrideData */

import Generic from "../Generic.mjs";

export default class WingsUnfurled extends Generic {

  /**
   * @returns {DDBEffectHint[]}
   */
  get effects() {
    if (!this.isAction) return [];
    return [
      {
        changes: [
          Generic.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
        ],
        daeSpecialDurations: ["turnEnd"],
      },
    ];
  }

}
