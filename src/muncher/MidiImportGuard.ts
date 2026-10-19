import logger from "../lib/Logger";
import utils from "../lib/Utils";
import type { DDBSocket } from "../hooks/socket/sockets";

// Midi-QOL options that add or remove dead/unconscious/wounded effects when hit points change.
// Left on, the active GM's Midi deletes effects on the actor while the importer is rebuilding them.
// addWounded is a hit point percentage threshold, and 0 turns it off.
const SAFE_VALUES: Record<string, unknown> = {
  midiDeadCondition: "none",
  midiUnconsciousCondition: "none",
  addDead: "none",
  addWounded: 0,
};

const BACKUP_SETTING = "midi-import-config-backup";

/** One running import holding the suspension: the user running it, and when it began. */
interface IMidiImportHold {
  userId: string;
  at: number;
}

/** The world-scoped guard state: the original Midi values and every import still holding them off. */
interface IMidiImportGuardState {
  values: Record<string, unknown>;
  holds: Record<string, IMidiImportHold>;
}

// an import that never ended (its client crashed with no GM online to see it go) stops holding
// the suspension after this long
const STALE_HOLD_MS = 60 * 60 * 1000;

/**
 * Suspends Midi-QOL's dead/unconscious/wounded handling for the duration of a character import.
 *
 * `ConfigSettings` is a world setting, so only a GM can write it. The original values and the set
 * of running imports both live in a world setting rather than in one GM client's memory, so
 * whichever GM is coordinating (the lowest-id online GM, which can change mid-import as GMs come
 * and go) sees every import still running and restores Midi only once the last one ends. A GM's
 * own import goes through the coordinator too.
 */
export default class MidiImportGuard {

  /** Overlapping imports must not interleave their setting reads and writes. */
  static #queue: Promise<unknown> = Promise.resolve();

  static get midiActive(): boolean {
    return game.modules.get("midi-qol")?.active ?? false;
  }

  static #serial<T>(fn: () => Promise<T>): Promise<T> {
    const run = MidiImportGuard.#queue.then(fn, fn);
    MidiImportGuard.#queue = run.catch(() => null);
    return run;
  }

  /** The lowest-id online GM, the same client the socket's "GM" recipient resolves to. */
  static get #coordinatorId(): string | null {
    const online = game.users.filter((u) => u.isGM && u.active).map((u) => u.id);
    return online.sort()[0] ?? null;
  }

  /**
   * The stored guard state. Older versions stored the suspended values alone, with the holds in
   * the GM client's memory; such a backup reads as values with no import holding them.
   */
  static #getState(): IMidiImportGuardState {
    const stored = utils.getSetting<Record<string, unknown> | null>(BACKUP_SETTING) ?? {};
    if ("values" in stored || "holds" in stored) {
      return {
        values: (stored.values as Record<string, unknown> | undefined) ?? {},
        holds: (stored.holds as Record<string, IMidiImportHold> | undefined) ?? {},
      };
    }
    return { values: stored, holds: {} };
  }

  static async #setState(state: IMidiImportGuardState): Promise<void> {
    const empty = Object.keys(state.values).length === 0 && Object.keys(state.holds).length === 0;
    await utils.setSetting(BACKUP_SETTING, empty ? {} : state);
  }

  /** Drops holds whose importing user is gone or whose import is too old to still be running. */
  static #pruneHolds(state: IMidiImportGuardState): void {
    const now = Date.now();
    for (const [importId, hold] of Object.entries(state.holds)) {
      const user = game.users.find((u) => u.id === hold.userId);
      if (!user?.active || now - hold.at > STALE_HOLD_MS) delete state.holds[importId];
    }
  }

  static async #acquire(importId: string, userId: string): Promise<string | null> {
    if (!MidiImportGuard.midiActive) return null;
    const state = MidiImportGuard.#getState();
    const current = utils.getSetting<Record<string, unknown>>("ConfigSettings", "midi-qol");
    // a backup already stored holds the real original values, while the live config may be the
    // safe one written for an import still running or one that never ended
    if (Object.keys(state.values).length === 0) {
      state.values = Object.fromEntries(Object.keys(SAFE_VALUES).map((key) => [key, current[key]]));
    }
    state.holds[importId] = { userId, at: Date.now() };
    await MidiImportGuard.#setState(state);
    if (Object.entries(SAFE_VALUES).some(([key, value]) => current[key] !== value)) {
      await utils.setSetting("ConfigSettings", { ...foundry.utils.deepClone(current), ...SAFE_VALUES }, "midi-qol");
    }
    return game.user.id;
  }

  /**
   * Ends one import's hold (or none, to only sweep stale holds) and restores Midi once no import
   * holds it.
   */
  static async #release(importId: string | null): Promise<void> {
    const state = MidiImportGuard.#getState();
    if (Object.keys(state.values).length === 0 && Object.keys(state.holds).length === 0) return;
    if (importId) delete state.holds[importId];
    MidiImportGuard.#pruneHolds(state);
    if (Object.keys(state.holds).length > 0) {
      await MidiImportGuard.#setState(state);
      return;
    }
    await MidiImportGuard.#restore(state.values);
  }

  /** Puts back only the suspended keys, so other Midi settings changed during an import survive. */
  static async #restore(values: Record<string, unknown>): Promise<void> {
    if (Object.keys(values).length > 0 && MidiImportGuard.midiActive) {
      const current = utils.getSetting<Record<string, unknown>>("ConfigSettings", "midi-qol");
      await utils.setSetting("ConfigSettings", { ...foundry.utils.deepClone(current), ...values }, "midi-qol");
    }
    await utils.setSetting(BACKUP_SETTING, {});
  }

  /** Sweeps holds left by departed users, but only on the coordinating GM so GMs do not race. */
  static #sweepIfCoordinator(): void {
    if (MidiImportGuard.#coordinatorId !== game.user.id) return;
    MidiImportGuard.#serial(() => MidiImportGuard.#release(null))
      .catch((error) => logger.error("Unable to restore Midi-QOL settings", { error }));
  }

  /**
   * Suspends Midi's dead/unconscious/wounded handling for an import. Returns the id of the GM user
   * that applied the suspension, or null when nothing was suspended; a non-null value is what
   * tells `end` there is something to release.
   *
   * With no GM online nothing is needed: Midi only applies these statuses on the active GM's
   * client.
   */
  static async begin(importId: string): Promise<string | null> {
    if (!MidiImportGuard.midiActive) return null;
    const coordinatorId = MidiImportGuard.#coordinatorId;
    if (!coordinatorId) {
      logger.debug("No GM online, Midi-QOL dead/unconscious/wounded handling left as is for the import");
      return null;
    }
    try {
      const holder = await globalThis.DDBImporter.socket.executeAsUser("midiImportGuardAcquire", coordinatorId, importId);
      return typeof holder === "string" ? holder : null;
    } catch (error) {
      logger.warn("Unable to suspend Midi-QOL dead/unconscious/wounded handling for the import", { error });
      return null;
    }
  }

  /**
   * Releases the suspension taken by `begin`. The release goes to whichever GM coordinates now,
   * not necessarily the one that applied it: that GM may have left mid-import, and the holds are
   * world state any GM can read.
   */
  static async end(_holderId: string, importId: string): Promise<void> {
    const coordinatorId = MidiImportGuard.#coordinatorId;
    if (!coordinatorId) {
      // the next GM to connect sweeps the hold, since this user is no longer importing
      logger.warn("No GM online to restore Midi-QOL dead/unconscious/wounded handling after the import");
      return;
    }
    try {
      await globalThis.DDBImporter.socket.executeAsUser("midiImportGuardRelease", coordinatorId, importId);
    } catch (error) {
      logger.warn("Unable to restore Midi-QOL dead/unconscious/wounded handling after the import", { error });
    }
  }

  static registerSocket(socket: DDBSocket): void {
    socket.register("midiImportGuardAcquire", function (this: { socketData: { userId: string } }, importId: string) {
      if (!game.user.isGM) return null;
      const userId = this.socketData.userId;
      return MidiImportGuard.#serial(() => MidiImportGuard.#acquire(importId, userId));
    });
    socket.register("midiImportGuardRelease", function (importId: string) {
      if (!game.user.isGM) return null;
      return MidiImportGuard.#serial(() => MidiImportGuard.#release(importId));
    });

    if (!game.user.isGM) return;

    // a player (or GM) who disconnects mid-import never sends the release; when the coordinating
    // GM is the one leaving, the next coordinator sees the event and takes over the sweep
    Hooks.on<"userConnected">("userConnected", (_user, connected) => {
      if (connected) return;
      MidiImportGuard.#sweepIfCoordinator();
    });

    // holds left by clients that went away while this GM was offline
    MidiImportGuard.#sweepIfCoordinator();
  }

}
