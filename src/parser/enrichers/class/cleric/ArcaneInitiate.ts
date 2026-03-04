import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcaneInitiate extends DDBEnricherData {

  get override(): IDDBOverrideData {
    return {
      forceSpellAdvancement: true,
    };
  }

}
