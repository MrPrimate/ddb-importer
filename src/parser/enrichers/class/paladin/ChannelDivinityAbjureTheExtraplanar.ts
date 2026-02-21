import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityAbjureTheExtraplanar extends DDBEnricherData {

  get type() {
    return "save";
  }

  /**
   * @returns {DDBActivityData}
   */
  get activity() {
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
  get effects() {
    return [{
      name: "Abjured",
      options: {
        durationSeconds: 60,
      },
      daeSpecialDurations: ["isDamaged"],
    }];
  }

}
