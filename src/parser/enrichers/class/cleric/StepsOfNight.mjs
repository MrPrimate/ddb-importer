/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class StepsOfNight extends DDBEnricherData {

  get addAutoAdditionalActivities() {
    return true;
  }

  get activity() {
    return {
      targetType: "self",
    };
  }

  get effects() {
    return [
      {
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
        ],
      },
    ];
  }

}
