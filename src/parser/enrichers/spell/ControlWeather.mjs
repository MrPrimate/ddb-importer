/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class ControlWeather extends DDBEnricherMixin {

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
