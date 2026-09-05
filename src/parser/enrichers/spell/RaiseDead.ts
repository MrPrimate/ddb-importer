import DDBEnricherData from "../data/DDBEnricherData";

export default class RaiseDead extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        healing: DDBEnricherData.basicDamagePart({
          bonus: "1",
          types: ["healing"],
        }),
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    // dnd5e folds rolls.ability.check into the initiative roll, so a separate
    // attributes.init.roll.bonus entry would penalise initiative twice.
    const keys = [
      "system.rolls.ability.check.bonus",
      "system.rolls.ability.save.bonus",
      "system.rolls.attack.mwak.bonus",
      "system.rolls.attack.msak.bonus",
      "system.rolls.attack.rwak.bonus",
      "system.rolls.attack.rsak.bonus",
    ];
    return [1, 2, 3, 4].map((day) => {
      return {
        name: `Raise Dead Penalty (Day ${day})`,
        changes: keys.map((key) => DDBEnricherData.ChangeHelper.addChange(`-${5 - day}`, 99, key)),
      };
    });
  }
}
