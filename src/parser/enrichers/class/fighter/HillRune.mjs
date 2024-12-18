/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class HillRune extends DDBEnricherData {

  get activity() {
    return {
      name: "Invoke Rune",
      targetType: "self",
    };
  }

  get override() {
    const uses = this._getUsesWithSpent({
      name: "Hill Rune",
      type: "class",
      max: "@scale.rune-knight.rune-uses",
    });
    return {
      data: {
        "system.uses": uses,
      },
    };
  }

  get effects() {
    return [
      {
        noCreate: true,
        name: "Hill Rune: Passive Bonuses",
        options: {
          description: "You have advantage on saving throws against being poisoned.",
        },
      },
      {
        activityMatch: "Invoke Rune",
        name: "Hill Rune",
        options: {
          transfer: false,
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("bludgeoning", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("slashing", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("piercing", 20, "system.traits.dr.value"),
        ],
      },
    ];
  }

}
