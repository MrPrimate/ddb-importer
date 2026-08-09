import DDBEnricherData from "../../data/DDBEnricherData";

export default class BlackMagic extends DDBEnricherData {

  override get override(): IDDBOverrideData {
    return {
      forceSpellAdvancement: true,
    };
  }

}
