import DDBEnricherData from "../../data/DDBEnricherData";

export default class GiantsPower extends DDBEnricherData {

  override get override(): IDDBOverrideData {
    return {
      forceSpellAdvancement: true,
    };
  }

}
