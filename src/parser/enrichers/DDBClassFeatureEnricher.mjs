import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin.mjs";
import { ClassEnrichers, GenericEnrichers, ItemEnrichers } from "./_module.mjs";
import { utils } from "../../lib/_module.mjs";

export default class DDBClassFeatureEnricher extends DDBEnricherFactoryMixin {
  constructor({ activityGenerator, notifier = null, fallbackEnricher = null } = {}) {
    super({
      activityGenerator,
      effectType: "feat",
      enricherType: "feat",
      fallbackEnricher,
      notifier,
      ddbActionType: "class",
    });
  }

  get className() {
    return this.ddbParser.klass;
  }

  get subclassName() {
    return this.ddbParser.subKlass;
  }

  _defaultClassLoader() {
    if (this.className) {
      const classHintName = utils.pascalCase(this.className);
      const featName = utils.pascalCase(this.hintName);
      if (!ClassEnrichers[classHintName]?.[featName]) {
        return null;
      }
      return new ClassEnrichers[classHintName][featName]({
        ddbEnricher: this,
      });
    } else {
      return null;
    }
  }

  _defaultNameLoader() {
    const classHintName = utils.pascalCase(this.className ?? "Unknown Class");
    if (!this.ENRICHERS?.[classHintName]?.[this.hintName]) {
      return this._defaultClassLoader();
    }
    return new this.ENRICHERS[classHintName][this.hintName]({
      ddbEnricher: this,
    });
  }

  NAME_HINTS_2014 = {
    "Channel Divinity: Sacred Weapon": "Sacred Weapon",
    "Lay on Hands Pool": "Lay On Hands: Healing Pool",
  };

  NAME_HINTS = {
    "Convert Sorcery Points": "Font of Magic",
    "Font of Magic: Convert Spell Slots": "Font of Magic",
    "Font Of Magic": "Font of Magic",
    "Interception": "Fighting Style: Interception",
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
    "Cloak of Shadows": "Channel Divinity: Cloak of Shadows",
    "Banishing Arrow": "Arcane Shot Option",
    "Beguiling Arrow": "Arcane Shot Option",
    "Bursting Arrow": "Arcane Shot Option",
    "Enfeebling Arrow": "Arcane Shot Option",
    "Piercing Arrow": "Arcane Shot Option",
    "Seeking Arrow": "Arcane Shot Option",
    "Shadow Arrow": "Arcane Shot Option",
  };

  NAME_HINT_INCLUDES = {
    "Metamagic:": "MetamagicGeneric",
    "Enchantments:": "EnchantmentsExtras",
  };

  ENRICHERS = {
    None: GenericEnrichers.None,
    Generic: ClassEnrichers.Generic,
    MetamagicGeneric: ClassEnrichers.Sorcerer.MetamagicGeneric,
    "Arcane Armor - Create Armor": ClassEnrichers.Artificer.ArcaneArmorCreateArmor,
    "Arcane Propulsion Armor Gauntlet": ClassEnrichers.Artificer.ArcanePropulsionArmorGauntlet,
    "Arcane Shot Option": ClassEnrichers.Fighter.ArcaneShotOption,
    "Arms of the Astral Self (DEX/STR)": ClassEnrichers.Monk.ArmsOfTheAstralSelfPhysicalAttack,
    "Arms of the Astral Self (WIS)": ClassEnrichers.Monk.ArmsOfTheAstralSelfWisAttack,
    "Aura of Alacrity": GenericEnrichers.AuraOf,
    "Aura of Courage": GenericEnrichers.AuraOf,
    "Aura Of Courage": GenericEnrichers.AuraOf,
    "Aura of Hate": ClassEnrichers.Paladin.AuraOfHate,
    "Aura of Protection": GenericEnrichers.AuraOf,
    "Aura Of Protection": GenericEnrichers.AuraOf,
    "Aura of Warding": GenericEnrichers.AuraOf,
    "Aura of": GenericEnrichers.AuraOf,
    "Channel Divinity: Cloak of Shadows": ClassEnrichers.Cleric.ChannelDivinityCloakOfShadows,
    "Channel Divinity: Invoke Duplicity": ClassEnrichers.Cleric.InvokeDuplicity,
    "Channel Divinity: Preserve Life": ClassEnrichers.Cleric.ChannelDivinityPreserveLife,
    "Channel Divinity: Radiance of the Dawn": ClassEnrichers.Cleric.ChannelDivinityRadianceOfTheDawn,
    "Channel Divinity: Turn the Unholy": ClassEnrichers.Paladin.ChannelDivinityTurnTheUnholy,
    "Channel Divinity": ClassEnrichers.Shared.ChannelDivinity,
    "EnchantmentsExtras": ClassEnrichers.Rogue.EnchantmentsExtras,
    "Eldritch Cannon: Flamethrower": ClassEnrichers.Artificer.EldritchCannonFlamethrower,
    "Eldritch Cannon: Force Ballista": ClassEnrichers.Artificer.EldritchCannonForceBallista,
    "Eldritch Cannon: Protector": ClassEnrichers.Artificer.EldritchCannonProtector,
    "Eldritch Invocations: Ghostly Gaze": ClassEnrichers.Warlock.GhostlyGaze,
    "Eldritch Invocations: Lifedrinker": ClassEnrichers.Warlock.InvocationLifedrinker,
    "Eldritch Invocations: Pact of the Blade": ClassEnrichers.Warlock.InvocationPactOfTheBlade,
    "Eldritch Invocations: Pact of the Chain": ClassEnrichers.Warlock.PactOfTheChain,
    "Fighting Style: Interception": GenericEnrichers.FightingStyleInterception,
    "Flurry of Blows: Addle": ClassEnrichers.Monk.FlurryOfBlowsAdditional,
    "Flurry of Blows: Push": ClassEnrichers.Monk.FlurryOfBlowsAdditional,
    "Flurry of Blows: Topple": ClassEnrichers.Monk.FlurryOfBlowsAdditional,
    "Flurry of Healing and Harm": ClassEnrichers.Monk.FlurryOfHealingAndHarm,
    "Font of Magic: Sorcery Points": ClassEnrichers.Sorcerer.FontOfMagicSorceryPoints,
    "Font of Magic": ClassEnrichers.Sorcerer.FontOfMagic,
    "Form of the Beast: Bite": ClassEnrichers.Barbarian.FormOfTheBeastWeapons,
    "Form of the Beast: Claw": ClassEnrichers.Barbarian.FormOfTheBeastWeapons,
    "Form of the Beast: Tail (reaction)": ClassEnrichers.Barbarian.FormOfTheBeastWeapons,
    "Form of the Beast: Tail": ClassEnrichers.Barbarian.FormOfTheBeastWeapons,
    "Form of the Beast": ClassEnrichers.Barbarian.FormOfTheBeast,
    "Genie's Vessel: Genie's Wrath (Dao)": ClassEnrichers.Warlock.GeniesVessel,
    "Genie's Vessel: Genie's Wrath (Djinni)": ClassEnrichers.Warlock.GeniesVessel,
    "Genie's Vessel: Genie's Wrath (Efreeti)": ClassEnrichers.Warlock.GeniesVessel,
    "Genie's Vessel: Genie's Wrath (Marid)": ClassEnrichers.Warlock.GeniesVessel,
    "Giant's Havoc: Crushing Throw": ClassEnrichers.Barbarian.GiantsHavocCrushingThrow,
    "Giant's Havoc: Giant Stature": ClassEnrichers.Barbarian.GiantsHavocGiantStature,
    "Improved Blessed Strikes: Potent Spellcasting": ClassEnrichers.Cleric.ImprovedBlessedStrikesPotentSpellcasting,
    "Lay On Hands: Purify Poison": ClassEnrichers.Paladin.LayOnHandsPurifyPoison,
    "Lay on Hands": ClassEnrichers.Paladin.LayOnHands,
    "Lay On Hands": ClassEnrichers.Paladin.LayOnHands,
    "Lucky": GenericEnrichers.Lucky,
    "Maneuver Options: Ambush": ClassEnrichers.Fighter.ManeuverAmbush,
    "Maneuver Options: Bait and Switch": ClassEnrichers.Fighter.ManeuverBaitAndSwitch,
    "Maneuver Options: Brace": ClassEnrichers.Fighter.ManeuverBrace,
    "Maneuver Options: Commander's Strike": ClassEnrichers.Fighter.ManeuverCommandersStrike,
    "Maneuver Options: CommandingPresence": ClassEnrichers.Fighter.ManeuverCommandingPresence,
    "Maneuver Options: Disarming Attack (Str.)": ClassEnrichers.Fighter.ManeuverDisarmingAttack,
    "Maneuver Options: Disarming Attack": ClassEnrichers.Fighter.ManeuverDisarmingAttack,
    "Maneuver Options: Distracting Strike": ClassEnrichers.Fighter.ManeuverDistractingStrike,
    "Maneuver Options: Evasive Footwork": ClassEnrichers.Fighter.ManeuverEvasiveFootwork,
    "Maneuver Options: Feinting Attack": ClassEnrichers.Fighter.ManeuverFeintingAttack,
    "Maneuver Options: Goading Attack (Str.)": ClassEnrichers.Fighter.ManeuverGoadingAttack,
    "Maneuver Options: Goading Attack": ClassEnrichers.Fighter.ManeuverGoadingAttack,
    "Maneuver Options: Grappling Strike": ClassEnrichers.Fighter.ManeuverGrapplingStrike,
    "Maneuver Options: Lunging Attack": ClassEnrichers.Fighter.ManeuverLungingAttack,
    "Maneuver Options: Lunging Dash": ClassEnrichers.Fighter.ManeuverLungingAttack,
    "Maneuver Options: Maneuvering Attack": ClassEnrichers.Fighter.ManeuverManeuveringAttack,
    "Maneuver Options: Menacing Attack (Str.)": ClassEnrichers.Fighter.ManeuverMenacingAttack,
    "Maneuver Options: Menacing Attack": ClassEnrichers.Fighter.ManeuverMenacingAttack,
    "Maneuver Options: Parry (Str.)": ClassEnrichers.Fighter.ManeuverParry,
    "Maneuver Options: Parry": ClassEnrichers.Fighter.ManeuverParry,
    "Maneuver Options: Precision Attack": ClassEnrichers.Fighter.ManeuverPrecisionAttack,
    "Maneuver Options: Pushing Attack (Str.)": ClassEnrichers.Fighter.ManeuverPushingAttack,
    "Maneuver Options: Pushing Attack": ClassEnrichers.Fighter.ManeuverPushingAttack,
    "Maneuver Options: Quick Toss": ClassEnrichers.Fighter.ManeuverQuickToss,
    "Maneuver Options: Rally": ClassEnrichers.Fighter.ManeuverRally,
    "Maneuver Options: Riposte": ClassEnrichers.Fighter.ManeuverRiposte,
    "Maneuver Options: Sweeping Attack": ClassEnrichers.Fighter.ManeuverSweepingAttack,
    "Maneuver Options: Tactical Assessment": ClassEnrichers.Fighter.ManeuverTacticalAssessment,
    "Maneuver Options: Trip Attack (Str.)": ClassEnrichers.Fighter.ManeuverTripAttack,
    "Maneuver Options: Trip Attack": ClassEnrichers.Fighter.ManeuverTripAttack,
    "Maneuver Options": GenericEnrichers.None,
    "Maneuvers: Ambush": ClassEnrichers.Fighter.ManeuverAmbush,
    "Maneuvers: Bait and Switch": ClassEnrichers.Fighter.ManeuverBaitAndSwitch,
    "Maneuvers: Brace": ClassEnrichers.Fighter.ManeuverBrace,
    "Maneuvers: Commander's Strike": ClassEnrichers.Fighter.ManeuverCommandersStrike,
    "Maneuvers: CommandingPresence": ClassEnrichers.Fighter.ManeuverCommandingPresence,
    "Maneuvers: Disarming Attack (Str.)": ClassEnrichers.Fighter.ManeuverDisarmingAttack,
    "Maneuvers: Disarming Attack": ClassEnrichers.Fighter.ManeuverDisarmingAttack,
    "Maneuvers: Distracting Strike": ClassEnrichers.Fighter.ManeuverDistractingStrike,
    "Maneuvers: Evasive Footwork": ClassEnrichers.Fighter.ManeuverEvasiveFootwork,
    "Maneuvers: Feinting Attack": ClassEnrichers.Fighter.ManeuverFeintingAttack,
    "Maneuvers: Goading Attack (Str.)": ClassEnrichers.Fighter.ManeuverGoadingAttack,
    "Maneuvers: Goading Attack": ClassEnrichers.Fighter.ManeuverGoadingAttack,
    "Maneuvers: Grappling Strike": ClassEnrichers.Fighter.ManeuverGrapplingStrike,
    "Maneuvers: Lunging Attack": ClassEnrichers.Fighter.ManeuverLungingAttack,
    "Maneuvers: Lunging Dash": ClassEnrichers.Fighter.ManeuverLungingAttack,
    "Maneuvers: Maneuvering Attack": ClassEnrichers.Fighter.ManeuverManeuveringAttack,
    "Maneuvers: Menacing Attack (Str.)": ClassEnrichers.Fighter.ManeuverMenacingAttack,
    "Maneuvers: Menacing Attack": ClassEnrichers.Fighter.ManeuverMenacingAttack,
    "Maneuvers: Parry (Str.)": ClassEnrichers.Fighter.ManeuverParry,
    "Maneuvers: Parry": ClassEnrichers.Fighter.ManeuverParry,
    "Maneuvers: Precision Attack": ClassEnrichers.Fighter.ManeuverPrecisionAttack,
    "Maneuvers: Pushing Attack (Str.)": ClassEnrichers.Fighter.ManeuverPushingAttack,
    "Maneuvers: Pushing Attack": ClassEnrichers.Fighter.ManeuverPushingAttack,
    "Maneuvers: Quick Toss": ClassEnrichers.Fighter.ManeuverQuickToss,
    "Maneuvers: Rally": ClassEnrichers.Fighter.ManeuverRally,
    "Maneuvers: Riposte": ClassEnrichers.Fighter.ManeuverRiposte,
    "Maneuvers: Sweeping Attack": ClassEnrichers.Fighter.ManeuverSweepingAttack,
    "Maneuvers: Tactical Assessment": ClassEnrichers.Fighter.ManeuverTacticalAssessment,
    "Maneuvers: Trip Attack (Str.)": ClassEnrichers.Fighter.ManeuverTripAttack,
    "Maneuvers: Trip Attack": ClassEnrichers.Fighter.ManeuverTripAttack,
    "Maneuvers": GenericEnrichers.None,
    "Metamagic Options": ClassEnrichers.Sorcerer.MetamagicOptions,
    "Mystic Arcanum (Level 8 Spell)": GenericEnrichers.None,
    "Pact Boon: Pact of the Chain": ClassEnrichers.Warlock.PactOfTheChain,
    "Pact Boon: Pact of the Talisman": ClassEnrichers.Warlock.PactBoonPactOfTheTalisman,
    "Pact Magic": ClassEnrichers.Shared.PactMagic,
    "Potent Cantrip": ClassEnrichers.Shared.PotentCantrip,
    "Psionic Power: Psi-Bolstered Knack": ClassEnrichers.Rogue.PsiBolsteredKnack,
    "Psionic Power: Psi-Powered Leap": ClassEnrichers.Fighter.PsiPoweredLeap,
    "Psionic Power: Psionic Strike": ClassEnrichers.Fighter.PsionicStrike,
    "Psionic Power: Psychic Whispers": ClassEnrichers.Rogue.PsychicWhispers,
    "Psionic Power: Recovery": ClassEnrichers.Shared.PsionicPowerRecovery,
    "Psionic Power: Telekinetic Movement": ClassEnrichers.Fighter.TelekineticMovement,
    "Psionic Power: Telekinetic Thrust": ClassEnrichers.Fighter.TelekineticThrust,
    "Psionic Power": ClassEnrichers.Shared.PsionicPower,
    "Psychic Blade": ClassEnrichers.Rogue.PsychicBlade,
    "Psychic Blades": GenericEnrichers.None,
    "Rage": ClassEnrichers.Barbarian.Rage,
    "Reckless Attack": GenericEnrichers.RecklessAttack,
    "Sacred Weapon": ClassEnrichers.Paladin.SacredWeapon,
    "Sneak Attack: Poison (Envenom)": ClassEnrichers.Rogue.SneakAttackPoisonEnvenom,
    "Sneak Attack: Supreme Sneak (Cost: 1d6)": ClassEnrichers.Rogue.SneakAttackSupremeSneak,
    "Sorcery Points": ClassEnrichers.Sorcerer.SorceryPoints,
    "Soul Blades: Homing Strikes": ClassEnrichers.Rogue.SoulBladesHomingStrikes,
    "Soul Blades: Psychic Teleportation": ClassEnrichers.Rogue.SoulBladesPsychicTeleportation,
    "Soul Blades": ClassEnrichers.Rogue.SoulBlades,
    "Spell-Refueling Ring (Reaction)": ItemEnrichers.SpellRefuelingRingReaction,
    "Storm Aura: Desert": ClassEnrichers.Barbarian.StormAuraDesert,
    "Storm Aura: Sea": ClassEnrichers.Barbarian.StormAuraSea,
    "Storm Aura: Tundra": ClassEnrichers.Barbarian.StormAuraTundra,
    "Storm Rune": ClassEnrichers.Fighter.StormRune,
    "Storm Soul: Dessert": ClassEnrichers.Barbarian.StormSoul,
    "Storm Soul: Sea": ClassEnrichers.Barbarian.StormSoul,
    "Storm Soul: Tundra - Freeze Water": ClassEnrichers.Barbarian.StormSoulTundraFreezeWater,
    "Storm Soul: Tundra": ClassEnrichers.Barbarian.StormSoul,
    "Tokens of the Departed: Sneak Attack": ClassEnrichers.Rogue.WailsFromTheGrave,
    "Unarmed Strike": GenericEnrichers.UnarmedStrike,
    "Unarmored Defense": ClassEnrichers.Shared.UnarmoredDefense,
    "Unarmored Movement": ClassEnrichers.Shared.UnarmoredMovement,
    "Uncanny Dodge": GenericEnrichers.UncannyDodge,
  };

  FALLBACK_ENRICHERS = {
    Generic: ClassEnrichers.Generic,
  };

}
