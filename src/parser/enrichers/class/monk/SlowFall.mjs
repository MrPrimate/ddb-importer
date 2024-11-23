/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SlowFall extends DDBEnricherData {

  get type() {
    if (this.is2014) return null;
    return "heal";
  }

  get activity() {
    if (this.is2014) return null;
    return {
      activationType: "reaction",
      targetType: "self",
      data: {
        healing: DDBEnricherData.basicDamagePart({ customFormula: "@classes.sorcerer.levels", types: ["healing"] }),
      },
    };
  }

  get override() {
    return {
      midiManualReaction: true,
    };
  }

}
