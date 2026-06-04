import DDBEnricherData from "../../data/DDBEnricherData";

export default class JoltToLifeDamage extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      noConsumeTargets: true,
    };
  }

}
