import DDBEnricherData from "../../data/DDBEnricherData";

export default class GuidingWhispers extends DDBEnricherData {

  get override(): IDDBOverrideData {
    return {
      forceSpellAdvancement: true,
    };
  }

}
