import SETTINGS from "../settings.js";


export class DDBAdventureImporter extends AdventureImporter {

  constructor(adventure, options) {
    super(adventure, options);
    this.options.classes.push(SETTINGS.ADVENTURE_CSS);
    this.importOptions = {};
  }

  /** @inheritDoc */
  async getData() {
    return foundry.utils.mergeObject(await super.getData(), {
      importOptions: this.importOptions || {}
    });
  }

  /** @inheritDoc */
  async _renderInner(data) {
    const html = await super._renderInner(data);

    let options = `<section class="import-form"><h2>Importer Options</h2>`;
    for (const [name, option] of Object.entries(this.importOptions)) {
      options += `<div class="form-group">
        <label class="checkbox">
            <input type="checkbox" name="${name}" title="${option.label}" ${option.default ? "checked" : ""}/>
            ${option.label}
        </label>
    </div>`;
    }
    options += `</section>`;

    html.find(".adventure-contents").append(options);
    return html;
  }

  /** @inheritDoc */
  async importContent(toCreate, toUpdate, documentCount) {
    const importResult = await super.importContent(toCreate, toUpdate, documentCount);
    for (let [name, option] of Object.entries(this.importOptions || {})) {
      if (option.handler) {
        // eslint-disable-next-line no-await-in-loop
        await option.handler(this.document, option, this.submitOptions[name]);
      }
    }
    return importResult;
  }

}
