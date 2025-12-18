import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin.mjs";
import { ClassEnrichers, FeatEnrichers, GenericEnrichers } from "./_module.mjs";
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
    "Strike of the Giants (": "Strike of the Giants",
    "Strike of the Giants:": "Strike of the Giants",
    "Greater Mark of ": "Greater Mark of",
  };

  ENRICHERS = {
    None: GenericEnrichers.None,
    Generic: FeatEnrichers.Generic,
    "Greater Mark of": FeatEnrichers._GreaterMarkOf,
    "Greater Aberrant Mark": FeatEnrichers._GreaterMarkOf,
    "Epic Boon: Choose an Epic Boon feat": FeatEnrichers.EpicBoon,
    "Fighting Style: Interception": GenericEnrichers.FightingStyleInterception,
    "Interception": GenericEnrichers.FightingStyleInterception,
    "Lucky": GenericEnrichers.Lucky,
    "Polearm Master - Bonus Attack": FeatEnrichers.PolearmMasterBonusAttack,
    "Squire of Solamnia: Precise Strike": FeatEnrichers.SquireOfSolamniaPreciseStrike,
    "Metamagic Adept": FeatEnrichers.MetamagicAdept,
    "Ritual Caster": FeatEnrichers.RitualCaster,
    "Strike of the Giants": FeatEnrichers.StrikeOfTheGiants,
    "Martial Adept: Ambush": ClassEnrichers.Fighter.ManeuverAmbush,
    "Martial Adept: Bait and Switch": ClassEnrichers.Fighter.ManeuverBaitAndSwitch,
    "Martial Adept: Brace": ClassEnrichers.Fighter.ManeuverBrace,
    "Martial Adept: Commander's Strike": ClassEnrichers.Fighter.ManeuverCommandersStrike,
    "Martial Adept: Commanding Presence": ClassEnrichers.Fighter.ManeuverCommandingPresence,
    "Martial Adept: Disarming Attack (Str.)": ClassEnrichers.Fighter.ManeuverDisarmingAttack,
    "Martial Adept: Disarming Attack": ClassEnrichers.Fighter.ManeuverDisarmingAttack,
    "Martial Adept: Distracting Strike": ClassEnrichers.Fighter.ManeuverDistractingStrike,
    "Martial Adept: Evasive Footwork": ClassEnrichers.Fighter.ManeuverEvasiveFootwork,
    "Martial Adept: Feinting Attack": ClassEnrichers.Fighter.ManeuverFeintingAttack,
    "Martial Adept: Goading Attack (Str.)": ClassEnrichers.Fighter.ManeuverGoadingAttack,
    "Martial Adept: Goading Attack": ClassEnrichers.Fighter.ManeuverGoadingAttack,
    "Martial Adept: Grappling Strike": ClassEnrichers.Fighter.ManeuverGrapplingStrike,
    "Martial Adept: Lunging Attack": ClassEnrichers.Fighter.ManeuverLungingAttack,
    "Martial Adept: Lunging Dash": ClassEnrichers.Fighter.ManeuverLungingAttack,
    "Martial Adept: Maneuvering Attack": ClassEnrichers.Fighter.ManeuverManeuveringAttack,
    "Martial Adept: Menacing Attack (Str.)": ClassEnrichers.Fighter.ManeuverMenacingAttack,
    "Martial Adept: Menacing Attack": ClassEnrichers.Fighter.ManeuverMenacingAttack,
    "Martial Adept: Parry (Str.)": ClassEnrichers.Fighter.ManeuverParry,
    "Martial Adept: Parry": ClassEnrichers.Fighter.ManeuverParry,
    "Martial Adept: Precision Attack": ClassEnrichers.Fighter.ManeuverPrecisionAttack,
    "Martial Adept: Pushing Attack (Str.)": ClassEnrichers.Fighter.ManeuverPushingAttack,
    "Martial Adept: Pushing Attack": ClassEnrichers.Fighter.ManeuverPushingAttack,
    "Martial Adept: Quick Toss": ClassEnrichers.Fighter.ManeuverQuickToss,
    "Martial Adept: Rally": ClassEnrichers.Fighter.ManeuverRally,
    "Martial Adept: Riposte": ClassEnrichers.Fighter.ManeuverRiposte,
    "Martial Adept: Sweeping Attack": ClassEnrichers.Fighter.ManeuverSweepingAttack,
    "Martial Adept: Tactical Assessment": ClassEnrichers.Fighter.ManeuverTacticalAssessment,
    "Martial Adept: Trip Attack (Str.)": ClassEnrichers.Fighter.ManeuverTripAttack,
    "Martial Adept: Trip Attack": ClassEnrichers.Fighter.ManeuverTripAttack,
  };

  FALLBACK_ENRICHERS = {
    Generic: FeatEnrichers.Generic,
  };
}
