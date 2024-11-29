import DDBEnricherMixin from "./mixins/DDBEnricherMixin.mjs";
import { GenericEnrichers } from "./_module.mjs";

// deprecated
export default class DDBGenericEnricher extends DDBEnricherMixin {
  constructor({ activityGenerator, notifier = null, fallbackEnricher = null } = {}) {
    super({
      activityGenerator,
      effectType: "feat",
      enricherType: "feat",
      fallbackEnricher,
      notifier,
      ddbActionType: null,
    });
  }

  load({ ddbParser, document, name = null, fallbackEnricher = null } = {}) {
    if (fallbackEnricher) this.fallbackEnricher = fallbackEnricher;
    super.load({ ddbParser, document, name });
    this._prepare();
  }

  NAME_HINTS_2014 = {
  };

  NAME_HINTS = {
  };

  NAME_HINT_INCLUDES = {
  };

  ENRICHERS = {
    None: GenericEnrichers.None,
    "Unarmed Strike": GenericEnrichers.UnarmedStrike,
  };

  FALLBACK_ENRICHERS = {
  };


}
