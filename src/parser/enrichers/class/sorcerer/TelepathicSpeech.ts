import DDBEnricherData from "../../data/DDBEnricherData";

export default class TelepathicSpeech extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetCount: "1",
      data: {
        range: {
          value: "min(1, @abilities.cha.mod)",
          units: "mi",
        },
        duration: {
          value: "@classes.sorcerer.levels",
          units: "minute",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [{
      name: "Telepathic Speech",
      changes: [],
    }];
  }

}
