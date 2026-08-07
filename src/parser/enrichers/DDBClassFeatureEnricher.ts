import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin";
import * as ClassEnrichers from "./class/_module";
import * as GenericEnrichers from "./generic/_module";
import * as ItemEnrichers from "./item/_module";
import { DDBSources, utils } from "../../lib/_module";
import type DDBEnricherData from "./data/DDBEnricherData";

// ClassEnrichers mixes per-class namespaces with the bare top-level Generic constructor.
type TClassEnricherConstructor = EnricherConstructor<DDBClassFeatureEnricher>;
type TClassEnricherLookup = Record<string, Record<string, TClassEnricherConstructor | undefined> | TClassEnricherConstructor | undefined>;

export default class DDBClassFeatureEnricher extends DDBEnricherFactoryMixin {
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
      ddbActionType: "class",
    });
  }

  get isParentClass2014(): boolean {
    const parentDefinition = this.ddbParser._parent?.definition as (IDDBClassFeatureDefinition & IDDBFeatureDefinitionKindFields) | undefined;
    const klass = this.ddbParser.ddbData.character.classes.find((klass) =>
      (parentDefinition && parentDefinition.classId
        && (klass.definition.id === parentDefinition.classId || klass.subclassDefinition?.id === parentDefinition.classId))
      || (parentDefinition && parentDefinition.className && klass.definition.name === parentDefinition.className
        && ((!parentDefinition.subclassName || parentDefinition.subclassName === "")
          || (parentDefinition.subclassName && klass.subclassDefinition?.name === parentDefinition.subclassName))
      ),
    );
    return klass?.definition?.sources?.every((s) => DDBSources.is2014Source(s)) ?? false;
  }

  get className(): string | undefined {
    return this.ddbParser.klass;
  }

  get subclassName(): string | undefined {
    return this.ddbParser.subKlass;
  }

  _defaultClassLoader(): DDBEnricherData | null {
    if (!this.className || !this.hintName) {
      return null;
    }
    const classHintName = utils.pascalCase(this.className);
    const featName = utils.pascalCase(this.hintName);
    const group = (ClassEnrichers as TClassEnricherLookup)[classHintName];
    const Enricher = typeof group === "function" ? undefined : group?.[featName];
    if (!Enricher) {
      return null;
    }
    return new Enricher({
      ddbEnricher: this,
    });
  }

  _defaultNameLoader(): DDBEnricherData | null {
    const classHintName = utils.pascalCase(this.className ?? "Unknown Class");
    // mixed one- and two-deep registry; the guard keeps the two-deep access safe
    const enricherGroups = this.ENRICHERS as Record<string, Record<string, TClassEnricherConstructor>>;
    const hintName = this.hintName;
    if (!hintName || !enricherGroups?.[classHintName]?.[hintName]) {
      return this._defaultClassLoader();
    }
    return new enricherGroups[classHintName][hintName]({
      ddbEnricher: this,
    });
  }

  NAME_HINTS_2014: Record<string, string> = {
    "Channel Divinity: Sacred Weapon": "Sacred Weapon",
    "Lay on Hands Pool": "Lay On Hands: Healing Pool",
  };

  NAME_HINTS: Record<string, string> = {
    "Convert Sorcery Points": "Font of Magic",
    "Liar's Dice [Maneuver]": "Liar's Dice",
    // Blood Hunter curse/boon choice features resolve to their base enricher
    "Blood Curses: Blood Curse of Binding": "Blood Curse of Binding",
    "Blood Curses: Blood Curse of Bloated Agony": "Blood Curse of Bloated Agony",
    "Blood Curses: Blood Curse of Exposure": "Blood Curse of Exposure",
    "Blood Curses: Blood Curse of the Anxious": "Blood Curse of the Anxious",
    "Blood Curses: Blood Curse of the Eyeless": "Blood Curse of the Eyeless",
    "Blood Curses: Blood Curse of the Fallen Puppet": "Blood Curse of the Fallen Puppet",
    "Blood Curses: Blood Curse of the Marked": "Blood Curse of the Marked",
    "Blood Curses: Blood Curse of the Muddled Mind": "Blood Curse of the Muddled Mind",
    // Blood Hunter rite choice features resolve to their per-rite enricher
    "Crimson Rite: Rite of the Flame": "Rite of the Flame",
    "Crimson Rite: Rite of the Frozen": "Rite of the Frozen",
    "Crimson Rite: Rite of the Storm": "Rite of the Storm",
    "Crimson Rite: Rite of the Dead": "Rite of the Dead",
    "Crimson Rite: Rite of the Oracle": "Rite of the Oracle",
    "Crimson Rite: Rite of the Roar": "Rite of the Roar",
    // Illrigger boon choice feature shares the action's enricher
    "Interdict Boons: Abating Seal": "Abating Seal",
    // Gunslinger (TGC) subclass maneuvers; "Manuever" is a DDB data typo
    "Eagle Eye [Manuever]": "Eagle Eye",
    "Parting Shot [Maneuver]": "Parting Shot",
    "Magic Bullet [Maneuver]": "Magic Bullet",
    "Ricochet [Maneuver]": "Ricochet",
    "Deft Deflection [Maneuver]": "Deft Deflection",
    "Lay Down the Law [Maneuver]": "Lay Down the Law",
    "Font of Magic: Convert Spell Slots": "Font of Magic",
    "Font Of Magic": "Font of Magic",
    "Interception": "Fighting Style: Interception",
    "Preserve Life": "Channel Divinity: Preserve Life",
    // Cleric Astral Domain / Community Domain features share their action's enricher
    "Create Void": "Channel Divinity: Create Void",
    "Magnificent Feast": "Create Magnificent Feast",
    "Psychic Blades: Attack (DEX)": "Psychic Blade",
    "Psychic Blades: Attack (STR)": "Psychic Blade",
    "Psychic Blades: Attack": "Psychic Blade",
    "Psychic Blades": "Psychic Blade",
    "Psychic Blades: Homing Strikes": "Soul Blades: Homing Strikes",
    "Psychic Blades: Psychic Teleportation": "Soul Blades: Psychic Teleportation",
    "Psychic Teleportation": "Soul Blades: Psychic Teleportation",
    "Radiance of the Dawn": "Channel Divinity: Radiance of the Dawn",
    "Rage (Enter)": "Rage",
    // Path of the Glacier / Path of the Titan features merged with their rage-gated actions
    "Frostbite: Rage: Frostbite": "Frostbite",
    "Rage of the Giants: Rage: Rage of the Giants": "Rage of the Giants",
    // "War God's Blessing": "Channel Divinity: War God's Blessing",
    "Telekinetic Adept: Psi-Powered Leap": "Psionic Power: Psi-Powered Leap",
    "Telekinetic Adept: Telekinetic Thrust": "Psionic Power: Telekinetic Thrust",
    "Cloak of Shadows": "Channel Divinity: Cloak of Shadows",
    // "Banishing Arrow": "Arcane Shot Option",
    // "Beguiling Arrow": "Arcane Shot Option",
    "Bursting Arrow": "Arcane Shot Option",
    "Enfeebling Arrow": "Arcane Shot Option",
    // "Piercing Arrow": "Arcane Shot Option",
    // "Seeking Arrow": "Arcane Shot Option",
    "Shadow Arrow": "Arcane Shot Option",
    "Circle of the Land Spells": "Circle of the Spells",
    "Circle of the Moon Spells": "Circle of the Spells",
    "Circle of the Sea Spells": "Circle of the Spells",
    "Circle of Blood Spells": "Circle of the Spells",
    "Circle of the Old Ways Spells": "Circle of the Spells",
    "Circle of the Symbiote Spells": "Circle of the Spells",
    "Circle of Wicker Spells": "Circle of the Spells",
    "Circle of the Shepherd Spells": "Circle of the Spells",
    "Circle of the Forged Spells": "Circle of the Spells",
    "Circle of Cycles Spells": "Circle of the Spells",
    "Circle of Fenris Spells": "Circle of the Spells",
    "Circle of Symbiosis Spells": "Circle of the Spells",
    "Oath of Devotion Spells": "Paladin Oath Spells",
    "Oath of Glory Spells": "Paladin Oath Spells",
    "Oath of the Ancients Spells": "Paladin Oath Spells",
    "Oath of Vengeance Spells": "Paladin Oath Spells",
    "Oath of Castigation Spells": "Paladin Oath Spells",
    "Oath of Pestilence Spells": "Paladin Oath Spells",
    "Oath of Revelry Spells": "Paladin Oath Spells",
    "Oath of Slaughter Spells": "Paladin Oath Spells",
    "Oath of the Eldritch Hunt Spells": "Paladin Oath Spells",
    "Oath of the Guardian Spells": "Paladin Oath Spells",
    "Oath of Valhalla Spells": "Paladin Oath Spells",
    "Oath of Zeal Spells": "Paladin Oath Spells",
    "Genie Spells": "Paladin Oath Spells",
    "Fey Wanderer Spells": "Ranger Spells",
    "Fey Wanderer Magic": "Ranger Spells",
    "Gloom Stalker Spells": "Ranger Spells",
    "Gloom Stalker Magic": "Ranger Spells",
    "Monster Slayer Spells": "Ranger Spells",
    "Monster Slayer Magic": "Ranger Spells",
    "Green Reaper Spells": "Ranger Spells",
    "Horizon Walker Spells": "Ranger Spells",
    "Horizon Walker Magic": "Ranger Spells",
    "Primordial Archer Spells": "Ranger Spells",
    "Winter Walker Spells": "Ranger Spells",
    "Trail Warden Spells": "Ranger Spells",
    "Vermin Lord Spells": "Ranger Spells",
    "Grim Harbinger Spells": "Ranger Spells",
    "Hollow Warden Spells": "Ranger Spells",
    "Psionic Spells": "Sorcerer Extra Spells",
    "Clockwork Spells": "Sorcerer Extra Spells",
    "Draconic Spells": "Sorcerer Extra Spells",
    "Apocalyptic Spells": "Sorcerer Extra Spells",
    "Crimson Spells": "Sorcerer Extra Spells",
    "Spellfire Spells": "Sorcerer Extra Spells",
    "Haunted Spells": "Sorcerer Extra Spells",
    "Spirit Caller Spells": "Sorcerer Extra Spells",
    "Innate Darkness Spells": "Sorcerer Extra Spells",
    "Archfey Spells": "Warlock Extra Spells",
    "Celestial Spells": "Warlock Extra Spells",
    "Fiend Spells": "Warlock Extra Spells",
    "Great Old One Spells": "Warlock Extra Spells",
    "Feline Spells": "Warlock Extra Spells",
    "Trickster Spells": "Warlock Extra Spells",
    "Future You Spells": "Warlock Extra Spells",
    "Great Fool Spells": "Warlock Extra Spells",
    "Horned King Spells": "Warlock Extra Spells",
    "Coven Spells": "Warlock Extra Spells",
    "First Vampire Spells": "Warlock Extra Spells",
    "Undead Spells": "Warlock Extra Spells",
    "Alchemist Spells": "Artificer Spells",
    "Armorer Spells": "Artificer Spells",
    "Artillerist Spells": "Artificer Spells",
    "Battle Smith Spells": "Artificer Spells",
    "Forge Adept Spells": "Artificer Spells",
    "Reanimator Spells": "Artificer Spells",
    // "Elemental Disciplines: Clench of the North Wind": "Elemental Disciplines",
    // "Elemental Disciplines: Fangs of the Fire Snake": "Elemental Disciplines",
    // "Elemental Disciplines: Fist of Four Thunders": "Elemental Disciplines",
    // "Elemental Disciplines: Fist of Unbroken Air": "Elemental Disciplines",
    // "Elemental Disciplines: Gong of the Summit": "Elemental Disciplines",
    // "Elemental Disciplines: Rush of the Gale Spirits": "Elemental Disciplines",
    // "Elemental Disciplines: Shape the Flowing River": "Elemental Disciplines",
    // "Elemental Disciplines: Sweeping Cinder Strike": "Elemental Disciplines",
    // "Elemental Disciplines: Water Whip": "Elemental Disciplines",
  };

  NAME_HINT_INCLUDES: Record<string, string> = {
    "Metamagic:": "MetamagicGeneric",
    "Enchantments:": "EnchantmentsExtras",
    "Eldritch Invocations: Agonizing Blast": "Eldritch Invocations: Agonizing Blast",
    " Domain Spells": "Cleric Domain Spells",
    "Elemental Disciplines: ": "Elemental Disciplines",
    "Elemental Affinity (": "Elemental Affinity",
    "Divine Magic: ": "_DivineMagic",
    // "Additional Fighting Style:": "Additional Fighting Style Base",
  };

  // Mixed map: most keys are flat enricher constructors (looked up by feature hint),
  // but a few class keys (Paladin/Barbarian/Warlock) nest a per-feature sub-map, consumed
  // two-deep in _defaultNameLoader as `new this.ENRICHERS[classHintName][this.hintName]`.
  ENRICHERS: Record<string, TClassEnricherConstructor | Record<string, TClassEnricherConstructor>> = {
    Paladin: {
      "Elemental Strike": ClassEnrichers.Paladin.ElementalSmite,
    },
    Barbarian: {
      "Form of the Beast: Bite": ClassEnrichers.Barbarian.FormOfTheBeastWeapons,
      "Form of the Beast: Claw": ClassEnrichers.Barbarian.FormOfTheBeastWeapons,
      "Form of the Beast: Tail (reaction)": ClassEnrichers.Barbarian.FormOfTheBeastWeapons,
      "Form of the Beast: Tail": ClassEnrichers.Barbarian.FormOfTheBeastWeapons,
      "Form of the Beast": ClassEnrichers.Barbarian.FormOfTheBeast,
    },
    Warlock: {
      "Expanded Spell List": ClassEnrichers.Warlock.ExtraSpells,
    },
    None: GenericEnrichers.None,
    Generic: ClassEnrichers.Generic,
    MetamagicGeneric: ClassEnrichers.Sorcerer.MetamagicGeneric,
    "_DivineMagic": ClassEnrichers.Sorcerer._DivineMagic,
    // "Additional Fighting Style Base": FeatEnrichers.AdditionalFightingStyleBase,
    "Shove": GenericEnrichers.Shove,
    "Grapple": GenericEnrichers.Grapple,
    "Arcane Armor - Create Armor": ClassEnrichers.Artificer.ArcaneArmorCreateArmor,
    "Arcane Propulsion Armor Gauntlet": ClassEnrichers.Artificer.ArcanePropulsionArmorGauntlet,
    "Arcane Shot Option": ClassEnrichers.Fighter.ArcaneShotOption,
    "Arms of the Astral Self (DEX/STR)": ClassEnrichers.Monk.ArmsOfTheAstralSelfPhysicalAttack,
    "Arms of the Astral Self (WIS)": ClassEnrichers.Monk.ArmsOfTheAstralSelfWisAttack,
    "Arms of the Astral Self (Wis.)": ClassEnrichers.Monk.ArmsOfTheAstralSelfWisAttack,
    "Arms of the Astral Self (Wis)": ClassEnrichers.Monk.ArmsOfTheAstralSelfWisAttack,
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
    "EnchantmentsExtras": ClassEnrichers.Rogue.EnchantmentsExtras,
    "Eldritch Cannon: Flamethrower": ClassEnrichers.Artificer.EldritchCannonFlamethrower,
    "Eldritch Cannon: Force Ballista": ClassEnrichers.Artificer.EldritchCannonForceBallista,
    "Eldritch Cannon: Protector": ClassEnrichers.Artificer.EldritchCannonProtector,
    "Eldritch Invocations: Ghostly Gaze": ClassEnrichers.Warlock.GhostlyGaze,
    "Eldritch Invocations: Lifedrinker": ClassEnrichers.Warlock.InvocationLifedrinker,
    "Eldritch Invocations: Pact of the Blade": ClassEnrichers.Warlock.InvocationPactOfTheBlade,
    "Eldritch Invocations: Pact of the Chain": ClassEnrichers.Warlock.PactOfTheChain,
    "Eldritch Invocations: Mask of Many Faces": ClassEnrichers.Warlock.MaskOfManyFaces,
    "Eldritch Invocations: Armor of Shadows": ClassEnrichers.Warlock.ArmorOfShadows,
    "Eldritch Invocations: Ascendant Step": ClassEnrichers.Warlock.AscendantStep,
    "Eldritch Invocations: Bewitching Whispers": ClassEnrichers.Warlock.BewitchingWhispers,
    "Eldritch Invocations: Chains of Carceri": ClassEnrichers.Warlock.ChainsOfCarceri,
    "Eldritch Invocations: Beast Speech": ClassEnrichers.Warlock.BeastSpeech,
    "Eldritch Invocations: Eldritch Sight": ClassEnrichers.Warlock.EldritchSight,
    "Eldritch Invocations: Dreadful Word": ClassEnrichers.Warlock.DreadfulWord,
    "Eldritch Invocations: Far Scribe": ClassEnrichers.Warlock.FarScribe,
    "Eldritch Invocations: Feral Transformation": ClassEnrichers.Warlock.FeralTransformation,
    "Eldritch Invocations: Fiendish Vigor": ClassEnrichers.Warlock.FiendishVigor,
    "Eldritch Invocations: Visions of Distant Realms": ClassEnrichers.Warlock.VisionsOfDistantRealms,
    "Eldritch Invocations: Whispers of the Grave": ClassEnrichers.Warlock.WhispersOfTheGrave,
    "Eldritch Invocations: Gift of the Depths": ClassEnrichers.Warlock.GiftOfTheDepths,
    "Eldritch Invocations: Mask of Myriad Forms": ClassEnrichers.Warlock.MaskOfMyriadForms,
    "Eldritch Invocations: Minions of Chaos": ClassEnrichers.Warlock.MinionsOfChaos,
    "Eldritch Invocations: One with Shadows": ClassEnrichers.Warlock.OneWithShadows,
    "Eldritch Invocations: Mire the Mind": ClassEnrichers.Warlock.MireTheMind,
    "Eldritch Invocations: Misty Visions": ClassEnrichers.Warlock.MistyVisions,
    "Eldritch Invocations: Otherworldly Leap": ClassEnrichers.Warlock.OtherworldlyLeap,
    "Eldritch Invocations: Sculptor of Flesh": ClassEnrichers.Warlock.SculptorOfFlesh,
    "Eldritch Invocations: Sign of Ill Omen": ClassEnrichers.Warlock.SignOfIllOmen,
    "Eldritch Invocations: Shroud of Shadow": ClassEnrichers.Warlock.ShroudOfShadow,
    "Eldritch Invocations: Thief of Five Fates": ClassEnrichers.Warlock.ThiefOfFiveFates,
    "Eldritch Invocations: Trickster's Escape": ClassEnrichers.Warlock.TrickstersEscape,
    "Eldritch Invocations: Undying Servitude": ClassEnrichers.Warlock.UndyingServitude,
    "Elemental Affinity": ClassEnrichers.Sorcerer.ElementalAffinity,
    "Fighting Style: Interception": GenericEnrichers.FightingStyleInterception,
    "Flurry of Blows: Addle": ClassEnrichers.Monk.FlurryOfBlowsAdditional,
    "Flurry of Blows: Push": ClassEnrichers.Monk.FlurryOfBlowsAdditional,
    "Flurry of Blows: Topple": ClassEnrichers.Monk.FlurryOfBlowsAdditional,
    "Flurry of Healing and Harm": ClassEnrichers.Monk.FlurryOfHealingAndHarm,
    "Font of Magic: Sorcery Points": ClassEnrichers.Sorcerer.FontOfMagicSorceryPoints,
    "Font of Magic": ClassEnrichers.Sorcerer.FontOfMagic,
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
    "Maneuver Options: Commanding Presence": ClassEnrichers.Fighter.ManeuverCommandingPresence,
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
    "Maneuvers: Commanding Presence": ClassEnrichers.Fighter.ManeuverCommandingPresence,
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
    "Circle of the Spells": ClassEnrichers.Druid.CircleOfTheSpells,
    "Eldritch Invocations: Agonizing Blast": ClassEnrichers.Warlock.EldritchInvocationsAgonizingBlast,
    "Cleric Domain Spells": ClassEnrichers.Cleric.DomainSpells,
    "Paladin Oath Spells": ClassEnrichers.Paladin.OathOfSpells,
    "Ranger Spells": ClassEnrichers.Ranger.RangerSpells,
    "Sorcerer Extra Spells": ClassEnrichers.Sorcerer.ExtraSpells,
    "Warlock Extra Spells": ClassEnrichers.Warlock.ExtraSpells,
    "Elemental Disciplines": ClassEnrichers.Monk.ElementalDisciplines,
    "Artificer Spells": ClassEnrichers.Artificer.ArtificerSpells,
  };

  FALLBACK_ENRICHERS: Record<string, TClassEnricherConstructor> = {
    Generic: ClassEnrichers.Generic,
  };
}
