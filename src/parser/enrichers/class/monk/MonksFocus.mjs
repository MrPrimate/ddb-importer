/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class MonksFocus extends DDBEnricherData {

  get type() {
    return null;
  }

  get additionalActivities() {
    return [
      { action: { name: "Flurry of Blows", type: "class", rename: ["Flurry of Blows"] }, overrides: { addItemConsume: true } },
      { action: { name: "Patient Defense", type: "class" } },
      { action: { name: "Step of the Wind", type: "class" } },
    ];
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter.ignoredConsumptionActivities": ["Patient Defense: Disengage", "Step of the Wind: Dash"],
        "system.uses": this._getUsesWithSpent({
          type: "class",
          name: "Focus Points",
          max: "@scale.monk.focus-points",
          period: "sr",
        }),
      },
    };
  }

}
