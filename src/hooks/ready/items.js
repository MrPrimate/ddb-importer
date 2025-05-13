import { DDBItemConfig } from "../../apps/DDBItemConfig.js";
import { DDBAdventureFlags } from "../../apps/DDBAdventureFlags.js";

function onClickV2(event) {
  if (event.shiftKey && (event.ctrlKey || event.metaKey)) {
    // eslint-disable-next-line no-invalid-this
    new DDBAdventureFlags(this.document, {}).render(true);
  } else {
    // eslint-disable-next-line no-invalid-this
    new DDBItemConfig(this.document, {}).render(true);
  }
}

function createItemHeaderButtonV1(config, buttons) {
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

function createItemHeaderButtonV2(config, buttons) {
  if (!config.document.isOwned) return;
  if (!(config.document instanceof Item)) return;
  config.options.actions["ddbclick"] = onClickV2;
  const whiteTitle = (game.settings.get("ddb-importer", "link-title-colour-white")) ? " white" : "";
  buttons.unshift({
    label: `DDB Importer Config`,
    icon: `fab fa-d-and-d-beyond${whiteTitle}`,
    action: "ddbclick",
    ownership: "OWNER",
  });
}

export function itemSheets() {
  Hooks.on('getItemSheet5eHeaderButtons', createItemHeaderButtonV1);
  Hooks.on('getHeaderControlsDocumentSheetV2', createItemHeaderButtonV2);
}

