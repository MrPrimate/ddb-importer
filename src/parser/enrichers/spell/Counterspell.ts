import DDBEnricherData from "../data/DDBEnricherData";

export default class Counterspell extends DDBEnricherData {

  get type() {
    if (this.is2014) {
      return DDBEnricherData.ACTIVITY_TYPES.CHECK;
    } else {
      return "save";
    }
  }

  get activity() {
    if (this.is2014) {
      return {
        type: DDBEnricherData.ACTIVITY_TYPES.CHECK,
        check: {
          associated: [],
          ability: "spellcasting",
          dc: {
            calculation: "",
            formula: "",
          },
        },
      };
    } else {
      return null;
    }
  }

  get override(): IDDBOverrideData {
    return {
      midiManualReaction: true,
    };
  }

}
