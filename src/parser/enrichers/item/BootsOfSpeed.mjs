/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class BootsOfSpeed extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      activationType: "bonus",
      targetType: "self",
    };
  }

  get effects() {
    return [
      {
        options: {
          transfer: false,
          durationSeconds: 600,
          durationRounds: 100,
        },
        data: {
          changes: [
            DDBEnricherData.generateMultiplyChange(2, 20, "system.attributes.movement.walk"),
          ],
        },
      },
    ];
  }

}
