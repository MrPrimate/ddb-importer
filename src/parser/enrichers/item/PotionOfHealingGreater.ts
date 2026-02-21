import PotionOfHealing from "./PotionOfHealing";

export default class PotionOfHealingGreater extends PotionOfHealing {

  get override() {
    return {
      data: {
        "flags.ddbimporter.dndbeyond.alternativeNames": ["Potion of Greater Healing"],
      },
    };
  }

}
