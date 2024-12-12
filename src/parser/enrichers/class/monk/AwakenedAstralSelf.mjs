/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class AwakenedAstralSelf extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get effects() {
    return [
      {
        name: "Armor of the Spirit",
        options: {
          description: "You gain +2 AC Bonus",
          durationSeconds: 600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("2", 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }
}
