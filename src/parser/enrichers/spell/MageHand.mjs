/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class MageHand extends DDBEnricherData {

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
