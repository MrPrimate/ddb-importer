import logger from "../logger.js";
import utils from "../utils.js";
import DirectoryPicker from "./DirectoryPicker.js";
import { getPatreonTiers, munchNote, getCampaignId, download } from "../muncher/utils.js";

const BAD_DIRS = ["[data]", "[data] ", "", null];


// eslint-disable-next-line no-unused-vars
Hooks.on("renderDDBSetup", (app, html, user) => {
  DirectoryPicker.processHtml(html);
});

export class DDBSetup extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-settings";
    options.template = "modules/ddb-importer/handlebars/settings.handlebars";
    options.width = 500;
    return options;
  }
  get title() {
    // improve localisation
    // game.i18n.localize("")
    return "DDB Importer Settings";
  }
  async getData(options) {
    const cobalt = game.settings.get("ddb-importer", "cobalt-cookie") != "";
    const betaKey = game.settings.get("ddb-importer", "beta-key") != "";
    // const daeInstalled = utils.isModuleInstalledAndActive('dae') && utils.isModuleInstalledAndActive('Dynamic-Effects-SRD');
    const campaignIdCorrect = !game.settings.get("ddb-importer", "campaign-id").includes("join");
    const tier = game.settings.get("ddb-importer", "patreon-tier");
    const tiers = getPatreonTiers(tier);

    const uploadDir = game.settings.get("ddb-importer", "image-upload-directory");
    const dataDirSet = !BAD_DIRS.includes(uploadDir);

    const setupConfig = {
      "image-upload-directory": uploadDir,
      "cobalt-cookie": game.settings.get("ddb-importer", "cobalt-cookie"),
      "campaign-id": game.settings.get("ddb-importer", "campaign-id"),
      "beta-key": game.settings.get("ddb-importer", "beta-key"),
    };

    const setupComplete = dataDirSet && cobalt && campaignIdCorrect;

    return {
      cobalt: cobalt,
      beta: betaKey && cobalt,
      setupConfig: setupConfig,
      setupComplete: setupComplete,
      campaignIdCorrect: campaignIdCorrect,
      tiers: tiers,
    };
  }
  async _updateObject(event, formData) {
    let importData = formData.importData;
    // if (importData != null && importData.length > 0) {
    //   try {
    //     let importJson = JSON.parse(importData);
    //     let success = true;
    //     Object.keys(importJson).forEach(function (key) {
    //       if (importJson[key].pathToFolder != null && importJson[key].pathToFolder.length > FOLDER_LIMIT) {
    //         success = false;
    //       }
    //     });
    //     if (success) {
    //       game.settings.set(mod, "cfolders", importJson).then(function () {
    //         refreshFolders();
    //         ui.notifications.info(game.i18n.localize("CF.folderImportSuccess"));
    //       });
    //     } else {
    //       ui.notifications.error(game.i18n.localize("CF.folderImportMaxDepth") + " (" + FOLDER_LIMIT + ")");
    //     }
    //   } catch (error) {
    //     ui.notifications.error(game.i18n.localize("CF.folderImportFailure"));
    //   }

    const imageDir = $('input[name="image-upload-directory"]')[0].value;
    const cobaltCookie = $('input[name="cobalt-cookie"]')[0].value;
    const betaKey = $('input[name="beta-key"]')[0].value;
    const campaignId = $('input[name="campaign-id"]')[0].value;
    game.settings.set("ddb-importer", "image-upload-directory", imageDir);
    game.settings.set("ddb-importer", "cobalt-cookie", cobaltCookie);
    game.settings.set("ddb-importer", "beta-key", betaKey);
    game.settings.set("ddb-importer", "campaign-id", campaignId);

    const imageDirSet = !BAD_DIRS.includes(imageDir);
    const campaignIdCorrect = !campaignId.includes("join");
    DDBMuncher.setPatreonTier();

    if (!imageDirSet) {
      $('#munching-task-setup').text(`Please set the image upload directory to something other than the root.`);
      $('#ddb-importer-settings').css("height", "auto");
      return false;
    } else if (cobaltCookie === "") {
      $('#munching-task-setup').text(`To use Muncher you need to set a Cobalt Cookie value!`);
      $('#ddb-importer-settings').css("height", "auto");
      return false;
    } else if (!campaignIdCorrect) {
      $('#munching-task-setup').text(`Incorrect CampaignID/URL! You have used the campaign join URL, please change`);
      $('#ddb-importer-settings').css("height", "auto");
      return false;
    }
    this.close();
  }
}
