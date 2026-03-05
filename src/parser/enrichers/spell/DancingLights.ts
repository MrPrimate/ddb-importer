import DDBEnricherData from "../data/DDBEnricherData";

export default class DancingLights extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getDancingLights;
  }

  get generateSummons() {
    return true;
  }

  get activity(): IDDBActivityData {
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
