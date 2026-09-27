/** The parts of a dnd5e activity the follow-up check reads; item and actor are narrowed on read. */
interface IFollowUpActivity {
  item?: { id?: string | null; system?: unknown } | null;
  actor?: unknown;
}

/** A concentration effect as the check reads it. */
interface IFollowUpEffect {
  id?: string | null;
  getFlag: (scope: "dnd5e", key: "item") => unknown;
}

/** The slice of dnd5e's usage configuration the follow-up rewrites. */
interface IFollowUpUsageConfig {
  cause?: { activity?: string | null } | null;
  concentration?: { begin?: boolean; end?: string | null } & Record<string, unknown>;
}

/**
 * A follow-up activity that moves a concentration spell's effect to a new creature (Move Hex,
 * Move Hunter's Mark, Flock of Familiars' extra familiar) carries
 * `flags.ddbimporter.joinConcentration`. Used while the caster already concentrates on the same
 * spell, it joins that concentration rather than starting another.
 *
 * dnd5e starts concentration for any activity whose duration is concentration, and a forward
 * activity hands its use straight to a concentration activity, so either way the caster's
 * concentration would be ended and begun again. Instead the use is told not to begin concentration,
 * and its chat message names the existing concentration effect: dnd5e's effect tray reads
 * `system.concentration` from the message and makes every effect applied from it dependent on that
 * concentration, so the moved Hex still ends when the concentration does.
 *
 * With no matching concentration (the spell has lapsed) the use is left to dnd5e unchanged.
 */
export default class ConcentrationFollowUp {

  static FLAG = "flags.ddbimporter.joinConcentration";

  /** The activity that asked to join: this one, or the forward activity that handed its use on. */
  static joiningActivity(activity: IFollowUpActivity, usageConfig: IFollowUpUsageConfig): IFollowUpActivity | null {
    if (foundry.utils.getProperty(activity, ConcentrationFollowUp.FLAG) === true) return activity;
    // a forward's cause is its relative uuid, ".Item.<itemId>.Activity.<activityId>", on the same item
    const cause = usageConfig.cause?.activity;
    if (typeof cause !== "string") return null;
    const causeId = cause.split(".").pop();
    const activities = foundry.utils.getProperty(activity.item ?? {}, "system.activities") as
      { get?: (id: string) => IFollowUpActivity | undefined } | undefined;
    const source = causeId ? activities?.get?.(causeId) : undefined;
    return source && foundry.utils.getProperty(source, ConcentrationFollowUp.FLAG) === true ? source : null;
  }

  /** The id of the caster's current concentration effect on the activity's item, if any. */
  static concentrationEffectId(activity: IFollowUpActivity): string | null {
    const itemId = activity.item?.id;
    if (!itemId) return null;
    const effects = foundry.utils.getProperty(activity.actor ?? {}, "concentration.effects") as
      Iterable<IFollowUpEffect> | undefined;
    for (const effect of effects ?? []) {
      const data = effect.getFlag("dnd5e", "item") as { id?: string } | undefined;
      if (data?.id === itemId && effect.id) return effect.id;
    }
    return null;
  }

  static preUseActivityHook(
    activity: IFollowUpActivity,
    usageConfig: IFollowUpUsageConfig,
    messageConfig: { data?: Record<string, unknown> } & Record<string, unknown>,
  ): void {
    if (!ConcentrationFollowUp.joiningActivity(activity, usageConfig)) return;
    const effectId = ConcentrationFollowUp.concentrationEffectId(activity);
    if (!effectId) return;
    usageConfig.concentration = { ...(usageConfig.concentration ?? {}), begin: false };
    delete usageConfig.concentration.end;
    foundry.utils.setProperty(messageConfig, "data.system.concentration", effectId);
  }

}
