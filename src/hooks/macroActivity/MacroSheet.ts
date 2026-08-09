/**
 * Sheet for the utility activity.
 */
export default class MacroSheet extends dnd5e.applications.activity.ActivitySheet<any> {

  /** @inheritDoc */
  static override DEFAULT_OPTIONS = {
    classes: ["macro-activity"],
  };

  /* -------------------------------------------- */

  /** @inheritDoc */
  static override PARTS = {
    ...super.PARTS,
    identity: {
      template: "modules/ddb-importer/handlebars/activities/macro-identity.hbs",
      templates: super.PARTS.identity.templates,
    },
  };
}
