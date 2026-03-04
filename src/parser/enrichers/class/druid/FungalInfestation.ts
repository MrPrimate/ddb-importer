import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class FungalInfestation extends DDBEnricherData {

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
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      activationType: "reaction",
      noTemplate: true,
      profileKeys: utils.getSetting<string>("munching-policy-force-spell-version") === "FORCE_2014"
        ? [
          { count: 1, name: "AnimatedZombie2024" },
        ]
        : [
          { count: 1, name: "AnimatedZombie2014" },
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

  get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Fungal Infestation",
      max: "max(1, @abilities.wis.mod)",
    });
    return {
      data: {
        system: {
          uses,
        },
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
