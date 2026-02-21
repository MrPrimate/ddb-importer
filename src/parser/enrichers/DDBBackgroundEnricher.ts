import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin";
import { BackgroundEnrichers, GenericEnrichers } from "./_module";

export default class DDBBackgroundEnricher extends DDBEnricherFactoryMixin {
  constructor({ activityGenerator, notifier = null, fallbackEnricher = null }: { activityGenerator: any; notifier?: any; fallbackEnricher?: any } = {} as any) {
    super({
      activityGenerator,
      effectType: "feat",
      enricherType: "feat",
      fallbackEnricher,
      notifier,
      ddbActionType: "background",
    });
  }

  NAME_HINTS_2014: Record<string, any> = {};
  NAME_HINTS: Record<string, any> = {};
  NAME_HINT_INCLUDES: Record<string, any> = {};
  ENRICHERS: Record<string, any> = {
    None: GenericEnrichers.None,
    Generic: BackgroundEnrichers.Generic,
  };
  FALLBACK_ENRICHERS: Record<string, any> = {
    Generic: BackgroundEnrichers.Generic,
  };
}
