import PotionOfHealing from "./PotionOfHealing";

export default class PotionOfHealingSuperior extends PotionOfHealing {

  get override() {
    return {
      data: {
        "flags.ddbimporter.dndbeyond.alternativeNames": ["Potion of Superior Healing"],
      },
    };
  }

}
