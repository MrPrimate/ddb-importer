import DDBEnricherData from "../data/DDBEnricherData";

export default class OrrosMarkOfFate extends DDBEnricherData {

  get activity() {
    return {
      midiSaveReaction: true,
      // midiUseCondition: `reaction == "isSaveFail"`,
    };
  }

}
