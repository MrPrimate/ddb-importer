import logger from "../lib/Logger";
import utils from "../lib/Utils";
import type { DDBSocket } from "../hooks/socket/sockets";

// Midi-QOL options that add or remove dead/unconscious effects when hit points change. Left on,
// the active GM's Midi deletes effects on the actor while the importer is rebuilding them.
const SAFE_VALUES: Record<string, string> = {
  midiDeadCondition: "none",
  midiUnconsciousCondition: "none",
  addDead: "none",
};

const BACKUP_SETTING = "midi-import-config-backup";

/**
 * Suspends Midi-QOL's dead/unconscious handling for the duration of a character import.
 *
 * `ConfigSettings` is a world setting, so only a GM can write it. A GM client holds the
 * suspension for every running import, keyed by import id, and restores the original values
 * once the last one finishes. The original values are also kept in a world setting so a GM
 * client that reloads or disconnects mid-import does not leave Midi switched off.
 */
export default class MidiImportGuard {

  /** Import id -> id of the user running that import, held on the GM client that applied it. */
  static #holds = new Map<string, string>();

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

  static #getBackup(): Record<string, unknown> {
    return utils.getSetting<Record<string, unknown> | null>(BACKUP_SETTING) ?? {};
  }

  static async #acquire(importId: string, userId: string): Promise<string | null> {
    if (!MidiImportGuard.midiActive) return null;
    if (MidiImportGuard.#holds.size === 0) {
      const current = utils.getSetting<Record<string, unknown>>("ConfigSettings", "midi-qol");
      // a backup left by a GM client that went away mid-import holds the real original values,
      // while the live config may still be the safe one it wrote
      if (Object.keys(MidiImportGuard.#getBackup()).length === 0) {
        const backup = Object.fromEntries(Object.keys(SAFE_VALUES).map((key) => [key, current[key]]));
        await utils.setSetting(BACKUP_SETTING, backup);
      }
      if (Object.entries(SAFE_VALUES).some(([key, value]) => current[key] !== value)) {
        await utils.setSetting("ConfigSettings", { ...foundry.utils.deepClone(current), ...SAFE_VALUES }, "midi-qol");
      }
    }
    MidiImportGuard.#holds.set(importId, userId);
    return game.user.id;
  }

  static async #release(importId: string): Promise<void> {
    if (!MidiImportGuard.#holds.delete(importId)) return;
    if (MidiImportGuard.#holds.size > 0) return;
    await MidiImportGuard.#restore();
  }

  /** Puts back only the suspended keys, so other Midi settings changed during an import survive. */
  static async #restore(): Promise<void> {
    const backup = MidiImportGuard.#getBackup();
    if (Object.keys(backup).length === 0) return;
    if (MidiImportGuard.midiActive) {
      const current = utils.getSetting<Record<string, unknown>>("ConfigSettings", "midi-qol");
      await utils.setSetting("ConfigSettings", { ...foundry.utils.deepClone(current), ...backup }, "midi-qol");
    }
    await utils.setSetting(BACKUP_SETTING, {});
  }

  /**
   * Suspends Midi's dead/unconscious handling for an import. Returns the id of the GM user
   * holding the suspension, to hand back to `end`, or null when nothing was suspended.
   *
   * With no GM online nothing is needed: Midi only applies these statuses on the active GM's
   * client.
   */
  static async begin(importId: string): Promise<string | null> {
    if (!MidiImportGuard.midiActive) return null;
    if (!game.user.isGM && !game.users.some((u) => u.isGM && u.active)) {
      logger.debug("No GM online, Midi-QOL dead/unconscious handling left as is for the import");
      return null;
    }
    try {
      const holder = await globalThis.DDBImporter.socket.executeAsGM("midiImportGuardAcquire", importId);
      return typeof holder === "string" ? holder : null;
    } catch (error) {
      logger.warn("Unable to suspend Midi-QOL dead/unconscious handling for the import", { error });
      return null;
    }
  }

  /** Releases the suspension taken by `begin` on the GM client that holds it. */
  static async end(holderId: string, importId: string): Promise<void> {
    try {
      await globalThis.DDBImporter.socket.executeAsUser("midiImportGuardRelease", holderId, importId);
    } catch (error) {
      logger.warn("Unable to restore Midi-QOL dead/unconscious handling after the import", { error });
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

    // a player who disconnects mid-import never sends the release
    Hooks.on<"userConnected">("userConnected", (user, connected) => {
      if (connected) return;
      const importIds = [...MidiImportGuard.#holds.entries()]
        .filter(([, userId]) => userId === user.id)
        .map(([importId]) => importId);
      for (const importId of importIds) {
        MidiImportGuard.#serial(() => MidiImportGuard.#release(importId))
          .catch((error) => logger.error("Unable to restore Midi-QOL settings", { error }));
      }
    });

    // a backup with no other GM online is left from a GM client that reloaded or closed mid-import
    const otherGM = game.users.some((u) => u.isGM && u.active && u.id !== game.user.id);
    if (!otherGM && Object.keys(MidiImportGuard.#getBackup()).length > 0) {
      MidiImportGuard.#serial(() => MidiImportGuard.#restore())
        .catch((error) => logger.error("Unable to restore Midi-QOL settings", { error }));
    }
  }

}
