import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin.mjs";
import { FeatEnrichers, GenericEnrichers } from "./_module.mjs";

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

  NAME_HINTS_2014 = {
  };

  NAME_HINTS = {
    "Interception": "Fighting Style: Interception",
  };

  NAME_HINT_INCLUDES = {
  };

  ENRICHERS = {
    None: GenericEnrichers.None,
    Generic: FeatEnrichers.Generic,
    "Alert": FeatEnrichers.Alert,
    "Bolstering Performance": FeatEnrichers.BolsteringPerformance,
    "Boon of Energy Resistance": FeatEnrichers.BoonOfEnergyResistance,
    "Boon of Fate": FeatEnrichers.BoonOfFate,
    "Boon of Fortitude": FeatEnrichers.BoonOfFortitude,
    "Boon of the Night Spirit": FeatEnrichers.BoonOfTheNightSpirit,
    "Charger": FeatEnrichers.Charger,
    "Chef": FeatEnrichers.Chef,
    "Crossbow Expert": FeatEnrichers.CrossbowExpert,
    "Crusher": FeatEnrichers.Crusher,
    "Defensive Duelist": FeatEnrichers.DefensiveDuelist,
    "Dual Wielder": FeatEnrichers.DualWielder,
    "Durable": FeatEnrichers.Durable,
    "Elven Accuracy": FeatEnrichers.ElvenAccuracy,
    "Energy Redirection": FeatEnrichers.EnergyRedirection,
    "Epic Boon: Choose an Epic Boon feat": FeatEnrichers.EpicBoon,
    "Fighting Style: Interception": GenericEnrichers.FightingStyleInterception,
    "Great Weapon Master": FeatEnrichers.GreatWeaponMaster,
    "Healer": FeatEnrichers.Healer,
    "Heavy Armor Master": FeatEnrichers.HeavyArmorMaster,
    "Inspiring Leader": FeatEnrichers.InspiringLeader,
    "Lucky": GenericEnrichers.Lucky,
    "Mage Slayer": FeatEnrichers.MageSlayer,
    "Observant": FeatEnrichers.Observant,
    "Piercer": FeatEnrichers.Piercer,
    "Poisoner": FeatEnrichers.Poisoner,
    "Polearm Master - Bonus Attack": FeatEnrichers.PolearmMasterBonusAttack,
    "Reliable Talent": FeatEnrichers.ReliableTalent,
    "Savage Attacker": FeatEnrichers.SavageAttacker,
    "Sharpshooter": FeatEnrichers.Sharpshooter,
    "Slasher": FeatEnrichers.Slasher,
    "Speedy Recovery": FeatEnrichers.SpeedyRecovery,
    "Squire of Solamnia: Precise Strike": FeatEnrichers.SquireOfSolamniaPreciseStrike,
    "Tavern Brawler": FeatEnrichers.TavernBrawler,
    "Telekinetic": FeatEnrichers.Telekinetic,
    "War Caster": FeatEnrichers.WarCaster,
  };

  FALLBACK_ENRICHERS = {
    Generic: FeatEnrichers.Generic,
  };
}
