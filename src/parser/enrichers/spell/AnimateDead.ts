import DDBEnricherData from "../data/DDBEnricherData";

export default class AnimateDead extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getAnimateDead;
  }

  get generateSummons() {
    return true;
  }

  get activity() {
    return {
      type: "summon",
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
