import DDBEnricherData from "../../data/DDBEnricherData";

export default class AdaptiveWildShape extends DDBEnricherData {

  // the option is picked afresh each time you Wild Shape rather than locked in at
  // level up, so build a feature for all seven rather than only the current selection
  override get parseAllChoiceFeatures(): boolean {
    return true;
  }

}
