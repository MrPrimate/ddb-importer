import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityAbjureTheExtraplanar extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  /**
   * @returns {DDBActivityData}
   */
  get activity(): IDDBActivityData {
    return {
      name: "Abjure the Extraplanar",
      targetType: "ally",
      addItemConsume: true,
      data: {
        duration: {
          units: "minute",
          value: "1",
        },
      },
    };
  }

  /**
   * @returns {DDBEffectHint[]}
   */
  get effects(): IDDBEffectHint[] {
    return [{
      name: "Abjured",
      options: {
        durationSeconds: 60,
      },
      daeSpecialDurations: ["isDamaged" as const],
    }];
  }

}
