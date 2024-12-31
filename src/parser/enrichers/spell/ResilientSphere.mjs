/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ResilientSphere extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Encased",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.customChange("* 0.5", 20, "system.attributes.movement.all"),
          DDBEnricherData.ChangeHelper.customChange("1", 20, "system.traits.di.all"),
        ],
      },
    ];
  }
}
