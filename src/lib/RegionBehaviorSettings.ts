import utils from "./Utils";

/** Separate importer emission from the master switch that disables DDB region automation. */
export default class RegionBehaviorSettings {

  static get enabled(): boolean {
    return utils.getSetting<boolean>("enable-ddb-macro-region-behaviors") === true;
  }

  /** Read storage to distinguish an unset new key from its registered default. */
  static #hasImportSetting(): boolean {
    return game.settings.storage.get("world")?.getItem("ddb-importer.add-ddb-macro-region-behaviors") != null;
  }

  static get add(): boolean {
    return RegionBehaviorSettings.enabled && utils.getSetting<boolean>("add-ddb-macro-region-behaviors") === true;
  }

  /**
   * Copy the old import preference once. Its existing value becomes the master switch too, so
   * worlds that opted out now start completely disabled. Presence of the new setting is the
   * migration marker; later master changes must not overwrite the independent import preference.
   * Only the active GM writes world settings, and a failed write can retry on the next load.
   */
  static async migrate(): Promise<void> {
    if (!game.user.isActiveGM) return;
    if (!RegionBehaviorSettings.#hasImportSetting()) {
      await utils.setSetting("add-ddb-macro-region-behaviors", utils.getSetting<boolean>("enable-ddb-macro-region-behaviors"));
    }
  }

}
