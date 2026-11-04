import DDBEnricherData from "../../data/DDBEnricherData";

export default class AccursedSpecter extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return DDBImporter.lib.DDBSummonsInterface.getAccursedSpecter;
  }

  override get generateSummons(): boolean {
    return true;
  }

  /** "When the specter appears, it gains temporary hit points equal to half your warlock level." */
  override get activity(): IDDBActivityData {
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
          "hp": "",
          "attackDamage": "",
          "saveDamage": "",
          "healing": "",
        },
        tempHP: `floor(@classes.${this.classIdentifier("Warlock")}.levels / 2)`,
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Accursed Specter - Attack Bonus",
        changes: [
          DDBEnricherData.ChangeHelper.addChange("@flags.dnd5e.summon.mod", 20, "system.rolls.attack.mwak.bonus"),
          DDBEnricherData.ChangeHelper.addChange("@flags.dnd5e.summon.mod", 20, "system.rolls.attack.rwak.bonus"),
          DDBEnricherData.ChangeHelper.addChange("@flags.dnd5e.summon.mod", 20, "system.rolls.attack.msak.bonus"),
          DDBEnricherData.ChangeHelper.addChange("@flags.dnd5e.summon.mod", 20, "system.rolls.attack.rsak.bonus"),
        ],
      },
    ];
  }

}
