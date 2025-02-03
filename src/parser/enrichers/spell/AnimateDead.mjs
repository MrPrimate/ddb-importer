/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class AnimateDead extends DDBEnricherData {

  get type() {
    return "summon";
  }

  get activity() {
    return {
      type: "summon",
      noTemplate: true,
      generateSummons: !this.is2014,
      summonsFunction: DDBImporter.lib.DDBSummonsInterface.getAnimateDead,
      profileKeys: this.is2014
        ? [
          "AnimatedSkeleton2014",
          "AnimatedZombie2014",
        ]
        : [
          "AnimatedSkeleton2024",
          "AnimatedZombie2024",
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
