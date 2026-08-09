import DDBEnricherData from "../../data/DDBEnricherData";

export default class GuidingWhispers extends DDBEnricherData {

  override get override(): IDDBOverrideData {
    return {
      forceSpellAdvancement: true,
    };
  }

}
