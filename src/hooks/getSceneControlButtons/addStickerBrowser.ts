import DDBStickerBrowser from "../../apps/DDBStickerBrowser";
import { SETTINGS } from "../../config/_module";
import { PatreonHelper } from "../../lib/_module";

export function addStickerBrowserControl(controls: Record<string, any>) {
  if (!game.user?.isGM) return;
  const tier = PatreonHelper.getPatreonTier();
  const tiers = PatreonHelper.calculateAccessMatrix(tier);
  const devMode = game.settings.get(SETTINGS.MODULE_ID, "developer-mode");

  if (!devMode && !tiers.experimentalMid) return;


  controls.tiles.tools["ddb-stickers"] = {
    name: "ddb-stickers",
    order: 99,
    title: "DDB Sticker Browser",
    icon: "fa-solid fa-shapes",
    button: true,
    visible: true,
    onChange: (_event: any, active: boolean) => {
      if (active === false) return;
      new DDBStickerBrowser().render(true);
    },
  };
}
