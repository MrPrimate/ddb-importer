import DDBEnricherData from "../data/DDBEnricherData";

export default class FingerOfDeath extends DDBEnricherData {

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getFingerOfDeath;
  }

  get generateSummons() {
    return true;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Place Zombie",
          type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
        },
        build: {
          generateSummon: true,
        },
        overrides: {
          noTemplate: true,
          profileKeys: this.is2014
            ? [
              { count: 1, name: "FingerOfDeathZombie2014" },
            ]
            : [
              { count: 1, name: "FingerOfDeathZombie2024" },
            ],
          summons: {
            "match": {
              "proficiency": false,
              "attacks": false,
              "saves": false,
            },
            "bonuses": {
              "ac": "",
              "hp": "",
              "attackDamage": "",
              "saveDamage": "",
              "healing": "",
            },
          },
        },
      },
    ];
  }

  get override() {
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
