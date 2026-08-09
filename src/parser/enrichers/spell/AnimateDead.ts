import DDBEnricherData from "../data/DDBEnricherData";

export default class AnimateDead extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getAnimateDead;
  }

  override get generateSummons() {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      noTemplate: true,
      profileKeys: this.is2014
        ? [
          { count: 1, name: "AnimatedSkeleton2014" },
          { count: 1, name: "AnimatedZombie2014" },
        ]
        : [
          { count: 1, name: "AnimatedSkeleton2024" },
          { count: 1, name: "AnimatedZombie2024" },
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
