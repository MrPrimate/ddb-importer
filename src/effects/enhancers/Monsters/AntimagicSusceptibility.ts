import { logger } from "../../../lib/_module";

/**
 * Antimagic Susceptibility (animated armor, flying swords, rugs of smothering and other constructs):
 * "incapacitated while in the area of an antimagic field". dnd5e 6.1's antimagic region gives
 * tokens inside the `antimagic` status; while an actor owning this trait has it, the enhancer adds
 * Incapacitated, flagged as its own, and removes that one again when the status goes. An
 * Incapacitated the creature has from anything else is left alone. The dispel magic clause (a
 * Constitution save or fall unconscious) stays with the table.
 *
 * Runs on the active GM only, so one client makes the change.
 */
export default class AntimagicSusceptibility {

  static TRAIT_NAME = "Antimagic Susceptibility";

  static FLAG = "flags.ddbimporter.antimagicSusceptibility";

  /**
   * Overlapping fields (an Antimagic Field and a beholder's cone) apply their statuses back to
   * back, and two syncs reading the effects before either create lands would both add an
   * Incapacitated, so syncs run one at a time.
   */
  static #queue = new foundry.utils.Semaphore(1);

  static hasTrait(actor: Actor.Implementation): boolean {
    return actor.items.some((item) => item.name === AntimagicSusceptibility.TRAIT_NAME);
  }

  static ownEffects(actor: Actor.Implementation): ActiveEffect.Implementation[] {
    return actor.effects.filter((effect) => foundry.utils.getProperty(effect, AntimagicSusceptibility.FLAG) === true);
  }

  /** Bring the actor's own Incapacitated in line with whether it currently has the antimagic status. */
  static async sync(actor: Actor.Implementation): Promise<void> {
    if (!AntimagicSusceptibility.hasTrait(actor)) return;
    const inField = actor.statuses.has("antimagic");
    const own = AntimagicSusceptibility.ownEffects(actor);
    if (inField && own.length === 0) {
      const status = await ActiveEffect.implementation.fromStatusEffect("incapacitated");
      const data = status.toObject();
      foundry.utils.setProperty(data, AntimagicSusceptibility.FLAG, true);
      data.name = `${data.name} (${AntimagicSusceptibility.TRAIT_NAME})`;
      await actor.createEmbeddedDocuments("ActiveEffect", [data]);
    } else if (!inField && own.length > 0) {
      await actor.deleteEmbeddedDocuments("ActiveEffect", own.map((effect) => effect.id!));
    }
  }

  /** Queue a sync behind any still running. */
  static queueSync(actor: Actor.Implementation): Promise<void> {
    return AntimagicSusceptibility.#queue.add(() => AntimagicSusceptibility.sync(actor))
      .catch((error: unknown) => {
        logger.error("Antimagic Susceptibility enhancer failed", error);
      });
  }

  static effectChanged(effect: ActiveEffect.Implementation): void {
    if (!game.users?.activeGM?.isSelf) return;
    if (foundry.utils.getProperty(effect, AntimagicSusceptibility.FLAG) === true) return;
    if (!effect.statuses?.has("antimagic")) return;
    const actor = effect.parent;
    if (!(actor instanceof Actor)) return;
    void AntimagicSusceptibility.queueSync(actor as Actor.Implementation);
  }

  static registerHooks(): void {
    Hooks.on<"createActiveEffect">("createActiveEffect", (effect) => {
      AntimagicSusceptibility.effectChanged(effect as ActiveEffect.Implementation);
    });
    Hooks.on<"deleteActiveEffect">("deleteActiveEffect", (effect) => {
      AntimagicSusceptibility.effectChanged(effect as ActiveEffect.Implementation);
    });
    // a disabled or re-enabled antimagic effect changes actor.statuses without a create or delete
    Hooks.on<"updateActiveEffect">("updateActiveEffect", (effect, changes) => {
      if (!foundry.utils.hasProperty(changes, "disabled")) return;
      AntimagicSusceptibility.effectChanged(effect as ActiveEffect.Implementation);
    });
  }

}
