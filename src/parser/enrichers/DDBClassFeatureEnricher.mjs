import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin.mjs";
import { ClassEnrichers, GenericEnrichers } from "./_module.mjs";

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

  NAME_HINTS_2014 = {
    "Channel Divinity: Sacred Weapon": "Sacred Weapon",
    "Lay on Hands Pool": "Lay On Hands: Healing Pool",
  };

  NAME_HINTS = {
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
    "Cloak of Shadows": "Channel Divinity: Cloak of Shadows",
  };

  ENRICHERS = {
    None: GenericEnrichers.None,
    Generic: ClassEnrichers.Generic,
    "Abjure Foes": ClassEnrichers.Paladin.AbjureFoes,
    "Action Surge": ClassEnrichers.Fighter.ActionSurge,
    "Ancestral Protectors": ClassEnrichers.Barbarian.AncestralProtectors,
    "Arcane Propulsion Armor Gauntlet": ClassEnrichers.Artificer.ArcanePropulsionArmorGauntlet,
    "Arcane Recovery": ClassEnrichers.Wizard.ArcaneRecovery,
    "Arcane Ward": ClassEnrichers.Wizard.ArcaneWard,
    "Archdruid": ClassEnrichers.Druid.Archdruid,
    "Arms of the Astral Self (DEX/STR)": ClassEnrichers.Monk.ArmsOfTheAstralSelfPhysicalAttack,
    "Arms of the Astral Self (WIS)": ClassEnrichers.Monk.ArmsOfTheAstralSelfWisAttack,
    "Arms of the Astral Self: Summon": ClassEnrichers.Monk.ArmsOfTheAstralSelfSummon,
    "Arms of the Astral Self": ClassEnrichers.Monk.ArmsOfTheAstralSelf,
    "Aspect of the Beast: Bear": ClassEnrichers.Barbarian.AspectOfTheBeastBear,
    "Aspect of the Wilds": ClassEnrichers.Barbarian.AspectOfTheWilds,
    "Aura of Alacrity": ClassEnrichers.Generic.AuraOf,
    "Aura of Courage": ClassEnrichers.Generic.AuraOf,
    "Aura Of Courage": ClassEnrichers.Generic.AuraOf,
    "Aura of Hate": ClassEnrichers.Paladin.AuraOfHate,
    "Aura of Protection": ClassEnrichers.Generic.AuraOf,
    "Aura Of Protection": ClassEnrichers.Generic.AuraOf,
    "Aura of Warding": ClassEnrichers.Generic.AuraOf,
    "Aura of": ClassEnrichers.Generic.AuraOf,
    "Avenging Angel": ClassEnrichers.Paladin.AvengingAngel,
    "Awakened Astral Self": ClassEnrichers.Monk.AwakenedAstralSelf,
    "Bardic Inspiration": ClassEnrichers.Bard.BardicInspiration,
    "Bastion of Law": ClassEnrichers.Sorcerer.BastionOfLaw,
    "Battering Roots": ClassEnrichers.Barbarian.BatteringRoots,
    "Beguiling Magic": ClassEnrichers.Bard.BeguilingMagic,
    "Beguiling Twist": ClassEnrichers.Ranger.BeguilingTwist,
    "Bend Luck": ClassEnrichers.Sorcerer.BendLuck,
    "Blessed Healer": ClassEnrichers.Cleric.BlessedHealer,
    "Blessed Strikes": ClassEnrichers.Cleric.BlessedStrikes,
    "Blessed Strikes: Divine Strike": ClassEnrichers.Cleric.BlessedStrikesDivineStrike,
    "Blessing of the Trickster": ClassEnrichers.Cleric.BlessingOfTheTrickster,
    "Blighted Shape": ClassEnrichers.Druid.BlightedShape,
    "Branches of the Tree": ClassEnrichers.Barbarian.BranchesOfTheTree,
    "Brutal Critical": ClassEnrichers.Barbarian.BrutalCritical,
    "Brutal Strike": ClassEnrichers.Barbarian.BrutalStrike,
    "Celestial Resilience": ClassEnrichers.Warlock.CelestialResilience,
    "Celestial Revelation (Radiant Soul)": GenericEnrichers.CelestialRevelationRadiantSoul,
    "Channel Divinity: Cloak of Shadows": ClassEnrichers.Cleric.ChannelDivinityCloakOfShadows,
    "Channel Divinity: Preserve Life": ClassEnrichers.Cleric.ChannelDivinityPreserveLife,
    "Channel Divinity: Radiance of the Dawn": ClassEnrichers.Cleric.ChannelDivinityRadianceOfTheDawn,
    "Channel Divinity": ClassEnrichers.Shared.ChannelDivinity,
    "Circle Forms": ClassEnrichers.Druid.CircleForms,
    "Clairvoyant Combatant": ClassEnrichers.Warlock.ClairvoyantCombatant,
    "Clockwork Cavalcade": ClassEnrichers.Sorcerer.ClockworkCavalcade,
    "Combat Inspiration": ClassEnrichers.Bard.CombatInspiration,
    "Combat Superiority": ClassEnrichers.Fighter.CombatSuperiority,
    "Corona of Light": ClassEnrichers.Cleric.CoronaOfLight,
    "Cosmic Omen": ClassEnrichers.Druid.CosmicOmen,
    "Create Thrall": ClassEnrichers.Warlock.CreateThrall,
    "Cunning Action": ClassEnrichers.Rogue.CunningAction,
    "Cunning Strike": ClassEnrichers.Rogue.CunningStrike,
    "Cutting Words": ClassEnrichers.Bard.CuttingWords,
    "Dark One's Blessing": ClassEnrichers.Warlock.DarkOnesBlessing,
    "Dark One's Own Luck": ClassEnrichers.Warlock.DarkOnesOwnLuck,
    "Dazzling Footwork": ClassEnrichers.Bard.DazzlingFootwork,
    "Death Strike": ClassEnrichers.Rogue.DeathStrike,
    "Defensive Tactics": ClassEnrichers.Ranger.DefensiveTactics,
    "Defile Ground: Move Corruption": ClassEnrichers.Druid.DefileGroundMoveCorruption,
    "Defile Ground": ClassEnrichers.Druid.DefileGround,
    "Deflect Attack: Redirect Attack": ClassEnrichers.Monk.DeflectAttackRedirectAttack,
    "Deflect Attack": ClassEnrichers.Monk.DeflectAttack,
    "Deflect Attacks": ClassEnrichers.Monk.DeflectAttacks,
    "Deflect Energy": ClassEnrichers.Monk.DeflectEnergy,
    "Deflect Missiles Attack": ClassEnrichers.Monk.DeflectMissilesAttack,
    "Deflect Missiles": ClassEnrichers.Monk.DeflectMissiles,
    "Devious Strikes": ClassEnrichers.Rogue.DeviousStrikes,
    "Diamond Soul": ClassEnrichers.Monk.DiamondSoul,
    "Disciple of Life": ClassEnrichers.Cleric.DiscipleOfLife,
    "Disciplined Survivor": ClassEnrichers.Monk.DisciplinedSurvivor,
    "Divine Intervention": ClassEnrichers.Cleric.DivineIntervention,
    "Divine Order: Thaumaturge": ClassEnrichers.Cleric.DivineOrderThaumaturge,
    "Draconic Resilience": ClassEnrichers.Sorcerer.DraconicResilience,
    "Dragon Wings": ClassEnrichers.Sorcerer.DragonWings,
    "Drake Companion": ClassEnrichers.Ranger.DrakeCompanion,
    "Dread Ambusher": ClassEnrichers.Ranger.DreadAmbusher,
    "Dreadful Strike: Mass Fear": ClassEnrichers.Ranger.DreadfulStrikeMassFear,
    "Dreadful Strike: Sudden Strike": ClassEnrichers.Ranger.DreadfulStrikeSuddenStrike,
    "Dreadful Strike": ClassEnrichers.Ranger.DreadfulStrike,
    "Dreadful Strikes": ClassEnrichers.Ranger.DreadfulStrikes,
    "Elder Champion": ClassEnrichers.Paladin.ElderChampion,
    "Eldritch Cannon: Flamethrower": ClassEnrichers.Artificer.EldritchCannonFlamethrower,
    "Eldritch Cannon: Force Ballista": ClassEnrichers.Artificer.EldritchCannonForceBallista,
    "Eldritch Cannon: Protector": ClassEnrichers.Artificer.EldritchCannonProtector,
    "Eldritch Invocations: Ghostly Gaze": ClassEnrichers.Warlock.GhostlyGaze,
    "Eldritch Invocations: Lifedrinker": ClassEnrichers.Warlock.InvocationLifedrinker,
    "Eldritch Invocations: Pact of the Blade": ClassEnrichers.Warlock.InvocationPactOfTheBlade,
    "Eldritch Master": ClassEnrichers.Warlock.EldritchMaster,
    "Eldritch Strike": ClassEnrichers.Fighter.EldritchStrike,
    "Elemental Affinity": ClassEnrichers.Sorcerer.ElementalAffinity,
    "Elemental Attunement": ClassEnrichers.Monk.ElementalAttunement,
    "Elemental Burst": ClassEnrichers.Monk.ElementalBurst,
    "Elemental Epitome": ClassEnrichers.Monk.ElementalEpitome,
    "Elemental Fury: Primal Strike": ClassEnrichers.Druid.ElementalFuryPrimalStrike,
    "Embody Legends": ClassEnrichers.Paladin.EmbodyLegends,
    "Empowered Evocation": ClassEnrichers.Wizard.EmpoweredEvocation,
    "Empowered Strikes": ClassEnrichers.Monk.EmpoweredStrikes,
    "Empty Body": ClassEnrichers.Monk.EmptyBody,
    "Envenom Weapons": ClassEnrichers.Rogue.EnvenomWeapons,
    "Expert Divination": ClassEnrichers.Wizard.ExpertDivination,
    "Fast Hands": ClassEnrichers.Rogue.FastHands,
    "Fiendish Resilience": ClassEnrichers.Warlock.FiendishResilience,
    "Fighting Style: Interception": GenericEnrichers.FightingStyleInterception,
    "Fleet Step": ClassEnrichers.Monk.FleetStep,
    "Flurry of Blows: Addle": ClassEnrichers.Monk.FlurryOfBlowsAdditional,
    "Flurry of Blows: Push": ClassEnrichers.Monk.FlurryOfBlowsAdditional,
    "Flurry of Blows: Topple": ClassEnrichers.Monk.FlurryOfBlowsAdditional,
    "Font of Magic: Sorcery Points": ClassEnrichers.Sorcerer.FontOfMagicSorceryPoints,
    "Font of Magic": ClassEnrichers.Sorcerer.FontOfMagic,
    "Form of the Beast": ClassEnrichers.Barbarian.FormOfTheBeast,
    "Form of the Beast: Tail": ClassEnrichers.Barbarian.FormOfTheBeastWeapons,
    "Form of the Beast: Tail (reaction)": ClassEnrichers.Barbarian.FormOfTheBeastWeapons,
    "Form of the Beast: Claw": ClassEnrichers.Barbarian.FormOfTheBeastWeapons,
    "Form of the Beast: Bite": ClassEnrichers.Barbarian.FormOfTheBeastWeapons,
    "Frenzy": ClassEnrichers.Barbarian.Frenzy,
    "Full of Stars": ClassEnrichers.Druid.FullOfStars,
    "Genie's Vessel: Genie's Wrath (Dao)": ClassEnrichers.Warlock.GeniesVessel,
    "Genie's Vessel: Genie's Wrath (Djinni)": ClassEnrichers.Warlock.GeniesVessel,
    "Genie's Vessel: Genie's Wrath (Efreeti)": ClassEnrichers.Warlock.GeniesVessel,
    "Genie's Vessel: Genie's Wrath (Marid)": ClassEnrichers.Warlock.GeniesVessel,
    "Giant's Might": ClassEnrichers.Fighter.GiantsMight,
    "Glorious Defense": ClassEnrichers.Paladin.GloriousDefense,
    "Greater Divine Intervention": ClassEnrichers.Cleric.GreaterDivineIntervention,
    "Guardian Armor: Defensive Field": ClassEnrichers.Artificer.GuardianArmorDefensiveField,
    "Guided Strike": ClassEnrichers.Cleric.GuidedStrike,
    "Hand of Harm": ClassEnrichers.Monk.HandOfHarm,
    "Hand of Healing": ClassEnrichers.Monk.HandOfHealing,
    "Harness Divine Power": ClassEnrichers.Cleric.HarnessDivinePower,
    "Healing Light": ClassEnrichers.Warlock.HealingLight,
    "Heightened Focus": ClassEnrichers.Monk.HeightenedFocus,
    "Holy Nimbus": ClassEnrichers.Paladin.HolyNimbus,
    "Hound of Ill Omen": ClassEnrichers.Sorcerer.HoundOfIllOmen,
    "Hunter's Prey": ClassEnrichers.Ranger.HuntersPrey,
    "Hurl Through Hell": ClassEnrichers.Warlock.HurlThroughHell,
    "Hypnotic Gaze": ClassEnrichers.Wizard.HypnoticGaze,
    "Illusory Self": ClassEnrichers.Wizard.IllusorySelf,
    "Improved Blessed Strikes: Potent Spellcasting": ClassEnrichers.Cleric.ImprovedBlessedStrikesPotentSpellcasting,
    "Improved Brutal Strike": ClassEnrichers.Barbarian.ImprovedBrutalStrike,
    "Improved Circle Forms": ClassEnrichers.Druid.ImprovedCircleForms,
    "Improved Critical": ClassEnrichers.Fighter.ImprovedCritical,
    "Improved Duplicity": ClassEnrichers.Cleric.ImprovedDuplicity,
    "Improved Shadow Step": ClassEnrichers.Monk.ImprovedShadowStep,
    "Improved Warding Flare": ClassEnrichers.Cleric.ImprovedWardingFlare,
    "Innate Sorcery": ClassEnrichers.Sorcerer.InnateSorcery,
    "Inspiring Movement": ClassEnrichers.Bard.InspiringMovement,
    "Inspiring Smite": ClassEnrichers.Paladin.InspiringSmite,
    "Intimidating Presence": ClassEnrichers.Barbarian.IntimidatingPresence,
    "Invoke Duplicity": ClassEnrichers.Cleric.InvokeDuplicity,
    "Jack of All Trades": ClassEnrichers.Bard.JackOfAllTrades,
    "Ki": ClassEnrichers.Monk.Ki,
    "Land's Aid": ClassEnrichers.Druid.LandsAid,
    "Lay On Hands: Purify Poison": ClassEnrichers.Paladin.LayOnHandsPurifyPoison,
    "Lay on Hands": ClassEnrichers.Paladin.LayOnHands,
    "Lay On Hands": ClassEnrichers.Paladin.LayOnHands,
    "Living Legend": ClassEnrichers.Paladin.LivingLegend,
    "Lucky": GenericEnrichers.Lucky,
    "Lunar Form": ClassEnrichers.Druid.LunarForm,
    "Magical Cunning": ClassEnrichers.Warlock.MagicalCunning,
    "Maneuver: Ambush": ClassEnrichers.Fighter.ManeuverAmbush,
    "Maneuver: Bait and Switch": ClassEnrichers.Fighter.ManeuverBaitAndSwitch,
    "Maneuver: Brace": ClassEnrichers.Fighter.ManeuverBrace,
    "Maneuver: Disarming Attack (Str.)": ClassEnrichers.Fighter.ManeuverDisarmingAttack,
    "Maneuver: Distracting Strike": ClassEnrichers.Fighter.ManeuverDistractingStrike,
    "Maneuver: Evasive Footwork": ClassEnrichers.Fighter.ManeuverEvasiveFootwork,
    "Maneuver: Goading Attack (Str.)": ClassEnrichers.Fighter.ManeuverGoadingAttack,
    "Maneuver: Lunging Attack": ClassEnrichers.Fighter.ManeuverLungingAttack,
    "Maneuver: Lunging Dash": ClassEnrichers.Fighter.ManeuverLungingDash,
    "Maneuver: Maneuvering Attack": ClassEnrichers.Fighter.ManeuverManeuveringAttack,
    "Maneuver: Menacing Attack (Str.)": ClassEnrichers.Fighter.ManeuverMenacingAttack,
    "Maneuver: Parry (Str.)": ClassEnrichers.Fighter.ManeuverParry,
    "Maneuver: Precision Attack": ClassEnrichers.Fighter.ManeuverPrecisionAttack,
    "Maneuver: Pushing Attack (Str.)": ClassEnrichers.Fighter.ManeuverPushingAttack,
    "Maneuver: Rally": ClassEnrichers.Fighter.ManeuverRally,
    "Maneuver: Riposte": ClassEnrichers.Fighter.ManeuverRiposte,
    "Maneuver: Sweeping Attack": ClassEnrichers.Fighter.ManeuverSweepingAttack,
    "Maneuver: Tactical Assessment": ClassEnrichers.Fighter.ManeuverTacticalAssessment,
    "Maneuver: Trip Attack (Str.)": ClassEnrichers.Fighter.ManeuverTripAttack,
    "Mantle of Inspiration": ClassEnrichers.Bard.MantleOfInspiration,
    "Metamagic Options": ClassEnrichers.Sorcerer.MetamagicOptions,
    "Mindless Rage": ClassEnrichers.Barbarian.MindlessRage,
    "Momentary Stasis": ClassEnrichers.Wizard.MomentaryStasis,
    "Monk's Focus": ClassEnrichers.Monk.MonksFocus,
    "Moonlight Step": ClassEnrichers.Druid.MoonlightStep,
    "Mystic Arcanum (Level 8 Spell)": GenericEnrichers.None,
    "Natural Recovery": ClassEnrichers.Druid.NaturalRecovery,
    "Nature Magician": ClassEnrichers.Druid.NatureMagician,
    "Nature's Ward": ClassEnrichers.Druid.NaturesWard,
    "Open Hand Technique": ClassEnrichers.Monk.OpenHandTechnique,
    "Overchannel": ClassEnrichers.Wizard.Overchannel,
    "Pact Boon: Pact of the Talisman": ClassEnrichers.Warlock.PactBoonPactOfTheTalisman,
    "Patient Defense": ClassEnrichers.Monk.PatientDefense,
    "Peerless Athlete": ClassEnrichers.Paladin.PeerlessAthlete,
    "Perfect Focus": ClassEnrichers.Monk.PerfectFocus,
    "Persistent Rage": ClassEnrichers.Barbarian.PersistentRage,
    "Physician's Touch": ClassEnrichers.Monk.PhysiciansTouch,
    "Power of the Wilds": ClassEnrichers.Barbarian.PowerOfTheWilds,
    "Primal Companion: Restore Beast": ClassEnrichers.Ranger.PrimalCompanionRestoreBeast,
    "Primal Companion: Summon": ClassEnrichers.Ranger.PrimalCompanionSummon,
    "Primal Companion": ClassEnrichers.Ranger.PrimalCompanion,
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
    "Quickened Healing": ClassEnrichers.Monk.QuickenedHealing,
    "Radiant Soul": ClassEnrichers.Warlock.RadiantSoul,
    "Radiant Strikes": ClassEnrichers.Paladin.RadiantStrikes,
    "Rage of the Wilds": ClassEnrichers.Barbarian.RageOfTheWilds,
    "Rage": ClassEnrichers.Barbarian.Rage,
    "Raging Storm: Desert": ClassEnrichers.Barbarian.RagingStormDesert,
    "Raging Storm: Sea": ClassEnrichers.Barbarian.RagingStormSea,
    "Raging Storm: Tundra": ClassEnrichers.Barbarian.RagingStormTundra,
    "Reckless Attack": GenericEnrichers.RecklessAttack,
    "Regain Bardic Inspiration": ClassEnrichers.Bard.RegainBardicInspiration,
    "Relentless Avenger": ClassEnrichers.Paladin.RelentlessAvenger,
    "Relentless Rage": ClassEnrichers.Barbarian.RelentlessRage,
    "Relentless": ClassEnrichers.Fighter.Relentless,
    "Remarkable Athlete": ClassEnrichers.Fighter.RemarkableAthlete,
    "Rend Mind": ClassEnrichers.Rogue.RendMind,
    "Retaliation": ClassEnrichers.Barbarian.Retaliation,
    "Revelation in Flesh": ClassEnrichers.Sorcerer.RevelationInFlesh,
    "Sacred Weapon": ClassEnrichers.Paladin.SacredWeapon,
    "Sear Undead": ClassEnrichers.Cleric.SearUndead,
    "Searing Vengeance": ClassEnrichers.Warlock.SearingVengeance,
    "Second Wind": ClassEnrichers.Fighter.SecondWind,
    "Shadow Arts": ClassEnrichers.Monk.ShadowArts,
    "Shadowy Dodge": ClassEnrichers.Ranger.ShadowyDodge,
    "Shielding Storm": ClassEnrichers.Barbarian.ShieldingStorm,
    "Slow Fall": ClassEnrichers.Monk.SlowFall,
    "Smite of Protection": ClassEnrichers.Paladin.SmiteOfProtection,
    "Sneak Attack: Poison (Envenom)": ClassEnrichers.Rogue.SneakAttackPoisonEnvenom,
    "Sneak Attack: Supreme Sneak (Cost: 1d6)": ClassEnrichers.Rogue.SneakAttackSupremeSneak,
    "Sneak Attack": ClassEnrichers.Rogue.SneakAttack,
    "Song of Rest": ClassEnrichers.Bard.SongOfRest,
    "Sorcerous Restoration": ClassEnrichers.Sorcerer.SorcerousRestoration,
    "Sorcery Incarnate": ClassEnrichers.Sorcerer.SorceryIncarnate,
    "Sorcery Points": ClassEnrichers.Sorcerer.SorceryPoints,
    "Soul Blades: Homing Strikes": ClassEnrichers.Rogue.SoulBladesHomingStrikes,
    "Soul Blades: Psychic Teleportation": ClassEnrichers.Rogue.SoulBladesPsychicTeleportation,
    "Soul Blades": ClassEnrichers.Rogue.SoulBlades,
    "Soul of Vengeance": ClassEnrichers.Paladin.SoulOfVengeance,
    "Stalker's Flurry": ClassEnrichers.Ranger.StalkersFlurry,
    "Starry Form": ClassEnrichers.Druid.StarryForm,
    "Steel Defender": ClassEnrichers.Artificer.SteelDefender,
    "Steps of the Fey": ClassEnrichers.Warlock.StepsOfTheFey,
    "Storm Aura: Desert": ClassEnrichers.Barbarian.StormAuraDesert,
    "Storm Aura: Sea": ClassEnrichers.Barbarian.StormAuraSea,
    "Storm Aura: Tundra": ClassEnrichers.Barbarian.StormAuraTundra,
    "Storm Soul: Dessert": ClassEnrichers.Barbarian.StormSoul,
    "Storm Soul: Sea": ClassEnrichers.Barbarian.StormSoul,
    "Storm Soul: Tundra - Freeze Water": ClassEnrichers.Barbarian.StormSoulTundraFreezeWater,
    "Storm Soul: Tundra": ClassEnrichers.Barbarian.StormSoul,
    "Stormborn": ClassEnrichers.Druid.Stormborn,
    "Stride of the Elements": ClassEnrichers.Monk.StrideOfTheElements,
    "Stunning Strike": ClassEnrichers.Monk.StunningStrike,
    "Summon Wildfire Spirit: Command": ClassEnrichers.Druid.SummonWildfireSpiritCommand,
    "Summon Wildfire Spirit": ClassEnrichers.Druid.SummonWildfireSpirit,
    "Superior Critical": ClassEnrichers.Fighter.SuperiorCritical,
    "Superior Defense": ClassEnrichers.Monk.SuperiorDefense,
    "Superior Hunter's Defense": ClassEnrichers.Ranger.SuperiorHuntersDefense,
    "Superior Hunter's Prey": ClassEnrichers.Ranger.SuperiorHuntersPrey,
    "Superior Inspiration": ClassEnrichers.Bard.SuperiorInspiration,
    "Supreme Sneak": ClassEnrichers.Rogue.SupremeSneak,
    "Survivor": ClassEnrichers.Fighter.Survivor,
    "Tactial Master": ClassEnrichers.Fighter.TactialMaster,
    "Tactical Mind": ClassEnrichers.Fighter.TacticalMind,
    "Tandem Footwork": ClassEnrichers.Bard.TandemFootwork,
    "Telekinetic Adept": ClassEnrichers.Fighter.TelekineticAdept,
    "Telekinetic Master": ClassEnrichers.Fighter.TelekineticMaster,
    "Temporary Hit Points": ClassEnrichers.Ranger.TemporaryHitPoints,
    "The Third Eye": ClassEnrichers.Wizard.TheThirdEye,
    "Tireless": ClassEnrichers.Ranger.Tireless,
    "Tongue of the Sun and Moon": ClassEnrichers.Monk.TongueOfTheSunAndMoon,
    "Trance of Order": ClassEnrichers.Sorcerer.TranceOfOrder,
    "Travel along the Tree": ClassEnrichers.Barbarian.TravelAlongTheTree,
    "Unarmed Strike": GenericEnrichers.UnarmedStrike,
    "Unarmored Defense": ClassEnrichers.Shared.UnarmoredDefense,
    "Unarmored Movement": ClassEnrichers.Shared.UnarmoredMovement,
    "Unbreakable Majesty": ClassEnrichers.Bard.UnbreakableMajesty,
    "Uncanny Dodge": GenericEnrichers.UncannyDodge,
    "Uncanny Metabolism": ClassEnrichers.Monk.UncannyMetabolism,
    "Undying Sentinel": ClassEnrichers.Paladin.UndyingSentinel,
    "Use Magic Device: Charges": ClassEnrichers.Rogue.UseMagicDeviceCharges,
    "Use Magic Device: Scroll": ClassEnrichers.Rogue.UseMagicDeviceScroll,
    "Use Magic Device": ClassEnrichers.Rogue.UseMagicDevice,
    "Vitality of the Tree": ClassEnrichers.Barbarian.VitalityOfTheTree,
    "Vow of Enmity": ClassEnrichers.Paladin.VowOfEnmity,
    "War Bond": ClassEnrichers.Fighter.WarBond,
    "War God's Blessing": ClassEnrichers.Cleric.WarGodsBlessing,
    "War Priest": ClassEnrichers.Cleric.WarPriest,
    "Warping Implosion": ClassEnrichers.Sorcerer.WarpingImplosion,
    "Wholeness of Body": ClassEnrichers.Monk.WholenessOfBody,
    "Wild Magic Surge": ClassEnrichers.Sorcerer.WildMagicSurge,
    "Wild Resurgence": ClassEnrichers.Druid.WildResurgence,
    "Wild Shape": ClassEnrichers.Druid.WildShape,
    "Wrath of the Sea": ClassEnrichers.Druid.WrathOfTheSea,
    "Wrath of the Storm": ClassEnrichers.Cleric.WrathOfTheStorm,
    "Psychic Veil": ClassEnrichers.Rogue.PsychicVeil,
    "Reliable Talent": ClassEnrichers.Rogue.ReliableTalent,
    "Bladesong": ClassEnrichers.Wizard.Bladesong,
    "Pact Magic": ClassEnrichers.Shared.PactMagic,
    "Twinkling Constellations": ClassEnrichers.Druid.TwinklingConstellations,
    "Elemental Fury: Potent Spellcasting": ClassEnrichers.Druid.ElementalFuryPotentSpellcasting,
    "Evasion": ClassEnrichers.Rogue.Evasion,
    "Fire Rune": ClassEnrichers.Fighter.FireRune,
    "Frost Rune": ClassEnrichers.Fighter.FrostRune,
    "Cloud Rune": ClassEnrichers.Fighter.CloudRune,
    "Hill Rune": ClassEnrichers.Fighter.HillRune,
    "Stone Rune": ClassEnrichers.Fighter.StoneRune,
    "Storm Rune": ClassEnrichers.Fighter.StormRune,
    "Rune Carver": GenericEnrichers.None,
    "Potent Cantrip": ClassEnrichers.Shared.PotentCantrip,
    "Sculpt Spells": ClassEnrichers.Wizard.SculptSpells,
    "Ghost Walk": ClassEnrichers.Rogue.GhostWalk,
    "Wails from the Grave": ClassEnrichers.Rogue.WailsFromTheGrave,
    "Tokens of the Departed": ClassEnrichers.Rogue.TokensOfTheDeparted,
    "Tokens of the Departed: Sneak Attack": ClassEnrichers.Rogue.WailsFromTheGrave,
    "Foe Slayer": ClassEnrichers.Ranger.FoeSlayer,
    "Steady Aim": ClassEnrichers.Rogue.SteadyAim,
    "Demiurgic Colossus": ClassEnrichers.Barbarian.DemiurgicColossus,
    "Giant's Havoc": ClassEnrichers.Barbarian.GiantsHavoc,
    "Giant's Havoc: Giant Stature": ClassEnrichers.Barbarian.GiantsHavocGiantStature,
    "Giant's Havoc: Crushing Throw": ClassEnrichers.Barbarian.GiantsHavocCrushingThrow,
  };

  FALLBACK_ENRICHERS = {
    Generic: ClassEnrichers.Generic,
  };

}
