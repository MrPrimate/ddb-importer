import PotionOfHealing from "./PotionOfHealing";

export default class PotionOfHealingSupreme extends PotionOfHealing {

  override get override(): IDDBOverrideData {
    return {
      data: {
        "flags.ddbimporter.dndbeyond.alternativeNames": ["Potion of Supreme Healing"],
      },
    };
  }

}
