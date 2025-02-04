/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class StonyLethargy extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Lethargic",
        daeSpecialDurations: ["turnStart"],
        options: {
          durationSeconds: 6,
          description: "Unable to make opportunity attacks",
        },
        changes: [
          DDBEnricherData.ChangeHelper.customChange("/2", 20, "system.attributes.movement.all"),
        ],
      },
    ];
  }

}
