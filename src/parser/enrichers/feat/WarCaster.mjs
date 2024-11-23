/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class WarCaster extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get effects() {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("1", 20, "system.attributes.concentration.roll.mode"),
        ],
      },
    ];
  }

  get override() {
    return {
      midiManualReaction: true,
    };
  }

}
