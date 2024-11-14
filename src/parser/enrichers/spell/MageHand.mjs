/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class MageHand extends DDBEnricherMixin {

  get type() {
    return "summon";
  }

  get activity() {
    return {
      noTemplate: true,
      profileKeys: [
        "MageHandRed",
        "MageHandPurple",
        "MageHandGreen",
        "MageHandBlue",
        "MageHandRock",
        "MageHandRainbow",
      ],
      summons: {
      },
    };
  }

}
