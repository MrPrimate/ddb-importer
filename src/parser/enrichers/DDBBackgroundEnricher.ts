import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin";
import * as BackgroundEnrichers from "./background/_module";
import * as GenericEnrichers from "./generic/_module";

export default class DDBBackgroundEnricher extends DDBEnricherFactoryMixin {
  constructor({
    activityGenerator,
    notifier = null,
    fallbackEnricher = null,
  }: {
    activityGenerator: TActivityGenerator;
    notifier?: NotifierV1 | null;
    fallbackEnricher?: string | null;
  }) {
    super({
      activityGenerator,
      effectType: "feat",
      enricherType: "feat",
      fallbackEnricher,
      notifier,
      ddbActionType: "background",
    });
  }

  NAME_HINTS_2014: Record<string, string> = {};
  NAME_HINTS: Record<string, string> = {};
  NAME_HINT_INCLUDES: Record<string, string> = {};
  ENRICHERS: Record<string, EnricherConstructor> = {
    None: GenericEnrichers.None,
    Generic: BackgroundEnrichers.Generic,
  };

  FALLBACK_ENRICHERS: Record<string, EnricherConstructor> = {
    Generic: BackgroundEnrichers.Generic,
  };
}
