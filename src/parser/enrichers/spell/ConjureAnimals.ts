import DDBEnricherData from "../data/DDBEnricherData";

export default class ConjureAnimals extends DDBEnricherData {

  get type() {
    if (this.is2014) return null;
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getConjureAnimals2024;
  }

  get generateSummons() {
    return !this.is2014;
  }

  get activity() {
    if (this.is2014) return null;
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      noTemplate: true,
      profileKeys: [
        { count: 1, name: "ConjureAnimals" },
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
          "saveDamage": "(@item.level - 3)d10",
          "healing": "",
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
