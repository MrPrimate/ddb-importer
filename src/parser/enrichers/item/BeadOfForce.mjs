/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class BeadOfForce extends DDBEnricherMixin {

  get type() {
    return "save";
  }

  get activity() {
    return {
      addItemConsume: true,
    };
  }

  get effects() {
    return [
      {
        options: {
          transfer: false,
          description: "Trapped in a sphere of force!",
          durationRounds: 10,
          durationSeconds: 60,
        },
      }
    ];
  }

}
