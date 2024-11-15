/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class DancingLights extends DDBEnricherData {

  get type() {
    return "summon";
  }

  get activity() {
    return {
      noTemplate: true,
      profileKeys: [
        "DancingLightsYellow",
        "DancingLightsBlueTeal",
        "DancingLightsGreen",
        "DancingLightsBlueYellow",
        "DancingLightsPink",
        "DancingLightsPurpleGreen",
        "DancingLightsRed",
      ],
      summons: {
      },
    };
  }

}
