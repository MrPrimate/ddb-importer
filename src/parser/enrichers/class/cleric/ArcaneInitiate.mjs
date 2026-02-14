/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ArcaneInitiate extends DDBEnricherData {

  get override() {
    return {
      forceSpellAdvancement: true,
    };
  }

}
