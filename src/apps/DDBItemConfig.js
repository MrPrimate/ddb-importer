import CompendiumHelper from "../lib/CompendiumHelper.js";

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
  async getData() { // eslint-disable-line class-methods-use-this
    // console.warn(this);
    // console.warn(this.object);
    let item = this.object;

    const icon = item.flags.ddbimporter?.ignoreIcon;
    const itemImport = item.flags.ddbimporter?.ignoreItemImport;
    const resource = item.flags.ddbimporter?.retainResourceConsumption;
    // const itemSync = item.flags.ddbimporter?.ignoreItemSync;
    const overrideId = item.flags.ddbimporter?.overrideId;

    const settings = [
      {
        name: "ignoreItemImport",
        isChecked: itemImport,
        description: "Ignore this item when importing the character (implies all other settings here).",
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
      // {
      //   name: "ignoreItemSync",
      //   isChecked: itemSync,
      //   description: "Ignore this item when when syncing the character",
      // },
    ];

    const overrides = {
      "NONE": {
        label: `None`,
        selected: false
      }
    };

    const label = CompendiumHelper.getCompendiumLabel("custom");
    const compendium = CompendiumHelper.getCompendium(label);
    const index = await compendium.getIndex();

    index.forEach((item) => {
      overrides[item._id] = {
        label: `${item.name} (${item.type})`,
        selected: false,
      };
    });

    const selectedOverrideId = overrideId || "NONE";
    overrides[selectedOverrideId].selected = true;

    const result = {
      name: item.name,
      img: item.img,
      character: this.object.actor.name,
      settings,
      overrides,
    };

    return result;
  }

  get id() {
    const actor = this.object;
    let id = `ddb-actor-${actor.id}`;
    return id;
  }

  /** @override */
  // eslint-disable-next-line no-unused-vars
  async _updateObject(event, formData) {
    event.preventDefault();

    let item = {
      _id: this.object._id,
      flags: this.object.flags,
    };

    if (!item.flags.ddbimporter) item.flags.ddbimporter = {};
    item.flags.ddbimporter['overrideId'] = formData['override'];
    item.flags.ddbimporter['ignoreIcon'] = formData['ignoreIcon'];
    item.flags.ddbimporter['ignoreItemImport'] = formData['ignoreItemImport'];
    item.flags.ddbimporter['retainResourceConsumption'] = formData['retainResourceConsumption'];
    // item.flags.ddbimporter['ignoreItemSync'] = formData['ignoreItemSync'];

    this.object.actor.updateEmbeddedDocuments("Item", [item]);

  }
}
