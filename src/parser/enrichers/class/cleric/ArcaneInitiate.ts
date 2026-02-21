import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcaneInitiate extends DDBEnricherData {

  get override() {
    return {
      forceSpellAdvancement: true,
    };
  }

}
