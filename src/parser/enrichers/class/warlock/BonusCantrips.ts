import DDBEnricherData from "../../data/DDBEnricherData";

export default class BonusCantrips extends DDBEnricherData {

  override get override(): IDDBOverrideData {
    return {
      forceSpellAdvancement: true,
    };
  }

}
