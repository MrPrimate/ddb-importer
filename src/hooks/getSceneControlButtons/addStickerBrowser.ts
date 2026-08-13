import DDBStickerBrowser from "../../apps/DDBStickerBrowser";
import { logger } from "../../lib/_module";

export function addStickerBrowserControl(controls: Record<string, any>) {
  // Fast, synchronous gate
  if (!DDBStickerBrowser.hasAccess()) return;


  if (!controls.tiles?.tools) return;

  controls.tiles.tools["ddb-stickers"] = {
    name: "ddb-stickers",
    order: 99,
    title: "DDB Sticker Browser",
    icon: "fa-solid fa-shapes",
    button: true,
    visible: true,
    onChange: (_event: any, active: boolean) => {
      if (active === false) return;
      DDBStickerBrowser.open().catch((error: unknown) => {
        logger.error("Unable to open the DDB Sticker Browser", { error });
      });
    },
  };
}
