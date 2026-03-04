import DDBEnricherData from "../data/DDBEnricherData";

export default class ConjureConstructs extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getConjureConstructs2024;
  }

  get generateSummons() {
    return true;
  }

  get addAutoAdditionalActivities() {
    return false;
  }

  get activity() {
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

  get override(): IDDBOverrideData {
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
