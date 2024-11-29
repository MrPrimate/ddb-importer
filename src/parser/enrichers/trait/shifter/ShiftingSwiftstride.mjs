/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ShiftingSwiftstride extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      activationType: "bonus",
      targetType: "self",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@prof * 2",
          types: ["temphp"],
        }),
      },
    };
  }

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("10", 20, "system.attributes.movement.walk"),
        ],
      },
    ];
  }

  get override() {
    return {
      data: {
        "system.uses": this._getUsesWithSpent({
          type: "race",
          name: "Shift",
          max: "@prof",
        }),
      },
    };
  }
}
