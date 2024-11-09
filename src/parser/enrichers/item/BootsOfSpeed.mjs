/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class BootsOfSpeed extends DDBEnricherMixin {

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
            DDBEnricherMixin.generateMultiplyChange(2, 20, "system.attributes.movement.walk"),
          ],
        },
      },
    ];
  }

}
