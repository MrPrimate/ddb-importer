import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Shared helpers for Illrigger features: the Baleful Interdict seal pool, the Invoke Hell use,
 * the interdict save DC and boon level gating.
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
   * A change whose `@prof` must be the illrigger's, not the target's. dnd5e below 6.0 has no change
   * `replacement` and resolves `@` references against the actor the effect sits on; DAE substitutes
   * the caster's values only on its own (midi) apply path, which a plain chat-card apply skips. On a
   * character import the illrigger's proficiency bonus is written in as a number (re-import after
   * levelling up); a munched copy has no character and keeps `@prof` for DAE.
   */
  originChange(change: IActiveEffectChangeData): IActiveEffectChangeData {
    const prof = this.ddbParser?.ddbCharacter?.profBonus;
    if (!prof) return change;
    return { ...change, value: `${change.value}`.replaceAll("@prof", `${prof}`) };
  }

  /**
   * Activity visibility for an interdiction boon learned at a later illrigger level. DDB ships
   * every boon's action with the 7th-level interdiction feature, so without this a 7th-level
   * character sees the 13th and 18th-level boons too.
   */
  static boonVisibility(min: number): { visibility: I5eActivityVisibility } {
    return {
      visibility: {
        identifier: "illrigger",
        level: { min, max: null },
      },
    };
  }

}
