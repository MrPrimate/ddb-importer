import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcaneInitiate extends DDBEnricherData {

  override get override(): IDDBOverrideData {
    return {
      forceSpellAdvancement: true,
    };
  }

}
