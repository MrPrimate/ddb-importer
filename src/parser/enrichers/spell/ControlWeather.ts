import DDBEnricherData from "../data/DDBEnricherData";

export default class ControlWeather extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
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
