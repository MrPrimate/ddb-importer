import DDBEnricherData from "../../data/DDBEnricherData";

export default class GraspingTentacles extends DDBEnricherData {

  get override() {
    return {
      forceSpellAdvancement: true,
    };
  }

}
