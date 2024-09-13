import { DDBItemConfig } from "../../apps/DDBItemConfig.js";
import { DDBAdventureFlags } from "../../apps/DDBAdventureFlags.js";

function createItemHeaderButton(config, buttons) {
  if (!config.document.isOwned) return;
  const whiteTitle = (game.settings.get("ddb-importer", "link-title-colour-white")) ? " white" : "";
  if (config.object instanceof Item) {
    buttons.unshift({
      label: `DDB Importer Item Config`,
      class: 'open-item-ddb-importer',
      icon: `fab fa-d-and-d-beyond${whiteTitle}`,
      onclick: (event) => {
        if (event.shiftKey && (event.ctrlKey || event.metaKey)) {
          new DDBAdventureFlags(config.object, {}).render(true);
        } else {
          new DDBItemConfig(config.object, {}).render(true);
        }
      },
    });
  }
}

export function itemSheets() {
  Hooks.on('getItemSheet5eHeaderButtons', createItemHeaderButton);
}

