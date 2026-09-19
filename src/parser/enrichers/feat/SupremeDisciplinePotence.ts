import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Supreme Discipline Acquisition (Potence): spend 2 Blood Points for Advantage on Strength attack
 * rolls for a minute, and reroll one of the d20s once whenever such an attack has Advantage.
 *
 * The reroll is a d20 reroll, not a damage die, so `DamageData.modifiers` does not apply. It reads
 * like Elven Accuracy, but dnd5e only honours `flags.dnd5e.elvenAccuracy` for the abilities listed
 * in `CONFIG.DND5E.characterFlags.elvenAccuracy.abilities`, which excludes Strength, and an active
 * effect cannot widen that list. The reroll stays manual and is described on the effect.
 */
export default class SupremeDisciplinePotence extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "feat:blood-potency",
      itemConsumeValue: "2",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Potence: Overwhelming Might",
        options: {
          durationSeconds: 60,
          description: "You have Advantage on attack rolls using Strength; while you have that Advantage you can reroll one of the dice once.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.advantageAbilityAttackChange("str"),
        ],
      },
    ];
  }

}
