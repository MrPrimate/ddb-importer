import DDBEnricherData from "../../data/DDBEnricherData";

/** Barrow Guard Whisper of the Departed: spend a Draugr Die and add its roll to an ability check. */
export default class SiphoningSoulsWhisperOfTheDeparted extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "You make an ability check",
      addItemConsume: true,
      itemConsumeTargetName: "death-knight",
      data: {
        roll: { prompt: false, visible: true, formula: "@scale.barrow-guard.death-knight", name: "Check Bonus" },
      },
    };
  }

}
