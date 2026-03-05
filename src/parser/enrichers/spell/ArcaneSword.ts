import DDBEnricherData from "../data/DDBEnricherData";

export default class ArcaneSword extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getArcaneSwords;
  }

  get generateSummons() {
    return true;
  }

  get activity(): IDDBActivityData {
    return {
      noTemplate: true,
      profileKeys: [
        { count: 1, name: "ArcaneSwordSpectralGreen" },
        { count: 1, name: "ArcaneSwordAstralBlue" },
      ],
      summons: {
        "match": {
          "proficiency": false,
          "attacks": true,
          "saves": false,
        },
      },
    };
  }

}
