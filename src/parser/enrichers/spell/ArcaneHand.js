/* eslint-disable class-methods-use-this */
import DDBSummonsManager from "../../companions/DDBSummonsManager.js";
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class ArcaneHand extends DDBEnricherMixin {

  get type() {
    return "summon";
  }

  get activity() {
    return {
      type: "summon",
      noTemplate: true,
      generateSummons: !this.is2014,
      summonsFunction: DDBSummonsManager.get2024ArcaneHands,
      profileKeys: this.is2014
        ? [
          "ArcaneHandRed",
          "ArcaneHandPurple",
          "ArcaneHandGreen",
          "ArcaneHandBlue",
          "ArcaneHandRock",
          "ArcaneHandRainbow",
        ]
        : [
          "BigbysHandRed2024",
          "BigbysHandPurple2024",
          "BigbysHandGreen2024",
          "BigbysHandBlue2024",
          "BigbysHandRock2024",
          "BigbysHandRainbow2024",
        ],
      summons: {
        "match": {
          "proficiency": false,
          "attacks": true,
          "saves": false,
        },
        "bonuses": {
          "ac": "",
          "hp": "@attributes.hp.max",
          "attackDamage": "",
          "saveDamage": "",
          "healing": "",
        },
      },
    };
  }

}
