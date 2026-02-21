import DDBEnricherData from "../../data/DDBEnricherData";

export default class BlackMagic extends DDBEnricherData {

  get override() {
    return {
      forceSpellAdvancement: true,
    };
  }

}
