import DDBEnricherData from "../../data/DDBEnricherData";

export default class GiantsPower extends DDBEnricherData {

  get override(): IDDBOverrideData {
    return {
      forceSpellAdvancement: true,
    };
  }

}
