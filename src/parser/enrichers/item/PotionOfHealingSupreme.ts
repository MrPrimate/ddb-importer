import PotionOfHealing from "./PotionOfHealing";

export default class PotionOfHealingSupreme extends PotionOfHealing {

  get override() {
    return {
      data: {
        "flags.ddbimporter.dndbeyond.alternativeNames": ["Potion of Supreme Healing"],
      },
    };
  }

}
