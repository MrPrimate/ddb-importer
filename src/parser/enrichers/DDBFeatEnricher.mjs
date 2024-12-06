import DDBEnricherMixin from "./mixins/DDBEnricherMixin.mjs";
import { FeatEnrichers, GenericEnrichers } from "./_module.mjs";

export default class DDBFeatEnricher extends DDBEnricherMixin {
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

  load({ ddbParser, document, name = null, fallbackEnricher = null } = {}) {
    if (fallbackEnricher) this.fallbackEnricher = fallbackEnricher;
    super.load({ ddbParser, document, name });
    this._prepare();
  }

  NAME_HINTS_2014 = {
    "Channel Divinity: Sacred Weapon": "Sacred Weapon",
    "Lay on Hands Pool": "Lay On Hands: Healing Pool",
  };

  NAME_HINTS = {
    "Aura of Courage": "Aura of",
    "Aura Of Courage": "Aura of",
    "Aura of Protection": "Aura of",
    "Aura Of Protection": "Aura of",
    "Aura of Alacrity": "Aura of",
    "Aura of Warding": "Aura of",
    "Convert Sorcery Points": "Font of Magic",
    "Font of Magic: Convert Spell Slots": "Font of Magic",
    "Font Of Magic": "Font of Magic",
    "Interception": "Fighting Style: Interception",
    "Invoke Duplicity": "Channel Divinity: Invoke Duplicity",
    "Preserve Life": "Channel Divinity: Preserve Life",
    "Psychic Blades: Attack (DEX)": "Psychic Blade",
    "Psychic Blades: Attack (STR)": "Psychic Blade",
    "Psychic Blades: Attack": "Psychic Blade",
    "Psychic Blades": "Psychic Blade",
    "Psychic Blades: Homing Strikes": "Soul Blades: Homing Strikes",
    "Psychic Blades: Psychic Teleportation": "Soul Blades: Psychic Teleportation",
    "Psychic Teleportation": "Soul Blades: Psychic Teleportation",
    "Radiance of the Dawn": "Channel Divinity: Radiance of the Dawn",
    "Rage (Enter)": "Rage",
    // "War God's Blessing": "Channel Divinity: War God's Blessing",
    "Telekinetic Adept: Psi-Powered Leap": "Psionic Power: Psi-Powered Leap",
    "Telekinetic Adept: Telekinetic Thrust": "Psionic Power: Telekinetic Thrust",
    "Form of the Beast: Tail": "Form of the Beast",
    "Form of the Beast: Claw": "Form of the Beast",
    "Form of the Beast: Bite": "Form of the Beast",
    "Halfling Lucky": "Lucky",
    "Powerful Build, Hippo Build": "Hippo Build",
  };

  NAME_HINT_INCLUDES = {
    " Lineage": "Lineage",
    " Legacy": "Lineage",
  };

  ENRICHERS = {
    None: GenericEnrichers.None,
    "Alert": FeatEnrichers.Alert,
    "Bolstering Performance": FeatEnrichers.BolsteringPerformance,
    "Boon of Energy Resistance": FeatEnrichers.BoonOfEnergyResistance,
    "Boon of Fate": FeatEnrichers.BoonOfFate,
    "Boon of Fortitude": FeatEnrichers.BoonOfFortitude,
    "Boon of the Night Spirit": FeatEnrichers.BoonOfTheNightSpirit,
    "Energy Redirection": FeatEnrichers.EnergyRedirection,
    "Elven Accuracy": FeatEnrichers.ElvenAccuracy,
    "Healer": FeatEnrichers.Healer,
    "Lucky": GenericEnrichers.Lucky,
    "Mage Slayer": FeatEnrichers.MageSlayer,
    "Observant": FeatEnrichers.Observant,
    "Inspiring Leader": FeatEnrichers.InspiringLeader,
    "Reliable Talent": FeatEnrichers.ReliableTalent,
    "Slasher": FeatEnrichers.Slasher,
    "Tavern Brawler": FeatEnrichers.TavernBrawler,
    "Telekinetic": FeatEnrichers.Telekinetic,
    "War Caster": FeatEnrichers.WarCaster,
    "Charger": FeatEnrichers.Charger,
    "Chef": FeatEnrichers.Chef,
    "Fighting Style: Interception": GenericEnrichers.FightingStyleInterception,
    "Poisoner": FeatEnrichers.Poisoner,
    "Polearm Master - Bonus Attack": FeatEnrichers.PolearmMasterBonusAttack,
    "Speedy Recovery": FeatEnrichers.SpeedyRecovery,
    "Durable": FeatEnrichers.Durable,
    "Epic Boon: Choose an Epic Boon feat": FeatEnrichers.EpicBoon,
    "Dual Wielder": FeatEnrichers.DualWielder,
  };

  FALLBACK_ENRICHERS = {
    Generic: FeatEnrichers.Generic,
  };
}
