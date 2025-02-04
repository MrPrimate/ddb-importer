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
        { count: 4, name: "DancingLightsYellow" },
        { count: 4, name: "DancingLightsBlueTeal" },
        { count: 4, name: "DancingLightsGreen" },
        { count: 4, name: "DancingLightsBlueYellow" },
        { count: 4, name: "DancingLightsPink" },
        { count: 4, name: "DancingLightsPurpleGreen" },
        { count: 4, name: "DancingLightsRed" },
      ],
      summons: {
      },
    };
  }

}
