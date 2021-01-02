import DDBMuncher from "../../muncher/ddb.js";
import { DDBSetup, DDBKeyChange } from "../../lib/Settings.js";
import { BAD_DIRS, getPatreonValidity } from "../../muncher/utils.js";

export function addMuncher (app, html) {
  if (app.options.id == "compendium" && game.user.isGM) {
    let button = $("<button class='ddb-muncher'><i class='fas fa-file-import'></i> DDB Muncher</button>");

    button.click(async () => {
      const uploadDir = game.settings.get("ddb-importer", "image-upload-directory");
      const dataDirSet = !BAD_DIRS.includes(uploadDir);
      const campaignId = game.settings.get("ddb-importer", "campaign-id");
      const cobalt = game.settings.get("ddb-importer", "cobalt-cookie") != "";
      const campaignIdCorrect = !campaignId.includes("join");
      const setupComplete = dataDirSet && cobalt && campaignIdCorrect;

      if (setupComplete) {
        let validKey = false;

        const key = game.settings.get("ddb-importer", "beta-key");
        if (key === "") {
          validKey = true;
        } else {
          const check = await getPatreonValidity(key);
          if (check.success && check.data) {
            validKey = true;
          } else {
            validKey = false;
            game.settings.set("ddb-importer", "settings-call-muncher", true);
            new DDBKeyChange().render(true);
          }
        }
        if (validKey) {
          new DDBMuncher().render(true);
        }
      } else {
        game.settings.set("ddb-importer", "settings-call-muncher", true);
        new DDBSetup().render(true);
      }
    });

    $(html).find(".directory-footer").append(button);
  }
}
