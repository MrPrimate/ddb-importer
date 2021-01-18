import { getPatreonTiers, setPatreonTier, BAD_DIRS, getPatreonValidity } from "../muncher/utils.js";
import DDBMuncher from "../muncher/ddb.js";

export class DDBCharacterSync extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-settings";
    options.template = "modules/ddb-importer/handlebars/sync.handlebars";
    options.width = 500;
    return options;
  }

  // eslint-disable-next-line class-methods-use-this
  get title() {
    // improve localisation
    // game.i18n.localize("")
    return "DDB Importer Settings";
  }

  /** @override */
  // eslint-disable-next-line class-methods-use-this
  async getData() {
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

  /** @override */
  // eslint-disable-next-line no-unused-vars class-methods-use-this
  async _updateObject(event, formData) {
    event.preventDefault();
    const imageDir = formData["image-upload-directory"];
    const campaignId = formData["campaign-id"];
    const cobaltCookie = formData["cobalt-cookie"];
    await game.settings.set("ddb-importer", "image-upload-directory", imageDir);
    await game.settings.set("ddb-importer", "cobalt-cookie", cobaltCookie);
    await game.settings.set("ddb-importer", "beta-key", formData["beta-key"]);
    await game.settings.set("ddb-importer", "campaign-id", campaignId);

    const imageDirSet = !BAD_DIRS.includes(imageDir);
    const campaignIdCorrect = !campaignId.includes("join");
    await setPatreonTier();

    if (!imageDirSet) {
      $("#munching-task-setup").text(`Please set the image upload directory to something other than the root.`);
      $("#ddb-importer-settings").css("height", "auto");
      throw new Error(`Please set the image upload directory to something other than the root.`);
    } else if (cobaltCookie === "") {
      $("#munching-task-setup").text(`To use Muncher you need to set a Cobalt Cookie value!`);
      $("#ddb-importer-settings").css("height", "auto");
      throw new Error(`To use Muncher you need to set a Cobalt Cookie value!`);
    } else if (!campaignIdCorrect) {
      $("#munching-task-setup").text(`Incorrect CampaignID/URL! You have used the campaign join URL, please change`);
      $("#ddb-importer-settings").css("height", "auto");
      throw new Error(`Incorrect CampaignID/URL! You have used the campaign join URL, please change`);
    } else {
      const callMuncher = game.settings.get("ddb-importer", "settings-call-muncher");

      if (callMuncher) {
        game.settings.set("ddb-importer", "settings-call-muncher", false);
        new DDBMuncher().render(true);
      }
      // this.close();
    }
  }
}
