/* eslint-disable class-methods-use-this */

import PotionOfHealing from "./PotionOfHealing.mjs";

export default class PotionOfHealingSupreme extends PotionOfHealing {

  get override() {
    return {
      data: {
        "flags.ddbimporter.dndbeyond.alternativeNames": ["Potion of Supreme Healing"],
      },
    };
  }

}
