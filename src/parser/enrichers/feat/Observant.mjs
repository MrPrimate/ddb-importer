/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Observant extends DDBEnricherData {

  get effects() {
    return [
      {
        noCreate: true,
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "flags.dnd5e.observantFeat"),
        ],
      },
    ];
  }

  get additionalActivities() {
    return [
      { action: { name: "Quick Search", type: "feat", rename: ["Quick Search"] } },
    ];
  }

}
