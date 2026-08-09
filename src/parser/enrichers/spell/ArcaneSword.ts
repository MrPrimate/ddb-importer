import DDBEnricherData from "../data/DDBEnricherData";

export default class ArcaneSword extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getArcaneSwords;
  }

  override get generateSummons() {
    return true;
  }

  override get activity(): IDDBActivityData {
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
