import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin.mjs";
import { FeatEnrichers, GenericEnrichers } from "./_module.mjs";
import { utils } from "../../lib/_module.mjs";

export default class DDBFeatEnricher extends DDBEnricherFactoryMixin {
  constructor({ activityGenerator, notifier = null, fallbackEnricher = null } = {}) {
    super({
      activityGenerator,
      effectType: "feat",
      enricherType: "feat",
      fallbackEnricher,
      notifier,
      ddbActionType: "feat",
    });
  }

  _defaultNameLoader() {
    const featName = utils.pascalCase(this.name);
    if (!FeatEnrichers[featName]) {
      return null;
    }
    return new FeatEnrichers[featName]({
      ddbEnricher: this,
    });
  }


  NAME_HINTS_2014 = {};

  NAME_HINTS = {};

  NAME_HINT_INCLUDES = {
    "Ritual Caster (": "Ritual Caster",
  };

  ENRICHERS = {
    None: GenericEnrichers.None,
    Generic: FeatEnrichers.Generic,
    "Epic Boon: Choose an Epic Boon feat": FeatEnrichers.EpicBoon,
    "Fighting Style: Interception": GenericEnrichers.FightingStyleInterception,
    "Interception": GenericEnrichers.FightingStyleInterception,
    "Lucky": GenericEnrichers.Lucky,
    "Polearm Master - Bonus Attack": FeatEnrichers.PolearmMasterBonusAttack,
    "Squire of Solamnia: Precise Strike": FeatEnrichers.SquireOfSolamniaPreciseStrike,
    "Metamagic Adept": FeatEnrichers.MetamagicAdept,
    "Ritual Caster": FeatEnrichers.RitualCaster,
  };

  FALLBACK_ENRICHERS = {
    Generic: FeatEnrichers.Generic,
  };
}
