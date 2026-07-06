import { SETTINGS } from "../../config/_module";

export function earlySettings() {
  for (const [name, data] of Object.entries(SETTINGS.GET_DEFAULT_SETTINGS(true))) {
    // @ts-expect-error - this is fine
    game.settings.register(SETTINGS.MODULE_ID, name, data);
  }
}
