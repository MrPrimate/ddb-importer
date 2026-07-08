import { SETTINGS } from "../../config/_module";

export function earlySettings() {
  for (const [name, data] of Object.entries(SETTINGS.GET_DEFAULT_SETTINGS(true))) {
    // dynamic setting keys cannot key into the registered settings type
    (game.settings.register as unknown as (module: string, key: string, data: unknown) => void)(SETTINGS.MODULE_ID, name, data);
  }
}
