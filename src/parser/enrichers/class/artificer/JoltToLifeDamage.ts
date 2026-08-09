import DDBEnricherData from "../../data/DDBEnricherData";

export default class JoltToLifeDamage extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      noConsumeTargets: true,
    };
  }

}
