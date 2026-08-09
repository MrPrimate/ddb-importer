import DDBEnricherData from "../data/DDBEnricherData";

export default class FlamingSphere extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getFlamingSphere;
  }

  override get generateSummons() {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Summon Sphere",
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      noTemplate: true,
      profileKeys: [
        { count: 1, name: "FlamingSphere" },
      ],
      summons: {
        "match": {
          "proficiency": true,
          "attacks": false,
          "saves": true,
        },
        "bonuses": {
          "ac": "",
          "hp": "",
          "attackDamage": "",
          "saveDamage": "(@item.level)d6",
          "healing": "",
        },
      },
    };
  }


  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [{
      init: {
        name: "Save vs Damage",
        type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
      },
      build: {
        generateDamage: true,
        generateSave: true,
        generateActivation: false,
        generateConsumption: false,
        noSpellslot: true,
      },
    }];
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
