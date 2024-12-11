import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin.mjs";
import { BackgroundEnrichers, GenericEnrichers } from "./_module.mjs";

export default class DDBBackgroundEnricher extends DDBEnricherFactoryMixin {
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
