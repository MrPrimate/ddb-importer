import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Shared helpers for Illrigger features: the Baleful Interdict seal pool, the Invoke Hell use
 * and the interdict save DC.
 *
 * The leading underscore keeps this out of the name lookup - pascalCase of a DDB feature name
 * can never start with one - while still being exported by the generated barrel.
 */
export default class _Illrigger extends DDBEnricherData {

  static SEAL_POOL = "Baleful Interdict";

  static INVOKE_HELL = "Invoke Hell";

  /** The interdict save DC: 8 + proficiency bonus + Charisma modifier. */
  static INTERDICT_DC = { calculation: "cha", formula: "" };

  static ILLRIGGER_LEVEL = "@classes.illrigger.levels";

  /** Consumption fields that spend seals from the Baleful Interdict pool. */
  static sealConsume(value: number | string = 1): Partial<IDDBActivityData> {
    return {
      addItemConsume: true,
      itemConsumeTargetName: _Illrigger.SEAL_POOL,
      itemConsumeValue: value,
    };
  }

  /** Consumption fields that spend the shared Invoke Hell use. */
  static invokeHellConsume(): Partial<IDDBActivityData> {
    return {
      addItemConsume: true,
      itemConsumeTargetName: _Illrigger.INVOKE_HELL,
      itemConsumeValue: 1,
    };
  }

  /** An extra consumption target spending seals, for activities that already spend another pool. */
  static sealConsumeTarget(value: number | string = 1): I5eConsumptionTarget {
    return {
      type: "itemUses",
      target: _Illrigger.SEAL_POOL,
      value: `${value}`,
      scaling: { mode: "", formula: "" },
    };
  }

  /**
   * A change whose roll data should read the illrigger's values when the effect is applied to
   * someone else. dnd5e below 6.0 has no change `replacement`; DAE resolves `@` references against
   * the caster when it applies the effect, without DAE they read the target.
   */
  static originChange(change: IActiveEffectChangeData): IActiveEffectChangeData {
    return change;
  }

}
