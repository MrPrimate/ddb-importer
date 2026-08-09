import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin";
import * as GenericEnrichers from "./generic/_module";

export default class DDBGenericEnricher extends DDBEnricherFactoryMixin {
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
      ddbActionType: null,
    });
  }

  override NAME_HINTS_2014: Record<string, string> = {};
  override NAME_HINTS: Record<string, string> = {};
  override NAME_HINT_INCLUDES: Record<string, string> = {};
  ENRICHERS: Record<string, EnricherConstructor> = {
    None: GenericEnrichers.None,
    "Unarmed Strike": GenericEnrichers.UnarmedStrike,
  };

  FALLBACK_ENRICHERS: Record<string, EnricherConstructor> = {};
}
