/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class AccursedSpecter extends DDBEnricherData {

  get type() {
    return "summon";
  }

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getAccursedSpecter;
  }

  get generateSummons() {
    return true;
  }

  get activity() {
    return {
      noTemplate: true,
      profileKeys: [{ count: 1, name: "Specter2014" }],
      summons: {
        "match": {
          "proficiency": false,
          "attacks": false,
          "saves": false,
        },
        "bonuses": {
          "ac": "",
          "hp": "floor(@classes.warlock.levels / 2)",
          "attackDamage": "",
          "saveDamage": "",
          "healing": "",
        },
      },
    };
  }

  get effects() {
    return [
      {
        name: "Accursed Specter - Attack Bonus",
        changes: [
          DDBEnricherData.ChangeHelper.addChange("@flags.dnd5e.summon.mod", 20, "system.bonuses.mwak.attack"),
          DDBEnricherData.ChangeHelper.addChange("@flags.dnd5e.summon.mod", 20, "system.bonuses.rwak.attack"),
          DDBEnricherData.ChangeHelper.addChange("@flags.dnd5e.summon.mod", 20, "system.bonuses.msak.attack"),
          DDBEnricherData.ChangeHelper.addChange("@flags.dnd5e.summon.mod", 20, "system.bonuses.rsak.attack"),
        ],
      },
    ];
  }

}
