/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ArcaneHand extends DDBEnricherData {

  get type() {
    return "summon";
  }

  get activity() {
    return {
      type: "summon",
      noTemplate: true,
      generateSummons: !this.is2014,
      summonsFunction: DDBImporter.lib.DDBSummonsInterface.getArcaneHands2024,
      profileKeys: this.is2014
        ? [
          { count: 1, name: "ArcaneHandRed" },
          { count: 1, name: "ArcaneHandPurple" },
          { count: 1, name: "ArcaneHandGreen" },
          { count: 1, name: "ArcaneHandBlue" },
          { count: 1, name: "ArcaneHandRock" },
          { count: 1, name: "ArcaneHandRainbow" },
        ]
        : [
          { count: 1, name: "BigbysHandRed2024" },
          { count: 1, name: "BigbysHandPurple2024" },
          { count: 1, name: "BigbysHandGreen2024" },
          { count: 1, name: "BigbysHandBlue2024" },
          { count: 1, name: "BigbysHandRock2024" },
          { count: 1, name: "BigbysHandRainbow2024" },
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
