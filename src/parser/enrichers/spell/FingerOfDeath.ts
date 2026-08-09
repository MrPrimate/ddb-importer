import DDBEnricherData from "../data/DDBEnricherData";

export default class FingerOfDeath extends DDBEnricherData {

  override get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getFingerOfDeath;
  }

  override get generateSummons() {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
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
