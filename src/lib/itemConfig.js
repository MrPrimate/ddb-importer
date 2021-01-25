export class DDBItemConfig extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.title = "DDB Owned Item Config";
    options.template = "modules/ddb-importer/handlebars/item-config.handlebars";
    options.classes = ["ddbimporter", "sheet"];
    options.width = 500;
    return options;
  }

  /** @override */
  async getData() { // eslint-disable-line class-methods-use-this
    // console.warn(this);
    // console.warn(this.object);
    let item = this.object.data;

    const icon = item.flags.ddbimporter?.ignoreIcon;
    const itemImport = item.flags.ddbimporter?.ignoreItemImport;
    // const itemSync = item.flags.ddbimporter?.ignoreItemSync;

    const settings = [
      {
        name: "ignoreIcon",
        isChecked: icon,
        description: "Ignore icon updates when importing the character",
      },
      {
        name: "ignoreItemImport",
        isChecked: itemImport,
        description: "Ignore this item when when importing the character.",
      },
      // {
      //   name: "ignoreItemSync",
      //   isChecked: itemSync,
      //   description: "Ignore this item when when syncing the character",
      // },
    ];

    const result = {
      name: item.name,
      img: item.img,
      character: this.object.actor.name,
      settings: settings,
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

    let item = this.object.data;

    if (!item.flags.ddbimporter) item.flags.ddbimporter = {};
    item.flags.ddbimporter['ignoreIcon'] = formData['ignoreIcon'];
    item.flags.ddbimporter['ignoreItemImport'] = formData['ignoreItemImport'];
    // item.flags.ddbimporter['ignoreItemSync'] = formData['ignoreItemSync'];
    this.object.actor.updateEmbeddedEntity("OwnedItem", item);

  }
}
