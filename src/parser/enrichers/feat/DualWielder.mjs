/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class DualWielder extends DDBEnricherData {

  get effects() {
    return [
      {
        noCreate: true,
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "flags.dnd5e.enhancedDualWielding"),
        ],
      },
    ];
  }

}
