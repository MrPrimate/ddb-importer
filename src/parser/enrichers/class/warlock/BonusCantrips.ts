import DDBEnricherData from "../../data/DDBEnricherData";

export default class BonusCantrips extends DDBEnricherData {

  get override() {
    return {
      forceSpellAdvancement: true,
    };
  }

}
