import PotionOfHealing from "./PotionOfHealing";

export default class PotionOfHealingGreater extends PotionOfHealing {

  override get override() : IDDBOverrideData {
    return {
      data: {
        "flags.ddbimporter.dndbeyond.alternativeNames": ["Potion of Greater Healing"],
      },
    };
  }

}
