import DDBEnricherData from "../../data/DDBEnricherData";

export default class SlowFall extends DDBEnricherData {

  override get type() {
    if (this.is2014) return null;
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2014) return null;
    return {
      activationType: "reaction",
      targetType: "self",
      data: {
        healing: DDBEnricherData.basicDamagePart({ customFormula: "@classes.sorcerer.levels", types: ["healing"] }),
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      midiManualReaction: true,
    };
  }

}
