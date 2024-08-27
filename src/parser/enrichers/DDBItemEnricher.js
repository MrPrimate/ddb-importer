import DDBBaseEnricher from "./DDBBaseEnricher.js";

export default class DDDItemEnricher extends DDBBaseEnricher {
  constructor({ document, name = null } = {}) {
    super({ document, name });
    this._prepare();
  }

  NAME_HINTS = {};

  ACTIVITY_HINTS = {

  };

  DOCUMENT_OVERRIDES = {

  };

  EFFECT_HINTS = {

  };
}
