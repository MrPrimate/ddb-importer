import { CompendiumHelper, logger } from "../lib/_module";

type TFlags = Partial<FlagConfig> & Partial<{ ddbimporter: IDDBImporterFlags }>;

/** the owned item being configured */
interface IConfigItem {
  _id: string;
  id: string;
  name: string;
  img: string;
  flags: TFlags;
  actor: Actor.Implementation;
}

export class DDBItemConfig extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.title = "DDB Owned Item Config";
    options.template = "modules/ddb-importer/handlebars/item-config.hbs";
    options.classes = ["ddbimporter", "sheet"];
    options.width = 500;
    return options;
  }

  /** @override */
  async getData() {
    // console.warn(this);
    // console.warn(this.object);
    const item = this.object as IConfigItem;

    const icon = item.flags.ddbimporter?.ignoreIcon;
    const itemImport = item.flags.ddbimporter?.ignoreItemImport;
    const resource = item.flags.ddbimporter?.retainResourceConsumption;
    const chris = item.flags.ddbimporter?.ignoreItemForChrisPremades;
    const ignoreItemUpdate = item.flags.ddbimporter?.ignoreItemUpdate;
    const overrideId = item.flags.ddbimporter?.overrideId;

    const settings = [
      {
        name: "ignoreItemImport",
        isChecked: itemImport,
        description: "Ignore this item when importing the character (implies all other settings here).",
      },
      {
        name: "ignoreItemUpdate",
        isChecked: ignoreItemUpdate,
        description: "Ignore this item when when updating the character back to DDB?",
      },
      {
        name: "ignoreItemForChrisPremades",
        isChecked: chris,
        description: "Ignore this item when replacing Active Effects with those from the Cauldron of Plentiful Resources module.",
      },
      {
        name: "ignoreIcon",
        isChecked: icon,
        description: "Ignore icon updates.",
      },
      {
        name: "retainResourceConsumption",
        isChecked: resource,
        description: "Retain Resource Consumption linking.",
      },
    ];

    const overrides: Record<string, { label: string; selected: boolean }> = {
      "NONE": {
        label: `None`,
        selected: true,
      },
    };

    const label = CompendiumHelper.getCompendiumLabel("custom");
    const compendium = CompendiumHelper.getCompendium(label);
    if (compendium) {
      const index = await compendium.getIndex();
      index.forEach((entry) => {
        overrides[entry._id] = {
          label: `${entry.name} (${foundry.utils.getProperty(entry, "type")})`,
          selected: false,
        };
      });
    } else {
      ui.notifications.warn(`Unable to open custom compendium "${label}", override choices unavailable`);
      logger.warn(`DDBItemConfig: unable to open custom compendium "${label}", override choices unavailable`);
    }

    const selectedOverrideId = overrideId ?? "NONE";
    if (overrideId && overrides[selectedOverrideId]) {
      overrides[selectedOverrideId].selected = true;
    }

    const result = {
      name: item.name,
      img: item.img,
      character: item.actor.name,
      settings,
      overrides,
    };

    return result;
  }

  get id() {
    const actor = this.object as IConfigItem;
    const id = `ddb-actor-${actor.id}`;
    return id;
  }

  /** @override */

  async _updateObject(event: any, formData: any) {
    event.preventDefault();

    const configItem = this.object as IConfigItem;
    const item = {
      _id: configItem._id,
      flags: configItem.flags,
    };

    if (!item.flags.ddbimporter) item.flags.ddbimporter = {};
    item.flags.ddbimporter.overrideId = formData["override"];
    item.flags.ddbimporter.ignoreIcon = formData["ignoreIcon"];
    item.flags.ddbimporter.ignoreItemImport = formData["ignoreItemImport"];
    item.flags.ddbimporter.ignoreItemForChrisPremades = formData["ignoreItemForChrisPremades"];
    item.flags.ddbimporter.retainResourceConsumption = formData["retainResourceConsumption"];
    item.flags.ddbimporter.ignoreItemUpdate = formData["ignoreItemUpdate"];

    configItem.actor.updateEmbeddedDocuments("Item", [item as Item.UpdateData]);

  }
}
