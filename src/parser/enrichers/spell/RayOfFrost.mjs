/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class RayOfFrost extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Ray of Frost",
        options: {
          durationSeconds: 6,
        },
        noCreate: true,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("-10", 20, "system.attributes.movement.walk"),
        ],
        daeSpecialDurations: ["turnStartSource"],
      },
    ];
  }
}
