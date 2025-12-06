/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class AberrantFortitude extends DDBEnricherData {
  get usesOnActivity() {
    return true;
  }

  get activity() {
    return {
      noConsumeTargets: true,
      addActivityConsume: true,
    };
  }
}
