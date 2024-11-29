/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Stonecunning extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Activate Tremorsense",
      targetType: "self",
      addItemConsume: true,
      data: {
        duration: {
          value: "10",
          units: "minute",
        },
      },
    };
  }

  get effects() {
    return [
      {
        name: "Stonecunning: Tremorsense",
        options: {
          durationSeconds: 600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("60", 20, "system.attributes.senses.tremorsense"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.range", CONST.ACTIVE_EFFECT_MODES.ADD, 60, 5),
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.visionMode", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "tremorsense", 5),
        ],
      },
    ];
  }

  get additionalActivities() {
    return [];
  }

  get override() {
    return {
      data: {
        "system.uses": this._getUsesWithSpent({
          type: "race",
          name: "Stonecunning (Tremorsense)",
          max: "@prof",
          period: "lr",
        }),
      },
    };
  }

}
