import DDBMuncher from "./DDBMuncher.js";

export default class DDBSources extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-sources";
    options.template = "modules/ddb-importer/handlebars/sources.hbs";
    options.width = 500;
    return options;
  }

  static getSourcesLookups(selected) {
    const selections = CONFIG.DDB.sources
      .filter((source) => source.isReleased && source.sourceCategoryId !== 9 && source.sourceCategoryId !== 3)
      .map((source) => {
        const details = {
          id: source.id,
          acronym: source.name,
          label: source.description,
          selected: selected.includes(source.id),
        };
        return details;
      });

    return selections;
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
    const existingSelection = game.settings.get("ddb-importer", "munching-policy-muncher-sources").flat();
    const sources = DDBSources.getSourcesLookups(existingSelection);

    return {
      sources: sources.sort((a, b) => {
        return (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0);
      }),
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
