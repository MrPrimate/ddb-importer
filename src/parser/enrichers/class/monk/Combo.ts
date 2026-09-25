import DDBEnricherData from "../../data/DDBEnricherData";

const COMBO_STAGES = [
  { name: "Begin Combo", effect: "Combo (+2)", total: 2 },
  { name: "Combo: Second Hit", effect: "Combo: Second Hit (+4)", total: 4, id: "ddbComboSecondHt" },
  { name: "Combo: Third Hit", effect: "Combo: Third Hit (+6)", total: 6, id: "ddbComboThirdHit" },
] as const;

/**
 * Warrior of the Street level 3: after an Unarmed Strike hit, 1 Focus Point starts a combo worth
 * +2 to Unarmed Strike attack rolls until the end of the turn, rising by 2 per successive hit to +6.
 *
 * Each stage is its own +2 effect so the applied effects stack to the running total. dnd5e
 * refreshes an already-applied effect rather than adding a second copy, which is why the stages
 * cannot share one effect. A miss or taking damage resets the combo: delete the stage effects,
 * keeping the base +2.
 *
 * Only AC5e can scope the bonus to Unarmed Strikes; without it the fallback is a melee weapon
 * attack bonus, which also covers Monk weapons.
 */
export default class Combo extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  static stageActivity(name: string, condition: string): IDDBActivityData {
    return {
      name,
      targetType: "self",
      activationType: "special",
      activationCondition: condition,
      data: {
        range: { units: "self" },
        duration: { value: "1", units: "turn" },
      },
    };
  }

  override get activity(): IDDBActivityData {
    return {
      ...Combo.stageActivity(
        COMBO_STAGES[0].name,
        "You hit a creature with an Unarmed Strike and deal damage",
      ),
      addItemConsume: true,
      itemConsumeTargetName: "Monk's Focus",
      itemConsumeValue: "1",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const [, second, third] = COMBO_STAGES;
    return [second, third].map((stage): IDDBAdditionalActivity => ({
      id: stage.id,
      duplicate: true,
      overrides: {
        ...Combo.stageActivity(stage.name, "Successive Unarmed Strike hit on the current turn"),
        // the duplicate copies Begin Combo's Focus Point cost, which only starting the combo pays
        noConsumeTargets: true,
      },
    }));
  }

  override get effects(): IDDBEffectHint[] {
    return COMBO_STAGES.flatMap((stage): IDDBEffectHint[] => {
      const options: IDDBEffectOptions = {
        expiry: "turnEnd",
        durationTurns: 1,
        description: `Combo bonus to Unarmed Strike attack rolls, +${stage.total} in total with the earlier stages. Remove the later stages if you take damage or miss with an attack roll.`,
      };
      return [
        {
          name: stage.effect,
          activityMatch: stage.name,
          ac5eOnly: true,
          options,
          ac5eChanges: [
            DDBEnricherData.ChangeHelper.ac5eChange(
              "bonus=2; item.name.includes('Unarmed')",
              20,
              "flags.automated-conditions-5e.attack.bonus",
            ),
          ],
        },
        {
          name: stage.effect,
          activityMatch: stage.name,
          ac5eNever: true,
          options,
          changes: [
            DDBEnricherData.ChangeHelper.unsignedAddChange("2", 20, "system.bonuses.mwak.attack"),
          ],
        },
      ];
    });
  }

}
