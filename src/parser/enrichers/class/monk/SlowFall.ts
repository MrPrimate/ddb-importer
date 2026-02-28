import DDBEnricherData from "../../data/DDBEnricherData";

export default class SlowFall extends DDBEnricherData {

  get type() {
    if (this.is2014) return null;
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
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
