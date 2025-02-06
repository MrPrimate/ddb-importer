import MuncherSettings from "../lib/MuncherSettings.mjs";
import DDBMuncher from "./DDBMuncher.js";

export default class DDBSources extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-sources";
    options.template = "modules/ddb-importer/handlebars/sources.hbs";
    options.width = 500;
    return options;
  }

  get title() { // eslint-disable-line class-methods-use-this
    // improve localisation
    // game.i18n.localize("")
    return "Monster Muncher Sauce Selection";
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("#toggle-sources").click(async (event) => {
      event.preventDefault();
      if ($('.munching-sources input:checked').length && $('.munching-sources input').not(':checked').length) {
        $('.munching-sources input').prop('checked', false);
      } else {
        $('.munching-sources input').each(function() {
          // eslint-disable-next-line no-invalid-this
          $(this).prop('checked', !$(this).prop('checked'));
        });
      }
    });
  }

  /** @override */
  async getData() { // eslint-disable-line class-methods-use-this

    return {
      sources: MuncherSettings.getSourcesLookups(),
    };
  }

  /** @override */
  // eslint-disable-next-line class-methods-use-this
  async _updateObject(event, formData) {
    event.preventDefault();
    let sources = [];
    for (const [key, value] of Object.entries(formData)) {
      if (value) sources.push(parseInt(key));
    }
    await game.settings.set("ddb-importer", "munching-policy-muncher-sources", sources);
    // eslint-disable-next-line no-use-before-define
    new DDBMuncher().render(true);
  }

}
