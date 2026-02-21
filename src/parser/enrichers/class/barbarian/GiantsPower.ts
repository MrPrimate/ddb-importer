import DDBEnricherData from "../../data/DDBEnricherData";

export default class GiantsPower extends DDBEnricherData {

  get override() {
    return {
      forceSpellAdvancement: true,
    };
  }

}
