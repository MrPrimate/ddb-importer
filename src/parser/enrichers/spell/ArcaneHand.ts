import DDBEnricherData from "../data/DDBEnricherData";

export default class ArcaneHand extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  get summonsFunction() {
    return this.is2014
      ? DDBImporter.lib.DDBSummonsInterface.getArcaneHands2014
      : DDBImporter.lib.DDBSummonsInterface.getArcaneHands2024;
  }

  get generateSummons() {
    return true;
  }

  get activity() {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      noTemplate: true,
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
          "hp": "@attributes.hp.effectiveMax",
          "attackDamage": "",
          "saveDamage": "",
          "healing": "",
        },
      },
    };
  }

}
