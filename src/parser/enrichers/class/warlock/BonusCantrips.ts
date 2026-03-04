import DDBEnricherData from "../../data/DDBEnricherData";

export default class BonusCantrips extends DDBEnricherData {

  get override(): IDDBOverrideData {
    return {
      forceSpellAdvancement: true,
    };
  }

}
