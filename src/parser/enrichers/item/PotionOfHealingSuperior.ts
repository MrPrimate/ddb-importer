import PotionOfHealing from "./PotionOfHealing";

export default class PotionOfHealingSuperior extends PotionOfHealing {

  override get override(): IDDBOverrideData {
    return {
      data: {
        "flags.ddbimporter.dndbeyond.alternativeNames": ["Potion of Superior Healing"],
      },
    };
  }

}
