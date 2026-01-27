/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class TotemSpiritEagle extends DDBEnricherData {

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

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Dash",
          type: "utility",
        },
        build: {
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "bonus",
          },
          targetOverride: {
            affects: {
              type: "self",
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Totem Spirit: Eagle",
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
