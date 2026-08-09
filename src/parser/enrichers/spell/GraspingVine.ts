import DDBEnricherData from "../data/DDBEnricherData";

export default class GraspingVine extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getGraspingVines2024;
  }

  override get generateSummons() {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      noTemplate: true,
      profileKeys: [
        { count: 1, name: "GraspingVine" },
      ],
      summons: {
        "match": {
          "proficiency": true,
          "attacks": true,
          "saves": true,
        },
        "bonuses": {
          "ac": "",
          "hp": "",
          "attackDamage": "(@item.level)d8",
          "saveDamage": "",
          "healing": "",
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
