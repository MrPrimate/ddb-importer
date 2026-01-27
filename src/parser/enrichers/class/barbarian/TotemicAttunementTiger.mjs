/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class TotemicAttunementTiger extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
      name: "Activate",
      activationType: "special",
      data: {
        duration: this.is2014
          ? { units: "second", value: "60" }
          : { units: "minute", value: "10" },
      },
    };
  }

  get effects() {
    return [
      {
        name: "Totemic Attunement: Tiger",
        options: {
          transfer: true,
          disabled: true,
          durationSeconds: this.is2014 ? 60 : 600,
          description: this.ddbEnricher.data.system.description.value,
        },
        activityMatch: "Activate",
      },
    ];
  }

}
