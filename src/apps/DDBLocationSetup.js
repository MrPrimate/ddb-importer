import { DirectoryPicker } from "../lib/DirectoryPicker.js";
import logger from "../logger.js";
import SETTINGS from "../settings.js";
import FileHelper from "../lib/FileHelper.js";

export default class DDBLocationSetup extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-folders";
    options.template = "modules/ddb-importer/handlebars/filePaths.hbs";
    options.width = 500;
    return options;
  }

  get title() { // eslint-disable-line class-methods-use-this
    // improve localisation
    // game.i18n.localize("")
    return "DDB Importer Location Settings";
  }

  // in foundry v10 we no longer get read only form elements back
  /** @override */
  _getSubmitData(updateData = {}) {
    let data = super._getSubmitData(updateData);

    for (const element of this.form.elements) {
      if (element.readOnly) {
        const name = element.name;
        const field = this.form.elements[name];
        foundry.utils.setProperty(data, name, field.value);
      }
    }

    return data;
  }

  /** @override */
  async getData() { // eslint-disable-line class-methods-use-this
    this.useWebP = game.settings.get(SETTINGS.MODULE_ID, "use-webp");
    this.useDeepFilePaths = game.settings.get(SETTINGS.MODULE_ID, "use-deep-file-paths");
    const directories = [];

    for (const [key, value] of Object.entries(SETTINGS.DEFAULT_SETTINGS.READY.DIRECTORIES)) {
      directories.push({
        key,
        value: game.settings.get(SETTINGS.MODULE_ID, key),
        name: game.i18n.localize(value.name),
        description: game.i18n.localize(value.hint),
      });
    }

    return {
      directories,
      useWebP: this.useWebP,
      useDeepFilePaths: this.useDeepFilePaths,
    };
  }

  /** @override */
  async _updateObject(event, formData) { // eslint-disable-line class-methods-use-this
    event.preventDefault();

    const useWebP = formData['image-use-webp'];
    const useDeepFilePaths = formData['image-use-deep-file-paths'];

    if (this.useWebP !== useWebP) await game.settings.set(SETTINGS.MODULE_ID, "use-webp", useWebP);
    if (this.useDeepFilePaths !== useDeepFilePaths) {
      await game.settings.set(SETTINGS.MODULE_ID, "use-deep-file-paths", useDeepFilePaths);
    }

    const directoryStatus = [];

    for (const key of Object.keys(SETTINGS.DEFAULT_SETTINGS.READY.DIRECTORIES)) {
      const value = formData[key];
      // eslint-disable-next-line no-await-in-loop
      await game.settings.set(SETTINGS.MODULE_ID, key, value);
      directoryStatus.push({
        key,
        value,
        isBad: FileHelper.BAD_DIRS.includes(value),
        // eslint-disable-next-line no-await-in-loop
        isValid: await DirectoryPicker.verifyPath(DirectoryPicker.parse(value)),
      });
    }

    if (directoryStatus.some((dir) => dir.isBad)) {
      $('#munching-folder-setup').text(`Please set the image upload directory(s) to something other than the root.`);
      $('#ddb-importer-folders').css("height", "auto");
      logger.error("Error setting Image directory", {
        directoryStatus,
      });
      throw new Error(`Please set the image upload directory to something other than the root.`);
    } else if (directoryStatus.some((dir) => !dir.isValid)) {
      $('#munching-folder-setup').text(`Directory Validation Failed.`);
      $('#ddb-importer-folders').css("height", "auto");
      logger.error("Error validating Image directory", {
        directoryStatus,
      });
      throw new Error(`Directory Validation Failed.`);
    }
  }
}

// eslint-disable-next-line no-unused-vars
Hooks.on("renderDDBLocationSetup", (app, html, user) => {
  DirectoryPicker.processHtml(html);
});
