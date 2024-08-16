export default class DDBBaseActivityDictionary {

  ACTIVITY_HINTS = {

  };

  ACTIVITY_OVERRIDES = {

  };

  constructor({ document, name = null }) {
    this.document = document;
    this.name = name ?? document.flags?.ddbimporter?.originalName ?? document.name;

    this.type = this.ACTIVITY_HINTS[this.name]?.type;

  }

  applyOverride(activity) {
    if (!this.ACTIVITY_OVERRIDES[this.name]) return undefined;

    activity = foundry.utils.mergeObject(
      activity,
      this.ACTIVITY_OVERRIDES[this.name].base,
    );

    if (this.ACTIVITY_HINTS[this.name].func) this.ACTIVITY_HINTS[this.name].func(activity);
    return activity;
  }



}
