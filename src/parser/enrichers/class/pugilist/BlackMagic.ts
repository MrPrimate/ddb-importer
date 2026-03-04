import DDBEnricherData from "../../data/DDBEnricherData";

export default class BlackMagic extends DDBEnricherData {

  get override(): IDDBOverrideData {
    return {
      forceSpellAdvancement: true,
    };
  }

}
