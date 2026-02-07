/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class BlackMagic extends DDBEnricherData {

  get override() {
    return {
      forceSpellAdvancement: true,
    };
  }

}
