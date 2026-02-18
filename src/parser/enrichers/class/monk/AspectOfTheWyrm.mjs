/* eslint-disable jsdoc/require-description */
/* eslint-disable class-methods-use-this */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBActivityData} DDBActivityData */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBAdditionalActivity} DDBAdditionalActivity */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBEffectHint} DDBEffectHint */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBOverrideData} DDBOverrideData */

import { DDBEnricherData } from '../../data/_module.mjs';


export default class AspectOfTheWyrm extends DDBEnricherData {

  get type() {
    return "utility";
  }

  /**
   * @returns {DDBActivityData}
   */
  get activity() {
    return {
      name: "Resistance",
      activationType: "bonus",
      targetType: "creature",
      data: {
        midiProperties: { chooseEffects: true },
      },
    };
  }

  /**
   * @returns {DDBAdditionalActivity[]}
   */
  get additionalActivities() {
    return [
      {
        action: {
          name: "Aspect of the Wyrm: Frightful Presence",
          type: "class",
          rename: ["Frightful Presence"],
        },
      },
    ];
  }

  get clearAutoEffects() {
    return true;
  }

  /**
   * @returns {DDBEffectHint[]}
   */
  get effects() {
    return ["Acid", "Cold", "Fire", "Lightning", "Poison"].map((damageType) => ({
      name: `Aspect of the Wyrm: Resistance (${damageType})`,
      changes: [
        DDBEnricherData.ChangeHelper.damageResistanceChange(damageType),
      ],
      options: {
        durationSeconds: 600,
      },
    }));
  }

  // get override() {
  //   return {
  //     replaceActivityUses: true,
  //     data: {
  //       "flags.ddbimporter.skipScale": true,
  //     },
  //   };
  // }

}
