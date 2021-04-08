export class DDBAdventureFlags extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.title = "DDB Adventure Imported Flags";
    options.template = "modules/ddb-importer/handlebars/flag-details.hbs";
    options.classes = ["ddbimporter", "sheet"];
    options.width = 500;
    return options;
  }

  /** @override */
  async getData() { // eslint-disable-line class-methods-use-this
    // console.warn(this);
    // console.warn(this.object);
    let item = this.object.data;

    let flags = [];

    for (const i in item.flags.ddb) {
      const v = (i === "userData") ? item.flags.ddb[i]["userDisplayName"] : item.flags.ddb[i];
      flags.push({
        key: i,
        value: v,
      });
    }

    const result = {
      name: item.name,
      flags: flags,
      link: item.link,
      ddbLink: `https://www.dndbeyond.com/${flags.bookCode}/${flags.slug}`,
    };

    return result;
  }

}
