/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class OrrosMarkOfFate extends DDBEnricherData {

  get activity() {
    return {
      midiSaveReaction: true,
      // midiUseCondition: `reaction == "isSaveFail"`,
    };
  }

}
