/* eslint-disable class-methods-use-this */

import PotionOfHealing from "./PotionOfHealing.js";

export default class PotionOfHealingSuperior extends PotionOfHealing {

  get override() {
    return {
      data: {
        "flags.ddbimporter.dndbeyond.alternativeNames": ["Potion of Superior Healing"],
      },
    };
  }

}