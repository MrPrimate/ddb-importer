import { logger } from "../../../lib/_module";

/** The parts of a dnd5e activity the rider reads. */
interface ICastLevelRiderActivity {
  id?: string | null;
  uuid?: string | null;
  actor?: Actor.Implementation | null;
  item?: {
    uuid?: string | null;
    system?: { level?: number | null };
    effects?: { getName: (name: string) => ActiveEffect.Implementation | undefined };
  } | null;
}

/** The parts of dnd5e's activity usage results the rider reads. */
interface ICastLevelRiderResults {
  message?: ChatMessage.Implementation | null;
}

/**
 * Applies an activity's cast-level rider effect to the creatures targeted when it is used.
 *
 * An activity names the effect in `flags.ddbimporter.castLevelRider`. dnd5e 5.x has no origin
 * replacement for applied changes, so every `@item.level` in the effect's change values is
 * replaced with the level the spell was cast at. Battle Familiar's Empower Familiar uses it:
 * dnd5e's transform cannot see the spell level, and a hook on the transform itself would miss
 * unlinked familiar tokens, because dnd5e updates those in place without firing
 * `dnd5e.transformActor`. Setting the level on the familiar at cast time works for both, since the
 * transform formulas are read from the familiar before dnd5e splits the two paths.
 *
 * Targets are the user's targeted tokens, else the selected tokens other than the caster's.
 * Familiars the user does not own are handled by the GM over the socket.
 */
export default class CastLevelRider {

  static postUseActivityHook(activity: ICastLevelRiderActivity, usageConfig: { scaling?: number } = {}, results: ICastLevelRiderResults = {}): void {
    const effectName = activity
      ? foundry.utils.getProperty(activity, "flags.ddbimporter.castLevelRider") as string | undefined
      : undefined;
    if (!effectName) return;
    void CastLevelRider.apply(activity, effectName, usageConfig, results).catch((error) => {
      logger.error(`Unable to apply ${effectName}`, error);
    });
  }

  static targetActors(caster: Actor.Implementation | null | undefined): Actor.Implementation[] {
    const targeted = Array.from(game.user.targets ?? []);
    const tokens = targeted.length > 0
      ? targeted
      : (canvas.tokens?.controlled ?? []).filter((token) => token.actor && token.actor !== caster);
    const actors = tokens.map((token) => token.actor).filter((actor): actor is Actor.Implementation => !!actor);
    return Array.from(new Set(actors));
  }

  static async apply(activity: ICastLevelRiderActivity, effectName: string, usageConfig: { scaling?: number }, results: ICastLevelRiderResults): Promise<void> {
    const effect = activity.item?.effects?.getName(effectName);
    if (!effect) {
      logger.warn(`${effectName} not found on the casting item, re-import it to add the effect`);
      return;
    }
    const targets = CastLevelRider.targetActors(activity.actor);
    if (targets.length === 0) {
      ui.notifications.warn(`Target the creature for ${effectName} before casting, then re-cast or apply it by hand.`);
      return;
    }

    const message = results.message ?? null;
    const scaling = (foundry.utils.getProperty(message ?? {}, "system.scaling") as number | undefined) ?? usageConfig.scaling ?? 0;
    const spellLevel = (foundry.utils.getProperty(message ?? {}, "system.spellLevel") as number | undefined)
      ?? ((activity.item?.system?.level ?? 0) + scaling);

    for (const actor of targets) {
      const data = foundry.utils.mergeObject(effect.toObject(), {
        disabled: false,
        transfer: false,
        _stats: { duplicateSource: effect.uuid, compendiumSource: null },
        flags: { dnd5e: { scaling, spellLevel } },
        origin: activity.uuid ?? undefined,
      }) as Record<string, any>;
      // the flag the enricher put on the source effect stops it linking at import; the applied copy
      // does not need it
      foundry.utils.setProperty(data, "flags.ddbimporter.noeffect", null);
      // the source effect sits on an item, so its start fields are stale or empty; a recast updates the
      // applied copy, which core never restarts, so the clock is set here for both paths
      const initial = (ActiveEffect.implementation as unknown as {
        getInitialDuration: () => { duration: Record<string, unknown> };
      }).getInitialDuration();
      data.duration = { ...(data.duration ?? {}), ...initial.duration };
      data.changes = ((data.changes ?? []) as { value: unknown }[]).map((change) => ({
        ...change,
        value: typeof change.value === "string" ? change.value.replaceAll("@item.level", `${spellLevel}`) : change.value,
      }));

      const existing = actor.effects.find((e: ActiveEffect.Implementation) => foundry.utils.getProperty(e, "_stats.duplicateSource") === effect.uuid);
      if (existing) {
        const update = { ...data, _id: existing.id };
        if (actor.isOwner) await existing.update(update);
        else await globalThis.DDBImporter.socket.executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [update] });
      } else {
        delete data._id;
        if (actor.isOwner) await ActiveEffect.implementation.create(data as any, { parent: actor });
        else await globalThis.DDBImporter.socket.executeAsGM("createEffects", { actorUuid: actor.uuid, effects: [data] });
      }
    }
  }

}
