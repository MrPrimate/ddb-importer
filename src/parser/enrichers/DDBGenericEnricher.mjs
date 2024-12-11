import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin.mjs";
import { GenericEnrichers } from "./_module.mjs";

// deprecated
export default class DDBGenericEnricher extends DDBEnricherFactoryMixin {
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
