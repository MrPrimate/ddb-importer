import { SETTINGS } from "../config/_module";
import { logger } from "../lib/_module";

const Sheet = foundry?.appv1?.sheets?.AdventureImporter ?? AdventureImporter;

// surface of the legacy (pre-v11) AdventureImporter this class was written
// against; modern cores only expose the deprecated _importContent
interface ILegacyAdventureImporterMembers {
  importContent?: (toCreate: unknown, toUpdate: unknown, documentCount: unknown) => Promise<unknown>;
}

export class DDBAdventureImporter extends Sheet {

  importOptions: Record<string, {
    label?: string;
    default?: boolean;
    handler?: (document: any, option: any, submitted: any) => Promise<unknown> | unknown;
  }>;

  // populated by the legacy AdventureImporter submit flow; absent on modern cores
  declare submitOptions?: Record<string, unknown>;

  constructor(adventure: any, options: any) {
    super(adventure, options);
    this.options.classes.push(SETTINGS.ADVENTURE_CSS);
    this.importOptions = {};
  }

  /** @inheritDoc */
  async getData() {
    return foundry.utils.mergeObject(await super.getData(), {
      importOptions: this.importOptions || {},
    });
  }

  /** @inheritDoc */
  async _renderInner(data: any) {
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
  async importContent(toCreate: any, toUpdate: any, documentCount: any) {
    const superImportContent = (Sheet.prototype as ILegacyAdventureImporterMembers).importContent;
    if (!superImportContent) {
      logger.warn("AdventureImporter#importContent is not available on this Foundry version, skipping import option handlers.");
      return undefined;
    }
    const importResult = await superImportContent.call(this, toCreate, toUpdate, documentCount);
    for (const [name, option] of Object.entries(this.importOptions || {})) {
      if (option.handler) {
        await option.handler(this.document, option, this.submitOptions?.[name]);
      }
    }
    return importResult;
  }

}
