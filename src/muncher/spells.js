// Main module class
import { copySRDIcons, updateCompendium, getSRDCompendiumItems, removeItems } from "./import.js";
import logger from "../logger.js";

export default class SpellMuncher extends Application {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-spells";
    options.template = "modules/ddb-importer/src/muncher/spells_munch_ui.handlebars";
    options.classes.push("spell-muncher");
    options.resizable = false;
    options.height = "auto";
    options.width = 400;
    options.minimizable = true;
    options.title = "MrPrimate's Spell Muncher";
    return options;
  }

  static getSpellData(className) {
    const cobaltCookie = game.settings.get("ddb-importer", "cobalt-cookie");
    const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
    const body = { cobalt: cobaltCookie };
    // const body = {};
    return new Promise((resolve, reject) => {
      fetch(`${parsingApi}/getClassSpells/${className}`, {
        method: "POST",
        mode: "cors", // no-cors, *cors, same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin", // include, *same-origin, omit
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "follow", // manual, *follow, error
        referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(body), // body data type must match "Content-Type" header
      })
        .then((response) => response.json())
        .then((data) => resolve(data))
        .catch((error) => reject(error));
    });
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("#munch-spells-start").click(async () => {
      this.parseSpell();
    });

    // watch the change of the import-policy-selector checkboxes
    html.find('.spells-import-policy input[type="checkbox"]').on("change", (event) => {
      game.settings.set(
        "ddb-importer",
        "spells-policy-" + event.currentTarget.dataset.section,
        event.currentTarget.checked
      );
    });

    this.close();
  }

  async parseSpell() {
    const updateBool = game.settings.get("ddb-importer", "spells-policy-update-existing");
    const srdIcons = game.settings.get("ddb-importer", "spells-policy-use-srd-icons");
    const useSrdSpells = game.settings.get("ddb-importer", "spells-policy-use-srd");
    logger.info(`Munching spells! Updating? ${updateBool} SRD? ${srdIcons}`);

    const results = await Promise.allSettled([
      SpellMuncher.getSpellData("Cleric"),
      SpellMuncher.getSpellData("Druid"),
      SpellMuncher.getSpellData("Sorcerer"),
      SpellMuncher.getSpellData("Warlock"),
      SpellMuncher.getSpellData("Wizard"),
      SpellMuncher.getSpellData("Paladin"),
      SpellMuncher.getSpellData("Ranger"),
      SpellMuncher.getSpellData("Bard"),
    ]);

    const spells = results.map((r) => r.value.data).flat().flat();
    let uniqueSpells = spells.filter((v, i, a) => a.findIndex((t) => t.name === v.name) === i);

    if (useSrdSpells) {
      logger.debug("Removing compendium items");
      const srdSpells = await getSRDCompendiumItems(uniqueSpells, "spells");
      // removed existing items from those to be imported
      uniqueSpells = await removeItems(uniqueSpells, srdSpells);
    }

    if (srdIcons) uniqueSpells = await copySRDIcons(uniqueSpells);
    // We probably never want to import spells for performance reasons into a world
    // await updateFolderItems('spells', { 'spells': uniqueSpells }, updateBool);
    await updateCompendium("spells", { spells: uniqueSpells }, updateBool);
    this.close();
  }

  getData() { // eslint-disable-line class-methods-use-this
    const cobalt = game.settings.get("ddb-importer", "cobalt-cookie") != "";
    const importConfig = [
      {
        name: "update-existing",
        isChecked: game.settings.get("ddb-importer", "spells-policy-update-existing"),
        description: "Update existing spells.",
      },
      {
        name: "use-srd",
        isChecked: game.settings.get("ddb-importer", "spells-policy-use-srd"),
        description: "Copy matching SRD spells instead of importing.",
      },
      {
        name: "use-srd-icons",
        isChecked: game.settings.get("ddb-importer", "spells-policy-use-srd-icons"),
        description: "Use icons from the SRD compendium.",
      },
    ];
    return {
      cobalt: cobalt,
      importConfig: importConfig,
    };
  }

}
