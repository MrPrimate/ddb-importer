import DDBEnricherData from "../data/DDBEnricherData";

export default class ConjureConstructs extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getConjureConstructs2024;
  }

  override get generateSummons() {
    return true;
  }

  override get addAutoAdditionalActivities() {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      noTemplate: true,
      profileKeys: [
        { count: 1, name: "ConjureConstructs2024" },
      ],
      summons: {
        "match": {
          "proficiency": false,
          "attacks": false,
          "saves": true,
        },
        "bonuses": {
          "ac": "",
          "hp": "",
          "attackDamage": "",
          "saveDamage": "(@scaling.increase)d6",
          "healing": "(@scaling.increase)d6",
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        flags: {
          ddbimporter: {
            disposition: {
              match: true,
            },
          },
        },
      },
    };
  }
}
