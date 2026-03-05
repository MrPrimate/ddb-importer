import DDBEnricherData from "../../data/DDBEnricherData";

export default class TelepathicSpeech extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetCount: "1",
      data: {
        range: {
          value: "min(1, @abilities.cha.mod)",
          units: "mile",
        },
        duration: {
          value: "@classes.sorcerer.levels",
          units: "minute",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [{
      name: "Telepathic Speech",
      changes: [],
    }];
  }

}
