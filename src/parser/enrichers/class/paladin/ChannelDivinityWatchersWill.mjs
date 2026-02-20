/* eslint-disable jsdoc/require-description */
/* eslint-disable class-methods-use-this */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBActivityData} DDBActivityData */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBAdditionalActivity} DDBAdditionalActivity */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBEffectHint} DDBEffectHint */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBOverrideData} DDBOverrideData */

import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ChannelDivinityWatchersWill extends DDBEnricherData {

  /**
   * @returns {DDBActivityData}
   */
  get activity() {
    return {
      type: "utility",
      name: "Activate Watcher's Will",
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
      name: "Watcher's Will",
      options: {
        durationSeconds: 60,
      },
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.int.save.roll.mode"),
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.wis.save.roll.mode"),
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.cha.save.roll.mode"),
      ],
    }];
  }

}
