/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class MonksFocus extends DDBEnricherMixin {

  get type() {
    return null;
  }

  get additionalActivities() {
    return [
      { action: { name: "Flurry of Blows", type: "class", rename: ["Flurry of Blows"] }, overrides: { addItemConsume: true } },
      { action: { name: "Patient Defense", type: "class" } },
      { action: { name: "Step of the Wind", type: "class", rename: ["Step of the Wind"] }, overrides: { addItemConsume: true } },
    ];
  }

  get effects() {
    return [
      {
        name: "Disengage",
        activityMatch: "Step of the Wind",
      },
    ];
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter.ignoredConsumptionActivities": ["Patient Defense: Disengage"],
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
