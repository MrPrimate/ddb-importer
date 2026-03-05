import DDBEnricherData from "../data/DDBEnricherData";

export default class ControlWeather extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      data: {
        range: {
          override: true,
          value: 5,
          units: "mi",
        },
      },
    };
  }

}
