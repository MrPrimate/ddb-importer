import { logger, FileHelper } from "../lib/_module.mjs";
import { SETTINGS } from "../config/_module.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const FPClass = foundry.applications?.apps?.FilePicker?.implementation ?? FilePicker;

export default class DDBLocationSetup extends HandlebarsApplicationMixin(ApplicationV2) {

  constructor(options) {
    super(options);
    this.useWebP = game.settings.get(SETTINGS.MODULE_ID, "use-webp");
    this.useDeepFilePaths = game.settings.get(SETTINGS.MODULE_ID, "use-deep-file-paths");
    this.directories = [];
    for (const [key, value] of Object.entries(SETTINGS.DEFAULT_SETTINGS.READY.DIRECTORIES)) {
      this.directories.push({
        key,
        value: game.settings.get(SETTINGS.MODULE_ID, key),
        name: game.i18n.localize(value.name),
        description: game.i18n.localize(value.hint),
      });
    }
  }

  static PARTS = {
    header: {
      template: "modules/ddb-importer/handlebars/location-setup/header.hbs",
    },
    form: {
      template: "modules/ddb-importer/handlebars/location-setup/form.hbs",
    },
    footer: {
      template: "modules/ddb-importer/handlebars/location-setup/footer.hbs",
    },
  };

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    id: "ddb-location-settings",
    classes: ["standard-form"],
    actions: {
      selectDirectory: DDBLocationSetup.selectDirectory,
    },
    position: {
      width: "500",
      height: "auto",
    },
    window: {
      icon: 'fab fa-d-and-d-beyond',
      resizable: true,
      minimizable: true,
      subtitle: "",
    },
    tag: "form",
    form: {
      handler: DDBLocationSetup.formHandler,
      submitOnChange: false,
      closeOnSubmit: false,
    },

  };

  get title() { // eslint-disable-line class-methods-use-this
    // improve localisation
    // game.i18n.localize("")
    return "DDB Importer Location Settings";
  }


  async _prepareContext() {
    const context = {};

    context["use-webp"] = this.useWebP;
    context["use-deep-file-paths"] = this.useDeepFilePaths;
    context.directories = this.directories;

    return context;
  }

  static async selectDirectory(event, target) {
    const targetDirSetting = target.dataset.target;
    const currentDir = game.settings.get(SETTINGS.MODULE_ID, targetDirSetting);
    // const parsedDir = FileHelper.parseDirectory(currentDir);
    const current = await FileHelper.getFileUrl(currentDir, "");

    const filePicker = new FPClass({
      type: "folder",
      current: current,
      // source: parsedDir.activeSource,
      // activeSource: parsedDir.activeSource,
      // bucket: parsedDir.bucket,
      callback: async (path, picker) => {
        const activeSource = picker.activeSource;
        const bucket = activeSource === "s3" && picker.sources.s3?.bucket && picker.sources.s3.bucket !== ""
          ? picker.sources.s3.bucket
          : null;

        const formattedPath = FileHelper.formatDirectoryPath({
          activeSource,
          bucket,
          path,
        });

        this.element.querySelector(`input[name='${targetDirSetting}']`).value = formattedPath;
      },
    });
    filePicker.render();

  }


  /**
   * Process form submission for the sheet
   * @this {DDBLocationSetup}                      The handler is called with the application as its bound scope
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {FormDataExtended} formData           Processed data for the submitted form
   * @returns {Promise<void>}
   */
  static async formHandler(event, form, formData) {
    const directoryStatus = [];

    for (const [key, data] of Object.entries(SETTINGS.DEFAULT_SETTINGS.READY.DIRECTORIES)) {
      const newValue = formData.object[key];
      directoryStatus.push({
        key,
        value: newValue,
        isBad: FileHelper.BAD_DIRS.includes(newValue),
        isValid: await FileHelper.verifyPath(FileHelper.parseDirectory(newValue)),
        name: game.i18n.localize(data.name),
      });
    }

    if (directoryStatus.some((dir) => dir.isBad)) {
      for (const data of directoryStatus.filter((dir) => dir.isBad)) {
        ui.notifications.error(
          `Please set the image upload directory for ${data.name} to something other than the root.`,
          { permanent: true },
        );
        logger.error("Error setting Image directory", {
          directoryStatus,
          data,
        });
      }
    } else if (directoryStatus.some((dir) => !dir.isValid)) {
      for (const data of directoryStatus.filter((dir) => !dir.isValid)) {
        ui.notifications.error(
          `Directory Validation Failed for ${data.name} please check it exists and can be written to.`,
          { permanent: true },
        );
        logger.error("Error validating Image directory", {
          directoryStatus,
          data,
        });
      }
    } else {
      // save changes
      for (const data of directoryStatus.filter((dir) => !dir.isBad)) {
        await game.settings.set(SETTINGS.MODULE_ID, data.key, data.value);
      }
      const useWebP = formData.object['use-webp'];
      const useDeepFilePaths = formData.object['use-deep-file-paths'];

      if (this.useWebP !== useWebP) await game.settings.set(SETTINGS.MODULE_ID, "use-webp", useWebP);
      if (this.useDeepFilePaths !== useDeepFilePaths) {
        await game.settings.set(SETTINGS.MODULE_ID, "use-deep-file-paths", useDeepFilePaths);
      }
      this.close();
    }

  }

}
