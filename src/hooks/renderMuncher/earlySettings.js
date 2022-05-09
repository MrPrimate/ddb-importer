import SETTINGS from "../../settings.js";

export function earlySettings() {
  for (const [name, data] of Object.entries(SETTINGS.GET_DEFAULT_SETTINGS(true))) {
    game.settings.register(SETTINGS.MODULE_ID, name, data);
  }
}
