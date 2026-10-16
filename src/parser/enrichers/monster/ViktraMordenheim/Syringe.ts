import _MonsterFeatureSupport from "../Generic/_MonsterFeatureSupport";

/**
 * The syringe's save only poisons; the damage, the speed loss and the healing or concentration
 * penalty all come from the serum Viktra picks. The parser read the first serum's acid dice and
 * speed loss as the save's own, so every failure dealt 4d4 acid and slowed the target whatever
 * serum was chosen. Each serum is its own Poisoned effect (apply one), with its start-of-turn
 * damage as a separate roll.
 */
export default class Syringe extends _MonsterFeatureSupport {

  static SERUMS = ["Corrosive Serum", "Deadly Serum", "Mind-Altering Serum"];

  serumText(label: string): string {
    return this.optionText(label, Syringe.SERUMS) ?? "";
  }

  get durationSeconds(): number {
    return this.seconds(this.text) ?? 60;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Syringe",
      removeDamageParts: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return Syringe.SERUMS
      .map((label, index) => {
        const damageParts = this.damageTokens(this.serumText(label)).map((token) => token.part);
        if (damageParts.length === 0) return null;
        return this.extra(`${label} Damage`, `ddbSyringeSerum${index}`, "damage", {
          generateDamage: true,
          damageParts,
          activationOverride: {
            type: "turnStart",
            value: null,
            condition: `Start of the turn of a creature poisoned by the ${label}.`,
          },
        });
      })
      .filter((activity): activity is IDDBAdditionalActivity => activity !== null);
  }

  serumEffect(label: string, changes: IActiveEffectChangeData[]): IDDBEffectHint {
    return {
      name: `Poisoned: ${label}`,
      statuses: ["Poisoned"],
      activityMatch: "Syringe",
      options: {
        durationSeconds: this.durationSeconds,
        description: `${this.serumText(label)} The target repeats the save at the end of each of its turns, ending the effect on a success.`,
      },
      changes,
    };
  }

  override get effects(): IDDBEffectHint[] {
    const corrosiveSpeed = this.serumText("Corrosive Serum").match(/Speed decreases by (\d+) feet/i)?.[1];
    return [
      this.serumEffect("Corrosive Serum", corrosiveSpeed
        ? [_MonsterFeatureSupport.ChangeHelper.movementBonusChange(`-${corrosiveSpeed}`)]
        : []),
      // can't regain Hit Points, as Chill Touch
      this.serumEffect("Deadly Serum", [_MonsterFeatureSupport.ChangeHelper.damageImmunityChange("healing", 30)]),
      this.serumEffect("Mind-Altering Serum", [
        _MonsterFeatureSupport.ChangeHelper.concentrationRollModeChange(_MonsterFeatureSupport.ChangeHelper.DISADVANTAGE),
      ]),
    ];
  }

}
