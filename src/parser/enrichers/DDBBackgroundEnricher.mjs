import DDBEnricherMixin from "./mixins/DDBEnricherMixin.mjs";
import { BackgroundEnrichers, GenericEnrichers } from "./_module.mjs";

export default class DDBBackgroundEnricher extends DDBEnricherMixin {
  constructor({ activityGenerator, notifier = null, fallbackEnricher = null } = {}) {
    super({
      activityGenerator,
      effectType: "feat",
      enricherType: "feat",
      fallbackEnricher,
      notifier,
      ddbActionType: "background",
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
    Generic: BackgroundEnrichers.Generic,
  };

  FALLBACK_ENRICHERS = {
    Generic: BackgroundEnrichers.Generic,
  };

}
