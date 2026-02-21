import DDBEnricherData from "../../data/DDBEnricherData";

export default class GuidingWhispers extends DDBEnricherData {

  get override() {
    return {
      forceSpellAdvancement: true,
    };
  }

}
