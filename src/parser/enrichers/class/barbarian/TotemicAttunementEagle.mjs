/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class TotemicAttunementEagle extends DDBEnricherData {

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
        name: "Totemic Attunement: Eagle",
        options: {
          transfer: true,
          disabled: true,
          durationSeconds: this.is2014 ? 60 : 600,
          description: this.ddbEnricher.data.system.description.value,
        },
        activityMatch: "Activate",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
        ],
      },
    ];
  }

}
