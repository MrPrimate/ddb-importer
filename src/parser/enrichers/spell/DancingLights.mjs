/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class DancingLights extends DDBEnricherMixin {

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
