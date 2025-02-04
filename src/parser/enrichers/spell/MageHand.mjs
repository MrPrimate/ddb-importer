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
        { count: 1, name: "MageHandRed" },
        { count: 1, name: "MageHandPurple" },
        { count: 1, name: "MageHandGreen" },
        { count: 1, name: "MageHandBlue" },
        { count: 1, name: "MageHandRock" },
        { count: 1, name: "MageHandRainbow" },
      ],
      summons: {
      },
    };
  }

}
