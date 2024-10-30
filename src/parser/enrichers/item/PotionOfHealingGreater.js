/* eslint-disable class-methods-use-this */

import PotionOfHealing from "./PotionOfHealing.js";

export default class PotionOfHealingGreater extends PotionOfHealing {

  override() {
    return {
      data: {
        "flags.ddbimporter.dndbeyond.alternativeNames": ["Potion of Greater Healing"],
      },
    };
  }

}
