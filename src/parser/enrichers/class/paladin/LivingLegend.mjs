/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class LivingLegend extends DDBEnricherData {

  get activity() {
    return {
      name: "Activate Living Legend",
      type: "utility",
      addItemConsume: true,
      activationType: "bonus",
    };
  }

  get additionalActivities() {
    return [
      { action: { name: "Embody Legends", type: "class" } },
    ];
  }

  get override() {
    const uses = this._getUsesWithSpent({ type: "class", name: "Embody Legends", max: "1", period: "lr" });
    return {
      data: {
        name: "Living Legend",
        "system.uses": uses,
      },
    };
  }

  get effects() {
    return [{
      name: "Living Legend",
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.cha.check.roll.mode"),
      ],
      data: {
        "flags.ddbimporter.activitiesMatch": ["Activate Living Legend"],
      },
    }];
  }

}
