/* eslint-disable class-methods-use-this */

import PotionOfHealing from "./PotionOfHealing.mjs";

export default class PotionOfHealingGreater extends PotionOfHealing {

  get override() {
    return {
      data: {
        "flags.ddbimporter.dndbeyond.alternativeNames": ["Potion of Greater Healing"],
      },
    };
  }

}
