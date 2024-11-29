/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class MomentaryStasis extends DDBEnricherData {

  get effects() {
    return [
      {
        options: {
          durationRounds: 1,
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("*0", 90, "system.attributes.movement.all"),
          DDBEnricherData.ChangeHelper.overrideChange("0", 90, "system.attributes.movement.walk"),
          DDBEnricherData.ChangeHelper.overrideChange("0", 90, "system.attributes.movement.fly"),
          DDBEnricherData.ChangeHelper.overrideChange("0", 90, "system.attributes.movement.swim"),
          DDBEnricherData.ChangeHelper.overrideChange("0", 90, "system.attributes.movement.climb"),
        ],
        statuses: ["incapacitated"],
      },
    ];
  }

}
