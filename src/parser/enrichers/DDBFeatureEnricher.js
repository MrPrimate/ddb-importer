import { generateATLChange, generateCustomChange, generateDowngradeChange, generateOverrideChange, generateSignedAddChange, generateUnsignedAddChange, generateUpgradeChange } from "../../effects/effects.js";
import utils from "../../lib/utils.js";
import DDBBaseEnricher from "./DDBBaseEnricher.js";
import DDBFeatureActivity from "../features/DDBFeatureActivity.js";
import DDBHelper from "../../lib/DDBHelper.js";
// enrichers
import AbjureFoes from "./feature/paladin/AbjureFoes.js";
import ArcaneRecovery from "./feature/wizard/ArcaneRecovery.js";
import Archdruid from "./feature/druid/Archdruid.js";
import DivineIntervention from "./feature/cleric/DivineIntervention.js";
import GhostlyGaze from "./feature/warlock/GhostlyGaze.js";
import NatureMagician from "./feature/druid/NatureMagician.js";
import PatientDefense from "./feature/monk/PatientDefense.js";
import SacredWeapon from "./feature/paladin/SacredWeapon.js";
import LivingLegend from "./feature/paladin/LivingLegend.js";
import InspiringSmite from "./feature/paladin/InspiringSmite.js";
import EmbodyLegends from "./feature/paladin/EmbodyLegends.js";
import RadiantStrikes from "./feature/paladin/RadiantStrikes.js";
import LayOnHandsPurifyPoison from "./feature/paladin/LayOnHandsPurifyPoison.js";
import LayOnHands from "./feature/paladin/LayOnHands.js";
import PeerlessAthlete from "./feature/paladin/PeerlessAthlete.js";
import UndyingSentinel from "./feature/paladin/UndyingSentinel.js";
import HolyNimbus from "./feature/paladin/HolyNimbus.js";
import ElderChampion from "./feature/paladin/ElderChampion.js";
import ChannelDivinity from "./feature/shared/ChannelDivinity.js";
import GloriousDefense from "./feature/paladin/GloriousDefense.js";
import BoonOfEnergyResistance from "./feat/BoonOfEnergyResistance.js";
import Slasher from "./feat/Slasher.js";
import EnergyRedirection from "./feat/EnergyRedirection.js";
import Healer from "./feat/Healer.js";
import AvengingAngel from "./feature/paladin/AvengingAngel.js";
import VowOfEnmity from "./feature/paladin/VowOfEnmity.js";
import RelentlessAvenger from "./feature/paladin/RelentlessAvenger.js";
import SoulOfVengeance from "./feature/paladin/SoulOfVengeance.js";
import PrimalCompanion from "./feature/ranger/PrimalCompanion.js";
import PrimalCompanionSummon from "./feature/ranger/PrimalCompanionSummon.js";
import PrimalCompanionRestoreBeast from "./feature/ranger/PrimalCompanionRestoreBeast.js";
import Tireless from "./feature/ranger/Tireless.js";
import TemporaryHitPoints from "./feature/ranger/TemporaryHitPoints.js";
import BoonOfFortitude from "./feat/BoonOfFortitude.js";
import BolsteringPerformance from "./feat/BolsteringPerformance.js";
import InspiringLeader from "./feat/InspiringLeader.js";
import MageSlayer from "./feat/MageSlayer.js";
import BeguilingTwist from "./feature/ranger/BeguilingTwist.js";
import DreadfulStrikes from "./feature/ranger/DreadfulStrikes.js";
import StalkersFlurry from "./feature/ranger/StalkersFlurry.js";
import DreadfulStrikeSuddenStrike from "./feature/ranger/DreadfulStrikeSuddenStrike.js";
import DreadfulStrikeMassFear from "./feature/ranger/DreadfulStrikeMassFear.js";
import DreadfulStrike from "./feature/ranger/DreadfulStrike.js";
import DreadAmbusher from "./feature/ranger/DreadAmbusher.js";
import ShadowyDodge from "./feature/ranger/ShadowyDodge.js";
import DefensiveTactics from "./feature/ranger/DefensiveTactics.js";
import SuperiorHuntersPrey from "./feature/ranger/SuperiorHuntersPrey.js";
import HuntersPrey from "./feature/ranger/HuntersPrey.js";
import SuperiorHuntersDefense from "./feature/ranger/SuperiorHuntersDefense.js";
import BreathWeapon2024 from "./trait/dragonborn/BreathWeapon2024.js";
import EnvenomWeapons from "./feature/rogue/EnvenomWeapons.js";
import SneakAttackPoisonEnvenom from "./feature/rogue/SneakAttackPoisonEnvenom.js";
import DeathStrike from "./feature/rogue/DeathStrike.js";
import BoonOfFate from "./feat/BoonOfFate.js";
import FastHands from "./feature/rogue/FastHands.js";
import UseMagicDevice from "./feature/rogue/UseMagicDevice.js";
import UseMagicDeviceCharges from "./feature/rogue/UseMagicDeviceCharges.js";
import UseMagicDeviceScroll from "./feature/rogue/UseMagicDeviceScroll.js";
import SneakAttackSupremeSneak from "./feature/rogue/SneakAttackSupremeSneak.js";
import SupremeSneak from "./feature/rogue/SupremeSneak.js";
import SorceryPoints from "./feature/sorcerer/SorceryPoints.js";
import FontOfMagic from "./feature/sorcerer/FontOfMagic.js";
import WildMagicSurge from "./feature/sorcerer/WildMagicSurge.js";
import SorcerousRestoration from "./feature/sorcerer/SorcerousRestoration.js";
import SorceryIncarnate from "./feature/sorcerer/SorceryIncarnate.js";
import BendLuck from "./feature/sorcerer/BendLuck.js";
import Telekinetic from "./feat/Telekinetic.js";
import RevelationInFlesh from "./feature/sorcerer/RevelationInFlesh.js";
import WarpingImplosion from "./feature/sorcerer/WarpingImplosion.js";
import AspectOfTheWilds from "./feature/barbarian/AspectOfTheWilds.js";
import CelestialRevelationHeavenlyWings from "./trait/aasimar/CelestialRevelationHeavenlyWings.js";
import CelestialRevelation from "./trait/aasimar/CelestialRevelation.js";
import CelestialRevelationRadiantSoul from "./generic/CelestialRevelationRadiantSoul.js";
import CelestialRevelationNecroticShroud from "./trait/aasimar/CelestialRevelationNecroticShroud.js";
import CelestialRevelationInnerRadiance from "./trait/aasimar/CelestialRevelationInnerRadiance.js";
import CelestialRevelationRadiantConsumption from "./trait/aasimar/CelestialRevelationRadiantConsumption.js";
import Relentless from "./feature/fighter/Relentless.js";
import SlowFall from "./feature/monk/SlowFall.js";
import DarkOnesOwnLuck from "./feature/warlock/DarkOnesOwnLuck.js";
import PowerOfTheWilds from "./feature/barbarian/PowerOfTheWilds.js";
import Stormborn from "./feature/druid/Stormborn.js";
import StrideOfTheElements from "./feature/monk/StrideOfTheElements.js";
import TranceOfOrder from "./feature/sorcerer/TranceOfOrder.js";
import BastionOfLaw from "./feature/sorcerer/BastionOfLaw.js";
import ClockworkCavalcade from "./feature/sorcerer/ClockworkCavalcade.js";
import Rage from "./feature/barbarian/Rage.js";
import ElementalAffinity from "./feature/sorcerer/ElementalAffinity.js";
import DragonWings from "./feature/sorcerer/DragonWIngs.js";
import HealingLight from "./feature/warlock/HealingLight.js";
import SearingVengeance from "./feature/warlock/SearingVengeance.js";
import RadiantSoul from "./feature/warlock/RadiantSoul.js";
import CelestialResilience from "./feature/warlock/CelestialResilience.js";
import BeguilingMagic from "./feature/bard/BeguilingMagic.js";
import BoonOfTheNightSpirit from "./feat/BoonOfTheNightSpirit.js";
import CunningStrike from "./feature/rogue/CunningStrike.js";
import CoronaOfLight from "./feature/cleric/CoronaOfLight.js";
import DazzlingFootwork from "./feature/bard/DazzlingFootwork.js";
import DeviousStrikes from "./feature/rogue/DeviousStrikes.js";
import ElementalEpitome from "./feature/monk/ElementalEpitome.js";
import ChromaticInfusion from "./trait/dragonborn/ChromaticInfusion.js";
import ImprovedBrutalStrike from "./feature/barbarian/ImprovedBrutalStrike.js";
import MonksFocus from "./feature/monk/MonksFocus.js";
import ShieldingStorm from "./feature/barbarian/ShieldingStorm.js";
import StarryForm from "./feature/druid/StarryForm.js";
import TheThirdEye from "./feature/wizard/TheThirdEye.js";
import HurlThroughHell from "./feature/warlock/HurlThroughHell.js";

export default class DDBFeatureEnricher extends DDBBaseEnricher {
  constructor() {
    super();
    this.additionalActivityClass = DDBFeatureActivity;
    this.effectType = "feat";
    this.enricherType = "feat";
  }

  load({ ddbParser, document, name = null } = {}) {
    super.load({ ddbParser, document, name });
    this._prepare();
  }

  ENRICHERS = {
    "Abjure Foes": () => AbjureFoes,
    "Arcane Recovery": () => ArcaneRecovery,
    "Archdruid": () => Archdruid,
    "Aspect of the Wilds": () => AspectOfTheWilds,
    "Avenging Angel": () => AvengingAngel,
    "Bastion of Law": () => BastionOfLaw,
    "Beguiling Magic": () => BeguilingMagic,
    "Beguiling Twist": () => BeguilingTwist,
    "Bend Luck": () => BendLuck,
    "Bolstering Performance": () => BolsteringPerformance,
    "Boon of Energy Resistance": () => BoonOfEnergyResistance,
    "Boon of Fate": () => BoonOfFate,
    "Boon of Fortitude": () => BoonOfFortitude,
    "Boon of the Night Spirit": () => BoonOfTheNightSpirit,
    "Breath Weapon (Acid)": () => BreathWeapon2024,
    "Breath Weapon (Cold)": () => BreathWeapon2024,
    "Breath Weapon (Fire)": () => BreathWeapon2024,
    "Breath Weapon (Lightning)": () => BreathWeapon2024,
    "Breath Weapon (Poison)": () => BreathWeapon2024,
    "Celestial Resilience": () => CelestialResilience,
    "Celestial Revelation (Heavenly Wings)": () => CelestialRevelationHeavenlyWings,
    "Celestial Revelation (Inner Radiance)": () => CelestialRevelationInnerRadiance,
    "Celestial Revelation (Necrotic Shroud)": () => CelestialRevelationNecroticShroud,
    "Celestial Revelation (Radiant Consumption)": () => CelestialRevelationRadiantConsumption,
    "Celestial Revelation (Radiant Soul)": () => CelestialRevelationRadiantSoul,
    "Celestial Revelation": () => CelestialRevelation,
    "Channel Divinity": () => ChannelDivinity,
    "Clockwork Cavalcade": () => ClockworkCavalcade,
    "Corona of Light": () => CoronaOfLight,
    "Cunning Strike": () => CunningStrike,
    "Dark One's Own Luck": () => DarkOnesOwnLuck,
    "Dazzling Footwork": () => DazzlingFootwork,
    "Death Strike": () => DeathStrike,
    "Defensive Tactics": () => DefensiveTactics,
    "Devious Strikes": () => DeviousStrikes,
    "Divine Intervention": () => DivineIntervention,
    "Dragon Wings": () => DragonWings,
    "Dread Ambusher": () => DreadAmbusher,
    "Dreadful Strike: Mass Fear": () => DreadfulStrikeMassFear,
    "Dreadful Strike: Sudden Strike": () => DreadfulStrikeSuddenStrike,
    "Dreadful Strike": () => DreadfulStrike,
    "Dreadful Strikes": () => DreadfulStrikes,
    "Elder Champion": () => ElderChampion,
    "Eldritch Invocations: Ghostly Gaze": () => GhostlyGaze,
    "Elemental Affinity": () => ElementalAffinity,
    "Elemental Epitome": () => ElementalEpitome,
    "Embody Legends": () => EmbodyLegends,
    "Energy Redirection": () => EnergyRedirection,
    "Envenom Weapons": () => EnvenomWeapons,
    "Fast Hands": () => FastHands,
    "Font of Magic": () => FontOfMagic,
    "Gift of the Chromatic Dragon: Chromatic Infusion": () => ChromaticInfusion,
    "Glorious Defense": () => GloriousDefense,
    "Healer": () => Healer,
    "Healing Light": () => HealingLight,
    "Holy Nimbus": () => HolyNimbus,
    "Hunter's Prey": () => HuntersPrey,
    "Hurl Through Hell": () => HurlThroughHell,
    "Improved Brutal Strike": () => ImprovedBrutalStrike,
    "Inspiring Leader": () => InspiringLeader,
    "Inspiring Smite": () => InspiringSmite,
    "Lay On Hands: Healing Pool": () => LayOnHands,
    "Lay On Hands: Purify Poison": () => LayOnHandsPurifyPoison,
    "Living Legend": () => LivingLegend,
    "Mage Slayer": () => MageSlayer,
    "Monk's Focus": () => MonksFocus,
    "Nature Magician": () => NatureMagician,
    "Patient Defense": () => PatientDefense,
    "Peerless Athlete": () => PeerlessAthlete,
    "Power of the Wilds": () => PowerOfTheWilds,
    "Primal Companion: Restore Beast": () => PrimalCompanionRestoreBeast,
    "Primal Companion: Summon": () => PrimalCompanionSummon,
    "Primal Companion": () => PrimalCompanion,
    "Radiant Soul": () => RadiantSoul,
    "Radiant Strikes": () => RadiantStrikes,
    "Rage": () => Rage,
    "Relentless Avenger": () => RelentlessAvenger,
    "Relentless": () => Relentless,
    "Revelation in Flesh": () => RevelationInFlesh,
    "Sacred Weapon": () => SacredWeapon,
    "Searing Vengeance": () => SearingVengeance,
    "Shadowy Dodge": () => ShadowyDodge,
    "Shielding Storm": () => ShieldingStorm,
    "Slasher": () => Slasher,
    "Slow Fall": () => SlowFall,
    "Sneak Attack: Poison (Envenom)": () => SneakAttackPoisonEnvenom,
    "Sneak Attack: Supreme Sneak (Cost: 1d6)": () => SneakAttackSupremeSneak,
    "Sorcerous Restoration": () => SorcerousRestoration,
    "Sorcery Incarnate": () => SorceryIncarnate,
    "Sorcery Points": () => SorceryPoints,
    "Soul of Vengeance": () => SoulOfVengeance,
    "Stalker's Flurry": () => StalkersFlurry,
    "Starry Form": () => StarryForm,
    "Stormborn": () => Stormborn,
    "Stride of the Elements": () => StrideOfTheElements,
    "Superior Hunter's Defense": () => SuperiorHuntersDefense,
    "Superior Hunter's Prey": () => SuperiorHuntersPrey,
    "Supreme Sneak": () => SupremeSneak,
    "Telekinetic": () => Telekinetic,
    "Temporary Hit Points": () => TemporaryHitPoints,
    "The Third Eye": () => TheThirdEye,
    "Tireless": () => Tireless,
    "Trance of Order": () => TranceOfOrder,
    "Undying Sentinel": () => UndyingSentinel,
    "Use Magic Device: Charges": () => UseMagicDeviceCharges,
    "Use Magic Device: Scroll": () => UseMagicDeviceScroll,
    "Use Magic Device": () => UseMagicDevice,
    "Vow of Enmity": () => VowOfEnmity,
    "Warping Implosion": () => WarpingImplosion,
    "Wild Magic Surge": () => WildMagicSurge,
  };

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
    "Psychic Blades: Attack (DEX)": "Psychic Blades: Attack",
    "Psychic Blades: Attack (STR)": "Psychic Blades: Attack",
    "Psychic Blades: Bonus Attack (DEX)": "Psychic Blades: Bonus Attack",
    "Psychic Blades: Bonus Attack (STR)": "Psychic Blades: Bonus Attack",
    "Psychic Blades: Homing Strikes": "Soul Blades: Homing Strikes",
    "Psychic Blades: Psychic Teleportation": "Soul Blades: Psychic Teleportation",
    "Psychic Blades": "Psychic Blades: Attack",
    "Psychic Teleportation": "Soul Blades: Psychic Teleportation",
    "Radiance of the Dawn": "Channel Divinity: Radiance of the Dawn",
    "Rage (Enter)": "Rage",
    // "War God's Blessing": "Channel Divinity: War God's Blessing",
    "Telekinetic Adept: Psi-Powered Leap": "Psionic Power: Psi-Powered Leap",
    "Telekinetic Adept: Telekinetic Thrust": "Psionic Power: Telekinetic Thrust",
  };

  ACTIVITY_HINTS = {
    "Arms of the Astral Self (DEX/STR)": {
      data: {
        "attack.ability": "",
      },
    },
    "Arms of the Astral Self: Summon": {
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.monk.martial-arts.die", type: "force" })],
          onSave: "none",
        },
      },
    },
    "Bardic Inspiration": {
      targetType: "creature",
      addItemConsumed: true,
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.bard.bardic-inspiration",
          name: "Inspiration Roll",
        },
        duration: {
          value: "10",
          units: "minutes",
        },
        range: {
          value: 60,
          long: null,
          units: "ft",
        },
      },
    },
    "Blessed Healer": {
      type: "heal",
      activationType: "special",
      name: "Heal Self",
      targetType: "self",
      addScalingMode: "amount",
      addScalingFormula: "1",
      data: {
        description: {
          chatFlavor: "Choose level of spell for scaling",
        },
        "consumption.scaling": {
          allowed: true,
          max: "9",
        },
        healing: DDBBaseEnricher.basicDamagePart({ bonus: "3", types: ["healing"], scalingMode: "whole", scalingFormula: "1" }),
      },
    },
    "Blessed Strikes: Divine Strike": {
      type: "damage",
      targetType: "creature",
      activationOverride: "special",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.cleric.divine-strike", types: ["radiant", "necrotic"] })],
        },
      },
    },
    "Branches of the Tree": {
      type: "save",
      activationType: "reaction",
      data: {
        save: {
          ability: "str",
          dc: {
            calculation: "str",
            formula: "",
          },
        },
        target: {
          affects: {
            type: "creature",
            value: "1",
          },
        },
        range: {
          value: "30",
          units: "ft",
        },
      },
    },
    "Brutal Strike": {
      type: "damage",
      name: "Forceful Blow",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.barbarian.brutal-strike" })],
        },
      },
    },
    "Channel Divinity: Preserve Life": {
      type: "heal",
      targetType: "ally",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@classes.cleric.levels * 5", types: ["healing"] }),
      },
    },
    "Channel Divinity: Radiance of the Dawn": {
      type: "save",
      targetType: "enemy",
      data: {
        damage: {
          onSave: "half",
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "2d10 + @classes.cleric.levels", type: "radiant" })],
        },
        target: {
          template: {
            value: "30",
            units: "ft",
            type: "radius",
          },
        },
      },
    },
    "Charger": {
      type: "damage",
      targetType: "enemy",
      data: {
        name: "Charge Damage",
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 8, types: DDBBaseEnricher.allDamageTypes() })],
        },
      },
    },
    "Chef": {
      name: "Replenishing Meal",
      type: "heal",
      targetType: "creature",
      activationType: "special",
      activationCondition: "As part of a short rest",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 8, type: "healing" }),
      },
    },
    "Cloak of Shadows": {
      type: "utility",
      targetType: "self",
      data: {
        duration: {
          value: "1",
          units: "minute",
        },
      },
    },
    "Cloud's Jaunt (Cloud Giant)": {
      type: "utility",
      targetType: "self",
      activationType: "bonus",
    },
    "Combat Inspiration": {
      type: "utility",
      targetType: "creature",
      data: {
        name: "Defense",
        roll: {
          prompt: false,
          visible: true,
          formula: "@scale.bard.bardic-inspiration",
          name: "Inspiration Roll",
        },
      },
    },
    "Cunning Action": {
      type: "utility",
      targetType: "self",
      activationType: "bonus",
    },
    "Cutting Words": {
      targetType: "creature",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.bard.bardic-inspiration",
          name: "Subtraction Roll",
        },
        range: {
          value: 60,
          long: null,
          units: "ft",
        },
      },
    },
    "Dark One's Blessing": {
      type: "heal",
      targetType: "self",
      data: {
        "activation.condition": "Reduce a hostile creature to 0 HP",
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@abilities.cha.mod + @classes.warlock.levels", types: ["temphp"] }),
      },
    },
    "Deflect Attack": {
      name: "Reduce Damage",
      targetType: "self",
      type: "heal",
      data: {
        "consumption.targets": [],
        // roll: {
        //   prompt: false,
        //   visible: false,
        //   formula: "1d10 + @abilities.dex.mod + @classes.monk.levels",
        //   name: "Reduce Damage Amount",
        // },
        healing: DDBBaseEnricher.basicDamagePart({
          number: 1,
          denomination: 10,
          bonus: "@abilities.dex.mod + @classes.monk.levels",
          types: ["healing"],
        }),
      },
    },
    "Deflect Attack: Redirect Attack": {
      name: "Redirect Attack",
      targetType: "creature",
      addItemConsume: true,
      activationType: "special",
      type: "save",
      data: {
        save: {
          ability: "dex",
          dc: { calculation: "dex", formula: "" },
        },
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "2@scale.monk.martial-arts.die + @abilities.dex.mod", types: ["bludgeoning", "piercing", "slashing"] })],
        },
      },
    },
    "Deflect Energy": {
      type: "none",
    },
    "Deflect Missiles": {
      targetType: "self",
      type: "heal",
      data: {
        "consumption.targets": [],
        // roll: {
        //   prompt: false,
        //   visible: false,
        //   formula: "1d10 + @abilities.dex.mod + @classes.monk.levels",
        //   name: "Reduce Damage Amount",
        // },
        healing: DDBBaseEnricher.basicDamagePart({
          number: 1,
          denomination: 10,
          bonus: "@abilities.dex.mod + @classes.monk.levels",
          types: ["healing"],
        }),
      },
    },
    "Deflect Missiles Attack": {
      activationType: "special",
      targetType: "creature",
      data: {
        "damage.parts": [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.monk.martial-arts.die + @abilities.dex.mod", types: DDBBaseEnricher.allDamageTypes() })],
      },
    },
    "Disciple of Life": {
      type: "heal",
      targetType: "creature",
      data: {
        description: {
          chatFlavor: "Choose level of spell for scaling",
        },
        "consumption.scaling": {
          allowed: true,
          max: "9",
        },
        healing: DDBBaseEnricher.basicDamagePart({ bonus: "3", types: ["healing"], scalingMode: "whole", scalingFormula: "1" }),
      },
    },
    "Disciplined Survivor": {
      type: "utility",
      targetType: "self",
    },
    "Eldritch Cannon: Flamethrower": {
      type: "save",
      targetType: "creature",
      data: {
        description: {
          chatFlavor: "Ignites flammable objects.",
        },
        damage: {
          onSave: "half",
          parts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 8, type: "fire" })],
        },
      },
    },
    "Eldritch Cannon: Force Ballista": {
      type: "attack",
      targetType: "creature",
      data: {
        description: {
          chatFlavor: "On hit pushed 5 ft away.",
        },
        range: {
          value: 120,
          units: "ft",
        },
        target: {},
        attack: {
          ability: "int",
          type: {
            value: "ranged",
            classification: "spell",
          },
        },
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 8, type: "force" })],
        },
      },
    },
    "Eldritch Cannon: Protector": {
      type: "heal",
      targetType: "creature",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 8, bonus: "@abilities.int.mod", types: ["temphp"] }),
        target: {
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
      },
    },
    "Eldritch Invocations: Lifedrinker": {
      type: "damage",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 6, types: ["necrotic", "psychic", "radiant"] })],
        },
      },
    },
    "Eldritch Invocations: Pact of the Blade": {
      type: "enchant",
      data: {
        name: "Bond With Weapon",
        restrictions: {
          type: "weapon",
          allowMagical: true,
        },
      },
    },
    "Elemental Attunement": {
      name: "Elemental Attunement",
      type: "utility",
      targetType: "self",
      activationType: "special",
      activationCondition: "Start of turn",
    },
    "Elemental Burst": {
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.elements.elemental-burst", types: ["acid", "cold", "fire", "lightning", "thunder"] })],
        },
      },
    },
    "Elemental Fury: Primal Strike": {
      type: "damage",
      targetType: "creature",
      activationOverride: "special",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.druid.elemental-fury", types: ["cold", "fire", "lighting", "thunder"] })],
        },
      },
    },
    "Empowered Strikes": {
      type: "attack",
      targetType: "creature",
      data: {
        range: {
          value: 5,
          units: "ft",
        },
        attack: {
          ability: "dex",
          type: {
            value: "melee",
            classification: "unarmed",
          },
        },
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.monk.martial-arts.die + @mod", types: ["bludgeoning", "force"] })],
        },
      },
    },
    "Empty Body": {
      targetType: "self",
    },
    "Expert Divination": {
      targetType: "self",
      type: "utility",
      noConsumeTargets: true,
      addConsumptionScalingMax: "5",
      additionalConsumptionTargets: [
        {
          "type": "spellSlots",
          "value": "-1",
          "target": "1",
          "scaling": {
            "mode": "level",
            "formula": "",
          },
        },
      ],
      data: {
        name: "Regain Spell Slot",
      },
    },
    "Fighting Style: Interception": {
      type: "utility",
      targetType: "creature",
      data: {
        target: {
          "affects.type": "creature",
          template: {},
        },
        roll: {
          prompt: false,
          visible: false,
          formula: "1d10 + @prof",
          name: "Reduce Damage Roll",
        },
      },
    },
    "Fire's Burn (Fire Giant)": {
      type: "damage",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 10, type: "fire" })],
        },
      },
    },
    "Flurry of Blows: Addle": {
      type: "utility",
      activationType: "special",
      activationCondition: "You hit a creature with a Flurry of Blows strike",
    },
    "Flurry of Blows: Push": {
      type: "save",
      activationType: "special",
      activationCondition: "You hit a creature with a Flurry of Blows strike",
    },
    "Flurry of Blows: Topple": {
      type: "save",
      activationType: "special",
      activationCondition: "You hit a creature with a Flurry of Blows strike",
    },
    "Form of the Beast: Tail": {
      noTemplate: true,
      data: {
        range: {
          value: 10,
          units: "ft",
        },
      },
    },
    "Frenzy": {
      type: "damage",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "(@scale.barbarian.rage-damage)d6" })],
        },
      },
    },
    "Frost's Chill (Frost Giant)": {
      type: "damage",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 6, type: "cold" })],
        },
      },
    },
    "Full of Stars": {
      type: "utility",
      targetType: "self",
      activationType: "special",
    },
    "Genie's Vessel: Genie's Wrath (Dao)": {
      type: "damage",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@prof", type: "bludgeoning" })],
        },
      },
    },
    "Genie's Vessel: Genie's Wrath (Djinni)": {
      type: "damage",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@prof", type: "thunder" })],
        },
      },
    },
    "Genie's Vessel: Genie's Wrath (Efreeti)": {
      type: "damage",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@prof", type: "fire" })],
        },
      },
    },
    "Genie's Vessel: Genie's Wrath (Marid)": {
      type: "damage",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@prof", type: "cold" })],
        },
      },
    },
    "Giant's Might": {
      type: "utility",
      targetType: "self",
      data: {
        duration: {
          value: "1",
          units: "minute",
        },
      },
    },
    "Guardian Armor: Defensive Field": {
      type: "heal",
      targetType: "self",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ bonus: "@classes.artificer.levels", types: ["temphp"] }),
      },
    },
    "Guided Strike": {
      name: "Self",
      type: "utility",
      targetType: "self",
      activationType: "special",
      activationCondition: "When you miss with an attack",
    },
    "Greater Divine Intervention": {
      type: "utility",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "2d4",
          name: "Long rests till next intervention",
        },
      },
    },
    "Hand of Healing": {
      name: "Hand of Healing",
      type: "heal",
      activationType: "special",
      targetType: "creature",
      data: {
        "range.units": "touch",
        "healing.custom.formula": "@scale.mercy.hand-of-healing + @abilities.wis.mod",
      },
    },
    "Hand of Harm": {
      name: "Hand of Harm",
      type: "damage",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.monk.martial-arts.die", type: "necrotic" })],
        },
      },
    },
    "Harness Divine Power": {
      type: "utility",
      activationType: "bonus",
      addItemConsume: true,
    },
    "Healing Hands": {
      type: "heal",
      targetType: "creature",
      data: {
        // "range.units": "touch",
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "(@prof)d4", types: ["healing"] }),
      },
    },
    "Heightened Focus": {
      name: "Patient Defense Healing",
      type: "heal",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "2@scale.monk.martial-arts.die", types: ["temphp"] }),
      },
    },
    "Hill's Tumble (Hill Giant)": {
      type: "utility",
      targetType: "creature",
      activationType: "special",
    },
    "Hold Breath": {
      type: "utility",
      func: undefined,
      targetType: "self",
      activationType: "special",
      data: {
        duration: {
          value: "15",
          units: "minute",
        },
      },
    },
    "Hound of Ill Omen": {
      type: "summon",
      noTemplate: true,
      profileKeys: ["HoundOfIllOmen"],
      summons: {
        "creatureSizes": ["med"],
        "creatureTypes": ["monstrosity"],
        "bonuses.hp": "floor(@classes.sorcerer.levels / 2)",
      },
    },
    "Improved Blessed Strikes: Potent Spellcasting": {
      type: "heal",
      targetType: "creature",
      activationType: "special",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@abilities.wis.mod * 2", types: ["temphp"] }),
        range: {
          value: "60",
          units: "ft",
        },
      },
    },
    "Improved Duplicity": {
      type: "heal",
      targetType: "creature",
      activationType: "special",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@classes.cleric.levels", types: ["healing"] }),
      },
    },
    "Improved Shadow Step": {
      type: "utility",
      targetType: "self",
      activationType: "bonus",
    },
    "Improved Warding Flare": {
      type: "heal",
      targetType: "creature",
      activationType: "special",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 6, bonus: "@abilities.wis.mod", types: ["temphp"] }),
        range: {
          value: "60",
          units: "ft",
        },
      },
    },
    "Inspiring Movement": {
      type: "utility",
      activationType: "reaction",
    },
    "Intimidating Presence": {
      // type: "save",
      targetType: "creature",
      data: {
        name: "Save",
        save: {
          ability: "wis",
          dc: {
            calculation: "str",
            formula: "",
          },
        },
        target: {
          affects: {
            type: "enemy",
            choice: true,
          },
          template: {
            count: "",
            contiguous: false,
            type: "radius",
            size: "30",
            width: "",
            height: "",
            units: "ft",
          },
        },
      },
    },
    "Invoke Duplicity": {
      type: "utility",
      targetType: "self",
      activationType: "bonus",
      data: {
        duration: {
          value: "1",
          units: "minute",
        },
      },
    },
    "Land's Aid": {
      type: "save",
      name: "Save vs Thorn Damage",
      targetType: "creature",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.land.lands-aid", types: ["necrotic"] })],
        },
      },
    },
    "Large Form": {
      type: "utility",
      activationType: "bonus",
      data: {
        duration: {
          value: "10",
          units: "minute",
        },
      },
    },
    "Lucky": {
      type: "utility",
      name: "Spend Luck Point",
      activationType: "special",
      addItemConsume: true,
    },
    "Lunar Form": {
      type: "damage",
      name: "Lunar Radiance Damage",
      activationType: "special",
      activationCondition: "Once per turn, on hit, whilst in Wild Shape",
      targetType: "creature",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 10, type: "radiant" })],
        },
      },
    },
    "Magical Cunning": {
      targetType: "self",
      type: "utility",
      additionalConsumptionTargets: [
        {
          "type": "attribute",
          "value": "-(ceil(@spells.pact.max / 2))",
          "target": "spells.pact.value",
        },
      ],
      data: {
        name: "Regain Pact Slots",
      },
    },
    "Maneuver: Disarming Attack (Str.)": {
      type: "save",
      data: {
        damage: {
          onSave: "none",
        },
        save: {
          ability: "str",
          dc: {
            calculation: "",
            formula: "8 + @prof + max(@abilities.dex.mod, @abilities.str.mod)",
          },
        },
      },
    },
    "Maneuver: Distracting Strike": {
      type: "damage",
      data: {
        damage: {
          onSave: "none",
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.battle-master.combat-superiority-die" })],
        },
      },
    },
    "Maneuver: Goading Attack (Str.)": {
      type: "save",
      data: {
        damage: {
          onSave: "none",
        },
        save: {
          ability: "wis",
          dc: {
            calculation: "",
            formula: "8 + @prof + max(@abilities.dex.mod, @abilities.str.mod)",
          },
        },
      },
    },
    "Maneuver: Lunging Attack": {
      type: "damage",
      data: {
        damage: {
          onSave: "none",
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.battle-master.combat-superiority-die" })],
        },
      },
    },
    "Maneuver: Lunging Dash": {
      type: "damage",
      data: {
        damage: {
          onSave: "none",
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.battle-master.combat-superiority-die" })],
        },
      },
    },
    "Maneuver: Maneuvering Attack": {
      type: "damage",
      data: {
        damage: {
          onSave: "none",
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.battle-master.combat-superiority-die" })],
        },
      },
    },
    "Maneuver: Menacing Attack (Str.)": {
      type: "save",
      data: {
        damage: {
          onSave: "none",
        },
        save: {
          ability: "wis",
          dc: {
            calculation: "",
            formula: "8 + @prof + max(@abilities.dex.mod, @abilities.str.mod)",
          },
        },
      },
    },
    "Maneuver: Parry (Str.)": {
      type: "utility",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.battle-master.combat-superiority-die",
          name: "Reduce Damage Roll",
        },
      },
    },
    "Maneuver: Pushing Attack (Str.)": {
      type: "save",
      data: {
        damage: {
          onSave: "none",
        },
        save: {
          ability: "str",
          dc: {
            calculation: "",
            formula: "8 + @prof + max(@abilities.dex.mod, @abilities.str.mod)",
          },
        },
      },
    },
    "Maneuver: Precision Attack": {
      type: "utility",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.battle-master.combat-superiority-die",
          name: "Add to Attack Roll",
        },
      },
    },
    "Maneuver: Rally": {
      type: "heal",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.battle-master.combat-superiority-die", types: ["temphp"] }),
      },
    },
    "Maneuver: Riposte": {
      type: "damage",
      data: {
        damage: {
          onSave: "none",
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.battle-master.combat-superiority-die" })],
        },
      },
    },
    "Maneuver: Sweeping Attack": {
      type: "damage",
      data: {
        damage: {
          onSave: "none",
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.battle-master.combat-superiority-die", types: ["bludgeoning", "piercing", "slashing"] })],
        },
      },
    },
    "Maneuver: Tactical Assessment": {
      type: "check",
      noeffect: true,
      data: {
        name: "Roll Check (Apply Effect First)",
        check: {
          associated: ["his", "inv", "ins"],
          ability: "",
          dc: {
            calculation: "",
            formula: "",
          },
        },
      },
    },
    "Maneuver: Trip Attack (Str.)": {
      type: "save",
      data: {
        damage: {
          onSave: "full",
        },
        save: {
          ability: "str",
          dc: {
            calculation: "",
            formula: "8 + @prof + max(@abilities.dex.mod, @abilities.str.mod)",
          },
        },
      },
    },
    "Mantle of Inspiration": {
      type: "heal",
      data: {
        "description.chatFlavor": "Each creature can immediately use its reaction to move up to its speed, without provoking opportunity attacks.",
        "range.units": "self",
        target: {
          template: {
            count: "",
            contiguous: false,
            type: "radius",
            size: "60",
            width: "",
            height: "",
            units: "ft",
          },
          affects: {
            count: "@abilities.cha.mod",
            type: "ally",
            choice: true,
            special: "",
          },
          prompt: false,
        },
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "2 * @scale.college-of-glamour.mantle-of-inspiration", types: ["temphp"] }),
      },
    },
    "Mind Link Response": {
      data: {
        range: {
          units: "spec",
          special: "Withing sight",
        },
      },
    },
    "Moonlight Step": {
      name: "Transport",
      type: "utility",
      targetType: "self",
      data: {
        range: {
          units: "ft",
          value: "30",
        },
      },
    },
    "Mystic Arcanum (Level 8 Spell)": {
      type: "none",
    },
    "Natural Recovery": () => {
      const uses = this._getUsesWithSpent({
        type: "class",
        name: "Natural Recovery: Cast Circle Spell",
        max: "1",
        period: "1r",
      });

      return {
        type: "utility",
        name: "Cast Circle Spell",
        addActivityConsume: true,
        data: {
          uses,
        },
      };
    },
    "Partially Amphibious": {
      type: "utility",
      func: undefined,
      targetType: "self",
      activationType: "special",
      addItemConsume: true,
    },
    "Pact Boon: Pact of the Talisman": {
      type: "utility",
      targetType: "self",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d4",
          name: "Roll Ability Check Bonus",
        },
      },
    },
    "Perfect Focus": {
      type: "ddbmacro",
      data: {
        name: "Recover Focus",
        macro: {
          name: "Reecover Focus",
          function: "ddb.feat.perfectFocus",
          visible: false,
          parameters: "",
        },
      },
    },
    "Persistent Rage": {
      type: "utility",
      targetType: "self",
      activationType: "special",
      data: {
        "range.units": "self",
      },
    },
    "Poisoner": {
      type: "utility",
      name: "Brew Poisons",
      addItemConsume: true,
      itemConsumeValue: "-@prof",
      noeffect: true,
      data: {
        img: "systems/dnd5e/icons/svg/items/consumable.svg",
        duration: {
          value: "1",
          units: "hour",
        },
      },
    },
    "Polearm Master - Bonus Attack": {
      type: "attack",
      activationType: "bonus",
      targetType: "creature",
      data: {
        "reach.value": "10",
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 4, types: ["bludgeoning"] })],
        },
      },
    },
    "Psionic Power": () => {
      const formula = `1(@scale.${DDBHelper.classIdentifierName(this.ddbParser.subKlass)}.energy-die.die)`;
      const result = {
        name: "",
        type: "utility",
        addItemConsume: true,
        data: {
          roll: {
            prompt: false,
            visible: false,
            formula,
            name: "Roll Bonus",
          },
        },
      };

      if (this.ddbParser.subKlass === "Soulknife") {
        result.name = "Psi-Bolstered Knack";
      } else {
        result.name = "Protective Field";
        result.activationType = "reaction";
        result.targetType = "creature";
        result.data.range = {
          units: "ft",
          value: "30",
        };
      }
      return result;

    },
    "Psionic Power: Recovery": () => {
      return {
        name: "Recovery",
        addActivityConsume: true,
        addItemConsume: true,
        itemConsumeValue: "-1",
        data: {
          uses: this._getUsesWithSpent({ type: "class", name: "Psionic Power: Recovery", max: 1, period: "lr" }),
        },
      };
    },
    "Psionic Power: Psi-Bolstered Knack": {
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.soulknife.energy-die.die",
          name: "Roll Additional Bonus",
        },
      },
    },
    "Psionic Power: Psychic Whispers": {
      name: "Psychic Whispers",
      addItemConsume: true,
      addSingleFreeUse: true,
      data: {
        target: {
          affects: {
            count: "@prof",
            type: "ally",
            choice: true,
            special: "",
          },
        },
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.soulknife.energy-die.die",
          name: "Hours active roll",
        },
      },
    },
    "Psionic Power: Psi-Powered Leap": {
      name: "Psi-Powered Leap",
      addItemConsume: true,
      addSingleFreeUse: true,
      addSingleFreeRecoveryPeriod: "sr",
    },
    "Psionic Power: Telekinetic Thrust": {
      name: "Telekinetic Thrust",
      activationType: "special",
      addItemConsume: true,
    },
    "Psionic Power: Telekinetic Movement": {
      name: "Telekinetic Movement",
      type: "utility",
      targetType: "creature",
      addItemConsume: true,
      addSingleFreeUse: true,
      addSingleFreeRecoveryPeriod: "sr",
      data: {
        range: {
          units: "ft",
          value: "30",
        },
      },
    },
    "Psionic Power: Psionic Strike": {
      name: "Psionic Strike",
      activationType: "special",
      type: "damage",
      targetType: "creature",
      addItemConsume: true,
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.psi-warrior.energy-die.die + @abilities.mod.int", types: ["psychic"] })],
        },
        range: {
          units: "ft",
          value: "30",
        },
      },
    },
    "Quickened Healing": {
      type: "heal",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.monk.martial-arts.die + @prof", types: ["healing"] }),
      },
    },
    "Raging Storm: Desert": {
      type: "save",
      activationType: "reaction",
      targetType: "creature",
      data: {
        "range.units": "self",
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "floor(@classes.barbarian.levels / 2)", types: ["fire"] })],
        },
        target: {
          save: {
            ability: "dex",
            dc: {
              calculation: "con",
              formula: "",
            },
          },
          affects: {
            count: "1",
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
          prompt: false,
        },
      },
    },
    "Raging Storm: Sea": {
      type: "save",
      activationType: "reaction",
      targetType: "creature",
      data: {
        save: {
          ability: "str",
          dc: {
            calculation: "con",
            formula: "",
          },
        },
        "range.units": "self",
        target: {
          affects: {
            count: "1",
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
          prompt: false,
        },
      },
    },
    "Raging Storm: Tundra": {
      type: "save",
      activationType: "reaction",
      targetType: "creature",
      data: {
        save: {
          ability: "str",
          dc: {
            calculation: "con",
            formula: "",
          },
        },
        "range.units": "self",
        target: {
          affects: {
            count: "1",
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
          prompt: false,
        },
      },
    },
    "Regain Bardic Inspiration": {
      type: "utility",
      addItemConsume: true,
      itemConsumeValue: "-1",
      activationType: "special",
      addConsumptionScalingMax: "9",
      additionalConsumptionTargets: [
        {
          "type": "spellSlots",
          "value": "1",
          "target": "1",
          "scaling": {
            "mode": "level",
          },
        },
      ],
      data: {
        name: "Regain via Spell Slot",
      },
    },
    "Relentless Rage": {
      type: "save",
      activationType: "special",
      targetType: "self",
      addItemConsume: true,
      data: {
        save: {
          ability: "con",
          dc: {
            calculation: "",
            formula: "10 + (@item.uses.spent * 5)",
          },
        },
      },
    },
    "Rend Mind": () => {
      if (this.is2014) {
        return {
          addItemConsume: true,
        };
      } else {
        return {
          addItemConsume: true,
          data: {
            save: {
              dc: { formula: "", calculation: "dex" },
              ability: "wis",
            },
          },
        };
      }
    },
    "Retaliation": {
      type: "utility",
      activationType: "reaction",
    },
    "Sear Undead": {
      type: "damage",
      targetType: "creature",
      activationType: "special",
      activationCondition: "When you Turn Undead",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "(@abilities.wis.mod)d8", types: ["radiant"] })],
        },
      },
    },
    "Second Wind": {
      type: "heal",
      addItemConsume: true,
      targetType: "self",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ number: "1", denomination: "10", bonus: "@classes.fighter.levels", types: ["healing"] }),
      },
    },
    "Shifting: Beasthide": {
      type: "heal",
      activationType: "bonus",
      targetType: "self",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "(@prof * 2) + 1d6", types: ["temphp"] }),
      },
    },
    "Shifting: Longtooth": {
      type: "heal",
      activationType: "bonus",
      targetType: "self",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@prof * 2", types: ["temphp"] }),
      },
    },
    "Shifting: Swiftstride": {
      type: "heal",
      activationType: "bonus",
      targetType: "self",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@prof * 2", types: ["temphp"] }),
      },
    },
    "Shifting: Wildhunt": {
      type: "heal",
      activationType: "bonus",
      targetType: "self",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@prof * 2", types: ["temphp"] }),
      },
    },
    "Sneak Attack": {
      type: "damage",
      targetType: "creature",
      activationType: "special",
      noTemplate: true,
      data: {
        "range.units": "spec",
        damage: {
          parts: [
            DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.rogue.sneak-attack", types: DDBBaseEnricher.allDamageTypes() }),
          ],
        },
      },
    },
    "Song of Rest": {
      type: "heal",
      data: {
        duration: {
          value: "1",
          units: "hour",
        },
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.bard.song-of-rest", types: ["healing"] }),
      },
    },
    "Soul Blades: Homing Strikes": {
      name: "Homing Strikes",
      data: {
        img: "systems/dnd5e/icons/svg/damage/force.svg",
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.soulknife.energy-die.die",
          name: "Roll Attack Bonus",
        },
      },
    },
    "Soul Blades: Psychic Teleportation": {
      name: "Psychic Teleportation",
      data: {
        img: "systems/dnd5e/icons/svg/trait-saves.svg",
      },
    },
    "Speedy Recovery": {
      type: "none",
    },
    "Steel Defender": {
      noConsumeTargets: true,
      noTemplate: true,
    },
    "Steps of the Fey": {
      type: "heal",
      targetType: "creature",
      activationType: "special",
      data: {
        name: "Refreshing Step",
        healing: DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 10, types: ["temphp"] }),
      },
    },
    "Stonecunning": {
      name: "Activate Tremorsense",
      type: "utility",
      targetType: "self",
      addItemConsume: true,
      data: {
        duration: {
          value: "10",
          units: "minute",
        },
      },
    },
    "Stone's Endurance": {
      type: "utility",
      activationType: "reaction",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d12 + @abilities.con.mod",
          name: "Reduce Damage Roll",
        },
      },
    },
    "Stone's Endurance (Stone Giant)": {
      type: "utility",
      activationType: "reaction",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d12 + @abilities.con.mod",
          name: "Reduce Damage Roll",
        },
      },
    },
    "Storm Soul: Dessert": {
      type: "utility",
      activationType: "special",
    },
    "Storm Soul: Sea": {
      type: "utility",
      activationType: "special",
    },
    "Storm Soul: Tundra": {
      type: "utility",
      activationType: "special",
    },
    "Storm Soul: Tundra - Freeze Water": {
      data: {
        target: {
          affects: {
            type: "space",
          },
          template: {
            contiguous: false,
            type: "cube",
            size: "5",
            units: "ft",
          },
        },
      },
    },
    "Storm Aura: Desert": {
      type: "damage",
      activationType: "bonus",
      data: {
        "range.units": "self",
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.storm-herald.storm-aura-desert", types: ["fire"] })],
        },
        target: {
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
      },
    },
    "Storm Aura: Sea": {
      type: "save",
      activationType: "bonus",
      data: {
        "range.units": "self",
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.storm-herald.storm-aura-sea", types: ["lightning"] })],
        },
        target: {
          save: {
            ability: "dex",
            dc: {
              calculation: "con",
              formula: "",
            },
          },
          affects: {
            count: "1",
            choice: true,
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
      },
    },
    "Storm Aura: Tundra": {
      type: "heal",
      activationType: "bonus",
      data: {
        "range.units": "self",
        target: {
          affects: {
            type: "ally",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.path-of-the-storm-herald.storm-aura-tundra", types: ["temphp"] }),
      },
    },
    "Storm's Thunder (Storm Giant)": {
      type: "damage",
      targetType: "creature",
      activationType: "reaction",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 8, type: "thunder" })],
        },
      },
    },
    "Stunning Strike": {
      type: "save",
      targetType: "creature",
      activationType: "special",
      data: {
        "range.units": "touch",
        save: {
          ability: "con",
          dc: {
            calculation: "wis",
            formula: "",
          },
        },
      },
    },
    "Superior Inspiration": {
      type: "utility",
      addItemConsume: true,
      itemConsumeValue: "-1",
      activationType: "special",
      data: {
        name: "Regain 1 Use",
      },
    },
    "Surprise Attack": {
      type: "damage",
      targetType: "creature",
      activationType: "special",
      noTemplate: true,
      data: {
        "range.units": "spec",
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 6 })],
        },
      },
    },
    "Survivor": {
      name: "Heroic Rally",
      type: "heal",
      targetType: "self",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "5 + @abilities.con.mod", types: ["healing"] }),
      },
    },
    "Tactical Mind": {
      type: "utility",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d10",
          name: "Roll Ability Check Bonus",
        },
      },
    },
    "Tandem Footwork": {
      type: "utility",
      activationType: "special",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.bard.bardic-inspiration",
          name: "Initiative bonus",
        },
      },
    },
    "Telekinetic Master": {
      type: "utility",
      name: "Spend Energy Die to Regain Use",
      addItemConsume: true,
      activationType: "",
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "",
          value: "-1",
          scaling: {
            mode: "",
            formula: "",
          },
        },
      ],
    },
    "Travel along the Tree": {
      type: "utility",
      targetType: "self",
      activationType: "bonus",
      data: {
        name: "Teleport 60 ft",
        range: {
          value: "60",
          units: "ft",
          special: "",
        },
      },
    },
    "Unbreakable Majesty": {
      type: "utility",
      data: {
        name: "Assume Unbreakable Majesty",
      },
    },
    "Uncanny Dodge": {
      type: "utility",
      activationType: "reaction",
    },
    "Uncanny Metabolism": {
      type: "heal",
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
      itemConsumeValue: "-@scale.monk.focus-points",
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "",
          value: "1",
          scaling: {
            mode: "",
            formula: "",
          },
        },
      ],
    },
    "Vitality of the Tree": {
      type: "heal",
      name: "Vitality Surge",
      targetType: "self",
      rangeSelf: true,
      activationType: "special",
      activationCondition: "You enter a rage.",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@classes.barbarian.levels", types: ["temphp"] }),
      },
    },
    "War Bond": {
      name: "Summon Weapon",
      type: "utility",
      activationType: "bonus",
      targetType: "self",
      noeffect: true,
    },
    "War Caster": {
      type: "utility",
      midiManualReaction: true,
    },
    "War God's Blessing": {
      type: "utility",
    },
    "War Priest": {
      type: "utility",
    },
    "Wholeness of Body": () => {
      const formula = this.is2014
        ? "3@classes.monk.levels"
        : "@scale.monk.martial-arts.die + @abilities.wis.mod";
      return {
        type: "heal",
        targetType: "self",
        data: {
          healing: DDBBaseEnricher.basicDamagePart({ customFormula: formula, type: "healing" }),
        },
      };
    },
    "Wild Resurgence": {
      type: "utility",
      name: "Spend Spell Slot for Wild Shape Use",
      addItemConsume: true,
      itemConsumeValue: "-1",
      activationType: "special",
      activationCondition: "Once on each of your turns",
      data: {
        img: "systems/dnd5e/icons/svg/abilities/intelligence.svg",
      },
      additionalConsumptionTargets: [
        {
          type: "spellSlots",
          value: "1",
          target: "1",
          scaling: { mode: "", formula: "" },
        },
      ],
    },
    "Wild Shape": {
      type: "utility",
      data: {
        duration: {
          value: "(floor(@classes.druid.levels / 2))",
          units: "hour",
        },
        img: "systems/dnd5e/icons/svg/abilities/intelligence.svg",
      },
    },
    "Wrath of the Sea": {
      name: "Activate Emination/Aura",
      type: "utility",
      targetType: "self",
      activationType: "bonus",
      data: {
        target: {
          template: {
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
      },
    },
    "Wrath of the Storm": {
      data: {
        damage: {
          onSave: "half",
          parts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 8, types: ["thunder", "lightning"] })],
        },
      },
    },
  };

  ADDITIONAL_ACTIVITIES = {
    "Brutal Strike": [
      {
        constructor: {
          name: "Hamstrung Blow",
          type: "damage",
        },
        build: {
          generateActivation: true,
          generateDamage: true,
          damageParts: [
            DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.barbarian.brutal-strike" }),
          ],
        },
      },
    ],
    "Combat Inspiration": [
      {
        constructor: {
          name: "Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          damageParts: [
            DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.bard.bardic-inspiration" }),
          ],
        },
      },
    ],
    "Chef": [
      {
        constructor: {
          name: "Create Bolstering Treats",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: "-@prof",
                scaling: {
                  mode: "",
                  formula: "",
                },
              },
            ],
            scaling: {
              allowed: false,
              max: "",
            },
          },
        },
      },
      {
        constructor: {
          name: "Eat Treat",
          type: "heal",
        },
        build: {
          generateHealing: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: true,
          healingPart: DDBBaseEnricher.basicDamagePart({ customFormula: "@prof", type: "temphp" }),
        },
        overrides: {
          addItemConsume: true,
          data: {
            target: {
              affects: {
                count: "1",
                type: "creature",
              },
            },
            range: {
              units: "touch",
            },
          },
        },
      },
    ],
    "Deflect Attacks": () => {
      return [
        { action: { name: "Deflect Attack", type: "class" } },
        { action: { name: "Deflect Attack: Redirect Attack", type: "class" } },
      ];
    },
    "Deflect Energy": () => {
      return [
        { action: { name: "Deflect Attack", type: "class" } },
        {
          action: { name: "Deflect Attack: Redirect Attack", type: "class" },
          override: { data: {
            "damage.types": DDBBaseEnricher.allDamageTypes(),
          } },
        },
      ];
    },
    "Durable": [
      { action: { name: "Speedy Recovery", type: "feat" } },
    ],
    "Eldritch Invocations: Lifedrinker": () => {
      return ["Smallest", "Largest"].map((size) => {
        return {
          constructor: {
            name: `Healing - ${size} Hit Die`,
            type: "heal",
          },
          build: {
            generateConsumption: true,
            generateTarget: false,
            targetSelf: true,
            generateRange: false,
            generateActivation: true,
            generateDamage: false,
            generateHealing: true,
            activationOverride: {
              type: "special",
              value: 1,
              condition: "Once per turn when you hit a creature with your pact weapon",
            },
            healingPart: DDBBaseEnricher.basicDamagePart({ customFormula: `@attributes.hd.${size.toLowerCase()}Available + (max(1,@abilities.con.mod))`, type: "healing" }),
            consumptionOverride: {
              targets: [
                {
                  type: "hitDice",
                  target: size.toLowerCase(),
                  value: 1,
                  scaling: {
                    mode: "",
                    formula: "",
                  },
                },
              ],
              scaling: {
                allowed: false,
                max: "",
              },
            },
          },
        };
      });
    },
    "Elemental Attunement": () => {
      return [
        {
          constructor: {
            name: "Elemental Strike",
            type: "attack",
          },
          build: {
            generateAttack: true,
            generateDamage: true,
            generateRange: true,
            generateTarget: true,
            generateActivation: true,
            generateConsumption: false,
            damageParts: [
              DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.monk.martial-arts.die + @mod", types: ["bludgeoning", "acid", "cold", "fire", "lightning", "thunder"] }),
            ],
          },
          overrides: {
            data: {
              target: {
                affects: {
                  count: "1",
                  type: "creature",
                },
              },
              range: {
                value: 15,
                units: "ft",
              },
              attack: {
                ability: "dex",
                type: {
                  value: "melee",
                  classification: "unarmed",
                },
              },
            },
          },
        },
        {
          constructor: {
            name: "Elemental Save",
            type: "save",
          },
          build: {
            generateSave: true,
            generateRange: false,
            generateTarget: true,
            generateActivation: true,
            generateConsumption: false,
            saveOverride: {
              ability: "str",
              dc: { calculation: "wis", formula: "" },
            },
            activationOverride: {
              type: "special",
              condition: "You deal Elemental Strike damage",
            },
          },
          overrides: {
            data: {
              target: {
                affects: {
                  count: "1",
                  type: "creature",
                },
              },
              range: {
                value: 15,
                units: "ft",
              },
            },
          },
        },
      ];
    },
    "Form of the Beast: Bite": [
      {
        constructor: {
          name: "Healing Bonus (1/your turn)",
          type: "heal",
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          targetSelf: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: false,
          generateHealing: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          healingPart: DDBBaseEnricher.basicDamagePart({ customFormula: "@prof", type: "healing" }),
        },
      },
    ],
    "Form of the Beast: Tail": [
      {
        constructor: {
          name: "Reactive Attack",
          type: "attack",
        },
        build: {
          noTemplate: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: true,
          generateAttack: true,
          activationOverride: {
            type: "reaction",
            value: 1,
            condition: "",
          },
        },
      },
    ],
    "Fleet Step": [
      { action: { name: "Step of the Wind: Fleet Step", type: "class" } },
    ],
    "Giant's Might": [
      {
        constructor: {
          name: "Bonus Damage",
          type: "damage",
        },
        build: {
          noeffect: true,
          generateConsumption: false,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          generateDamage: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 6 })],
        },
      },
    ],
    "Guided Strike": [
      {
        constructor: {
          name: "Other",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          activationOverride: {
            type: "reaction",
            value: 1,
            condition: "",
          },
          targetOverride: {
            affects: {
              type: "ally",
              value: 1,
            },
          },
          rangeOverride: {
            units: "ft",
            value: "30",
          },
        },
      },
    ],
    "Intimidating Presence": [
      {
        constructor: {
          name: "Restore With Rage Use",
          type: "utility",
        },
        build: {
          noeffect: true,
          generateConsumption: true,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
            ],
            scaling: { allowed: false, max: "" },
          },
        },
      },
    ],
    "Invoke Duplicity": [
      {
        constructor: {
          name: "Move Duplicate",
          type: "utility",
        },
        build: {
          generateConsumption: false,
          generateRange: true,
          generateActivation: true,
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "",
          },
          rangeOverride: {
            units: "ft",
            value: "120",
          },
        },
      },
    ],
    "Ki": () => {
      const results = [
        { action: { name: "Flurry of Blows", type: "class", rename: ["Flurry of Blows"] }, overrides: { addItemConsume: true } },
        { action: { name: "Patient Defense", type: "class" } },
        { action: { name: "Step of the Wind", type: "class", rename: ["Step of the Wind"] }, overrides: { addItemConsume: true } },
      ];
      return results;
    },
    "Land's Aid": [
      {
        constructor: {
          name: "Healing",
          type: "heal",
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateHealing: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          healingPart: DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.land.lands-aid", types: ["healing"] }),
          targetOverride: {
            affects: {
              type: "ally",
              value: 1,
            },
            template: {
              count: "",
              contiguous: false,
              type: "",
              size: "",
              width: "",
              height: "",
              units: "",
            },
          },
        },
      },
    ],
    "Maneuver: Tactical Assessment": [
      {
        constructor: {
          name: "Bonus Dice Effect",
          type: "utility",
        },
        build: {
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
        },
      },
    ],
    "Natural Recovery": () => {
      return [
        {
          constructor: {
            name: "Recover Spell Slots",
            type: "ddbmacro",
          },
          build: {
            generateConsumption: true,
            generateRange: true,
            generateTarget: true,
            generateUses: true,
            generateDDBMacro: true,
            usesOverride: this._getUsesWithSpent({ type: "class", name: "Natural Recovery: Recover Spell Slots", max: 1, period: "lr" }),
            targetOverride: {
              affects: {
                type: "self",
              },
            },
            rangeOverride: {
              units: "self",
            },
            consumptionOverride: {
              targets: [
                {
                  type: "activityUses",
                  target: "",
                  value: "1",
                  scaling: { mode: "", formula: "" },
                },
              ],
              scaling: { allowed: false, max: "" },
            },
            ddbMacroOverride: {
              name: "Natural Recovery",
              function: "ddb.feat.naturalRecovery",
              visible: false,
              parameters: "",
            },
          },
        },
      ];
    },
    "Observant": [
      { action: { name: "Quick Search", type: "feat", rename: ["Quick Search"] } },
    ],
    "Open Hand Technique": () => {
      if (this.is2024) {
        return [
          { action: { name: "Flurry of Blows: Addle", type: "class", rename: ["Addle"] } },
          { action: { name: "Flurry of Blows: Push", type: "class", rename: ["Push"] } },
          { action: { name: "Flurry of Blows: Topple", type: "class", rename: ["Topple"] } },
        ];
      }
      return [];
    },
    "Physician's Touch": () => {
      return [
        { action: { name: "Hand of Healing", type: "class", rename: ["Hand of Healing"] } },
        { action: { name: "Hand of Harm", type: "class", rename: ["Hand of Harm"] } },
      ];
    },
    "Poisoner": () => {
      const results = [{
        constructor: {
          name: "Apply Poison",
          type: "utility",
        },
        build: {
          img: "icons/skills/toxins/poison-bottle-corked-fire-green.webp",
          generateConsumption: true,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateUtility: true,
          noeffect: true,
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "",
          },
          targetOverride: {
            affects: {
              type: "creature",
              value: 1,
            },
          },
          consumptionOverride: {
            targets: [{
              type: "itemUses",
              target: "",
              value: 1,
              scaling: {
                mode: "",
                formula: "",
              },
            }],
            scaling: { allowed: false, max: "" },
          },
        },
      }];
      if (this.is2014) {
        results.push({
          constructor: {
            name: "Poison Save",
            type: "save",
          },
          build: {
            generateConsumption: false,
            generateTarget: true,
            generateSave: true,
            generateRange: false,
            generateActivation: true,
            generateDamage: true,
            activationOverride: {
              type: "special",
              value: 1,
              condition: "",
            },
            damageParts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 8, type: "poison" })],
            saveOverride: {
              ability: "con",
              dc: {
                formula: "14",
                calculation: "",
              },
            },
          },
        });
      } else {
        results.push(
          {
            constructor: {
              name: "Poison Save (Dexterity)",
              type: "save",
            },
            build: {
              generateConsumption: false,
              generateTarget: true,
              generateSave: true,
              generateRange: false,
              generateActivation: true,
              generateDamage: true,
              activationOverride: {
                type: "special",
                value: 1,
                condition: "",
              },
              damageParts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 8, type: "poison" })],
              saveOverride: {
                ability: "con",
                dc: {
                  formula: "",
                  calculation: "dex",
                },
              },
            },
          },
          {
            constructor: {
              name: "Poison Save (Intelligence)",
              type: "save",
            },
            build: {
              generateConsumption: false,
              generateTarget: true,
              generateSave: true,
              generateRange: false,
              generateActivation: true,
              generateDamage: true,
              activationOverride: {
                type: "special",
                value: 1,
                condition: "",
              },
              damageParts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 8, type: "poison" })],
              saveOverride: {
                ability: "con",
                dc: {
                  formula: "",
                  calculation: "int",
                },
              },
            },
          },
        );
      }

      return results;
    },
    "Psionic Power": () => {
      const results = [];
      if (this.ddbParser.subKlass === "Soulknife") {
        results.push(
          { action: { name: "Psionic Power: Psychic Whispers", type: "class" } },
        );
      } else {
        results.push(
          { action: { name: "Psionic Power: Psionic Strike", type: "class" } },
          { action: { name: "Psionic Power: Telekinetic Movement", type: "class" } },
        );
      }

      if (this.is2014) {
        results.push({
          action: { name: "Psionic Power: Recovery", type: "class" },
        });
      }
      return results;
    },
    "Psychic Blades: Attack": [
      {
        constructor: {
          name: "Bonus Action Attack",
          type: "attack",
        },
        build: {
          generateAttack: true,
          generateConsumption: false,
          includeBase: false,
          generateTarget: true,
          generateDamage: true,
          attackOverride: {
            ability: "cha",
            type: {
              value: "melee",
              classification: "weapon",
            },
          },
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 4, type: "psychic" })],
          activationOverride: {
            type: "bonus",
            value: 1,
          },
        },
      },
    ],
    "Relentless Rage": [
      {
        constructor: {
          name: "Apply Healing",
          type: "heal",
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          targetSelf: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: false,
          generateHealing: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          healingPart: DDBBaseEnricher.basicDamagePart({ customFormula: "@classes.barbarian.levels * 2", type: "healing" }),
        },
      },
    ],
    // "Rend Mind": () => {
    //   return this.is2014
    //     ? [

    //     ]
    //     : [
    //       { action: { name: "Psychic Blades: Rend Mind", type: "class" } },
    //     ];
    // },
    "Shifting: Longtooth": [
      {
        constructor: {
          name: "Longtooth Attack",
          type: "attack",
        },
        build: {
          generateAttack: true,
          generateConsumption: false,
          generateTarget: true,
          generateDamage: true,
          attackOverride: {
            ability: "str",
            type: {
              value: "melee",
              classification: "weapon",
            },
          },
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 6, type: "piercing" })],
          activationOverride: {
            type: "bonus",
            value: 1,
          },
        },
      },
    ],
    "Summon Wildfire Spirit": [
      {
        constructor: {
          name: "Wildfire Summoning Damage",
          type: "save",
        },
        build: {
          noeffect: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: true,
          generateSave: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          saveOverride: {
            ability: "dex",
            dc: {
              calculation: "spellcasting",
              formula: "",
            },
          },
          targetOverride: {
            template: {
              count: "",
              contiguous: false,
              type: "radius",
              size: "10",
              width: "",
              height: "",
              units: "ft",
            },
            affects: {
              count: "",
              type: "creature",
              choice: false,
              special: "",
            },
          },
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 6, type: "fire" })],
        },
      },
    ],
    "Soul Blades": () => {
      return this.is2014
        ? [
          { action: { name: "Soul Blades: Homing Strikes", type: "class" } },
          { action: { name: "Soul Blades: Psychic Teleportation", type: "class" } },
        ]
        : [
          { action: { name: "Psychic Blades: Homing Strikes", type: "class" } },
          { action: { name: "Psychic Teleportation", type: "class" } },
        ];
    },
    "Speedy Recovery": () => {
      return ["Smallest", "Largest"].map((size) => {
        return {
          constructor: {
            name: `Healing - ${size} Hit Die`,
            type: "heal",
          },
          build: {
            generateConsumption: true,
            generateTarget: false,
            targetSelf: true,
            generateRange: false,
            generateActivation: true,
            generateDamage: false,
            generateHealing: true,
            activationOverride: {
              type: "bonus",
            },
            healingPart: DDBBaseEnricher.basicDamagePart({ customFormula: `@attributes.hd.${size.toLowerCase()}Available`, type: "healing" }),
            consumptionOverride: {
              targets: [
                {
                  type: "hitDice",
                  target: size.toLowerCase(),
                  value: 1,
                  scaling: {
                    mode: "",
                    formula: "",
                  },
                },
              ],
              scaling: {
                allowed: false,
                max: "",
              },
            },
          },
        };
      });
    },
    "Steps of the Fey": [
      {
        constructor: {
          name: "Taunting Step",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              type: "creatures",
            },
            template: {
              contiguous: false,
              type: "radius",
              size: "5",
              width: "",
              height: "",
              units: "ft",
            },
          },
        },
      },
    ],
    "Travel along the Tree": [
      {
        constructor: {
          name: "Group Teleport",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          generateActivation: true,
          targetOverride: {
            affects: {
              count: "7",
              type: "willing",
              special: "Within 10 feet of you.",
            },
          },
          rangeOverride: {
            value: "150",
            units: "ft",
          },
          durationOverride: {
            units: "inst",
          },
          activationOverride: {
            type: "bonus",
          },
        },
      },
    ],
    "Tavern Brawler": [
      { action: { name: "Enhanced Unarmed Strike", type: "feat", rename: ["Enhanced Unarmed Strike"] } },
    ],
    "Telekinetic Adept": () => {
      return this.is2024
        ? [
          { action: { name: "Psionic Power: Psi-Powered Leap", type: "class" } },
          { action: { name: "Psionic Power: Telekinetic Thrust", type: "class" } },
        ]
        : [
          { action: { name: "Telekinetic Adept: Psi-Powered Leap", type: "class" } },
          { action: { name: "Telekinetic Adept: Telekinetic Thrust", type: "class" } },
        ];
    },
    "Unbreakable Majesty": [
      {
        constructor: {
          name: "Save",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateTarget: true,
          generateActivation: true,
          durationOverride: {
            value: "",
            units: "spec",
          },
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              value: "1",
              type: "creatures",
            },
            template: {
              contiguous: false,
              type: "",
              size: "",
              width: "",
              height: "",
              units: "",
            },
          },
        },
      },
    ],
    "Vitality of the Tree": [
      {
        constructor: {
          name: "Life-Giving Force",
          type: "heal",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateHealing: true,
          generateActivation: true,
          generateRange: true,
          rangeOverride: {
            value: "10",
            units: "ft",
          },
          activationOverride: {
            type: "special",
            value: 1,
            condition: "At the start of each of your turns (whilst raging)",
          },
          targetOverride: {
            affects: {
              value: "1",
              type: "ally",
            },
          },
          healingPart: DDBBaseEnricher.basicDamagePart({ customFormula: "(@scale.barbarian.rage-damage)d4", type: "temphp" }),
        },
      },
    ],
    "War Bond": [
      {
        constructor: {
          name: "Bond, 1st Weapon",
          type: "enchant",
        },
        build: {
          generateActivation: true,
          generateRange: true,
          generateConsumption: true,
          activationOverride: {
            value: "1",
            units: "hour",
          },
          rangeOverride: {
            units: "self",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: 1,
                scaling: { mode: "", formula: "" },
              },
            ],
          },
          data: {
            restrictions: {
              type: "weapon",
              allowMagical: true,
            },
          },
        },
      },
      {
        constructor: {
          name: "Bond, 2nd Weapon",
          type: "enchant",
        },
        build: {
          generateActivation: true,
          generateRange: true,
          generateConsumption: true,
          activationOverride: {
            value: "1",
            units: "hour",
          },
          rangeOverride: {
            units: "self",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: 1,
                scaling: { mode: "", formula: "" },
              },
            ],
          },
          data: {
            restrictions: {
              type: "weapon",
              allowMagical: true,
            },
          },
        },
      },
    ],
    "Wild Resurgence": () => {
      const uses = this._getUsesWithSpent({
        type: "class",
        name: "Wild Resurgence: Regain Spell Slot",
        max: 1,
        period: "lr",
        override: true,
      });
      return [
        {
          constructor: {
            name: "Spend Wild Shape to Regain Spell Slot",
            type: "utility",
          },
          build: {
            img: "systems/dnd5e/icons/svg/trait.svg",
            generateConsumption: true,
            generateTarget: true,
            generateUses: true,
            consumptionOverride: {
              targets: [
                {
                  type: "itemUses",
                  target: "",
                  value: 1,
                  scaling: { mode: "", formula: "" },
                },
                {
                  type: "activityUses",
                  target: "",
                  value: 1,
                  scaling: { mode: "", formula: "" },
                },
                {
                  type: "spellSlots",
                  value: "-1",
                  target: "1",
                  scaling: {},
                },
              ],
              scaling: { allowed: true, max: "9" },
            },
            targetOverride: {
              affects: {
                value: "1",
                type: "self",
              },
            },
            usesOverride: uses,
          },
        },
      ];
    },
    "Wrath of the Sea": [
      {
        constructor: {
          name: "Save for Damage",
          type: "save",
        },
        build: {
          generateActivation: true,
          activationOverride: {
            type: "bonus",
          },
          generateTarget: true,
          targetOverride: {
            affects: {
              value: "1",
              type: "self",
            },
          },
          generateDamage: true,
          damageParts: [DDBBaseEnricher.basicDamagePart({ customFormula: "(@abilities.wis.mod)d6", types: ["cold"] })],
          generateSave: true,
          saveOverride: {
            ability: "con",
            dc: { calculation: "spellcasting", formula: "" },
          },
        },
      },
    ],
  };

  DOCUMENT_OVERRIDES = {
    "Action Surge": {
      removeDamage: true,
    },
    "Arcane Propulsion Armor Gauntlet": () => {
      return {
        data: {
          "system.properties": utils.addToProperties(this.data.system.properties, "mgc"),
        },
      };
    },
    "Arms of the Astral Self (DEX/STR)": {
      data: {
        name: "Arms of the Astral Self",
      },
    },
    "Chef": {
      data: {
        "flags.ddbimporter": {
          retainOriginalConsumption: true,
        },
        system: {
          uses: {
            spent: "0",
            max: "@prof",
            recovery: [
              { period: "lr", type: "recoverAll", formula: undefined },
            ],
          },
        },
      },
    },
    "Combat Superiority": () => {
      const uses = this._getUsesWithSpent({
        type: "class",
        name: "Superiority Dice",
        max: "@scale.battle-master.combat-superiority-uses",
        period: "lr",
      });
      return {
        data: {
          "system.uses": uses,
        },
      };
    },
    "Deflect Attacks": {
      data: {
        "flags.ddbimporter": {
          ignoredConsumptionActivities: ["Reduce Damage"],
        },
      },
    },
    "Deflect Energy": {
      data: {
        "flags.ddbimporter": {
          ignoredConsumptionActivities: ["Reduce Damage"],
        },
      },
    },
    "Drake Companion": {
      data: {
        "system.uses.max": "",
        "system.uses.recovery": [],
      },
    },
    "Eldritch Cannon: Flamethrower": {
      data: {
        "system.uses": { value: null, max: null },
      },
    },
    "Eldritch Cannon: Force Ballista": {
      data: {
        "system.uses": { value: null, max: null },
      },
    },
    "Eldritch Cannon: Protector": {
      data: {
        "system.uses": { value: null, max: null },
      },
    },
    "Elemental Attunement": {
      data: {
        "flags.ddbimporter.ignoredConsumptionActivities": [
          "Elemental Strike",
          "Elemental Save",
        ],
      },
    },
    "Epic Boon: Choose an Epic Boon feat": {
      data: {
        "name": "Epic Boon",
      },
    },
    "Flurry of Blows: Addle": {
      data: {
        "flags.ddbimporter.retainResourceConsumption": true,
      },
    },
    "Flurry of Blows: Push": {
      data: {
        "flags.ddbimporter.retainResourceConsumption": true,
      },
    },
    "Flurry of Blows: Topple": {
      data: {
        "flags.ddbimporter.retainResourceConsumption": true,
      },
    },
    // "Font of Magic: Convert Spell Slots": {
    //   data: {
    //     name: "Convert Spell Slots",
    //   },
    // },
    "Font of Magic: Sorcery Points": {
      data: {
        "name": "Sorcery Points",
      },
    },
    "Form of the Beast: Bite": () => {
      return {
        data: {
          "system.properties": (this.hasClassFeature({ featureName: "Bestial Soul" })
            ? utils.addToProperties(this.data.system.properties, "mgc")
            : this.data.system.properties),
        },
      };
    },
    "Form of the Beast: Claws": () => {
      return {
        data: {
          "system.properties": (this.hasClassFeature({ featureName: "Bestial Soul" })
            ? utils.addToProperties(this.data.system.properties, "mgc")
            : this.data.system.properties),
        },
      };
    },
    "Form of the Beast: Tail": () => {
      return {
        data: {
          "system.properties": (this.hasClassFeature({ featureName: "Bestial Soul" })
            ? utils.addToProperties(this.data.system.properties, "mgc")
            : this.data.system.properties),
        },
      };
    },
    "Harness Divine Power": {
      data: {
        "flags.ddbimporter.retainOriginalConsumption": true,
      },
    },
    "Hypnotic Gaze": {
      data: {
        "system.uses": {
          value: null,
          max: null,
          recovery: [],
        },
      },
    },
    "Intimidating Presence": {
      data: {
        "flags.ddbimporter": {
          ignoredConsumptionActivities: ["Save"],
          retainOriginalConsumption: true,
          retainChildUses: true,
        },
      },
    },
    "Ki": () => {
      return {
        data: {
          "system.uses": this._getUsesWithSpent({
            type: "class",
            name: "Ki Points",
            max: "@scale.monk.ki-points",
            period: "sr",
          }),
        },
      };
    },
    "Land's Aid": {
      data: {
        "flags.ddbimporter.ignoredConsumptionActivities": ["Healing"],
      },
    },
    "Large Form": () => {
      return {
        data: {
          "system.uses": {
            value: this.ddbParser?.ddbData?.character.actions.race.find((a) => a.name === "Activate Large Form")?.limitedUse?.numberUsed ?? null,
            max: 1,
            recovery: [{ period: "lr", type: 'recoverAll', formula: undefined }],
          },
        },
      };
    },
    "Lay on Hands Pool": {
      data: {
        name: "Lay On Hands",
      },
    },
    "Lucky": () => {
      const uses = this._getUsesWithSpent({
        type: "feat",
        name: "Luck Points",
        max: this.is2014 ? 3 : "@prof",
        period: "lr",
      });
      return {
        data: {
          "system.uses": uses,
        },
      };
    },
    "Maneuver: Disarming Attack (Str.)": {
      data: {
        name: "Maneuver: Disarming Attack",
      },
    },
    "Maneuver: Goading Attack (Str.)": {
      data: {
        name: "Maneuver: Goading Attack",
      },
    },
    "Maneuver: Menacing Attack (Str.)": {
      data: {
        name: "Maneuver: Menacing Attack",
      },
    },
    "Maneuver: Parry (Str.)": {
      data: {
        name: "Maneuver: Parry",
      },
    },
    "Maneuver: Pushing Attack (Str.)": {
      data: {
        name: "Maneuver: Pushing Attack",
      },
    },
    "Maneuver: Trip Attack (Str.)": {
      data: {
        name: "Maneuver: Trip Attack",
      },
    },
    "Partially Amphibious": {
      data: {
        "system.uses": {
          spent: 0,
          max: "1",
          recovery: [
            {
              period: "lr",
              type: "recoverAll",
            },
          ],
        },
        "flags.midiProperties.toggleEffect": true,
      },
    },
    "Poisoner": {
      data: {
        "system.uses": {
          spent: 0,
          max: "20",
        },
        "flags.ddbimporter": {
          retainUseSpent: true,
        },
      },
    },
    "Psychic Blades: Attack": () => {
      return {
        data: {
          name: "Psychic Blades",
          system: {
            mastery: "vex",
            range: {
              long: 120,
            },
            "type.value": "simpleM",
            properties: ["fin", "thr"].concat(this.data.system.properties ?? []),
          },
        },
      };
    },
    "Psionic Power": () => {
      const spent = this.ddbParser.subKlass === "Soulknife"
        ? this._getSpentValue("class", "Psionic Power: Psionic Energy Dice", "Soulknife")
        : this._getSpentValue("class", "Psionic Power: Psionic Energy Dice", "Psi Warrior");

      const recovery = [
        { period: "lr", type: 'recoverAll', formula: undefined },
      ];
      if (!this.is2014) {
        recovery.push({ period: "sr", type: 'formula', formula: "1" });
      }
      const subclass = this.ddbParser.subKlass === "Soulknife"
        ? "soulknife"
        : "psi-warrior";

      return {
        data: {
          "system.uses": {
            spent,
            max: this.is2014 ? "@prof * 2" : `@scale.${subclass}.energy-die.number`,
            recovery,
          },
        },
      };

    },
    "Persistent Rage": () => {
      return {
        data: {
          "system.uses": this._getUsesWithSpent({
            type: "class",
            name: "Rage: Regain Expended Uses",
            max: "1",
            period: "lr",
          }),
          "flags.ddbimporter": {
            retainOriginalConsumption: true,
            consumptionValue: "-@scale.barbarian.rages",
            retainChildUses: true,
          },
        },
      };
    },
    "Relentless Rage": {
      data: {
        "system.uses": {
          spent: 0,
          max: "30",
          recovery: [
            {
              period: "lr",
              type: "recoverAll",
            },
          ],
        },
        "flags.ddbimporter": {
          retainResourceConsumption: true,
          retainUseSpent: true,
        },
      },
    },
    "Rend Mind": () => {
      const uses = this._getUsesWithSpent({
        type: "class",
        name: "Psychic Blades: Rend Mind",
        max: "1",
        period: "lr",
      });

      return {
        data: {
          "system.uses": uses,
        },
      };
    },
    "Sear Undead": {
      data: {
        "system.type.subtype": "channelDivinity",
      },
    },
    "Second Wind": () => {
      const result = {
        data: {},
      };
      if (this.is2024) {
        const recovery = foundry.utils.deepClone(this.data.system.uses.recovery ?? []);
        if (recovery.length === 0) recovery.push({ period: "lr", type: 'recoverAll' });
        recovery.push({ period: "sr", type: 'formula', formula: "1" });
        result.data = {
          "system.uses.recovery": recovery,
        };
      }
      return result;
    },
    "Shifting": () => {
      return {
        data: {
          "system.uses": this._getUsesWithSpent({
            type: "race",
            name: "Shift",
            max: "@prof",
          }),
        },
      };
    },
    "Shifting: Beasthide": () => {
      return {
        data: {
          "system.uses": this._getUsesWithSpent({
            type: "race",
            name: "Shift",
            max: "@prof",
          }),
        },
      };
    },
    "Shifting: Longtooth": () => {
      return {
        data: {
          "system.uses": this._getUsesWithSpent({
            type: "race",
            name: "Shift",
            max: "@prof",
          }),
        },
      };
    },
    "Shifting: Swiftstride": () => {
      return {
        data: {
          "system.uses": this._getUsesWithSpent({
            type: "race",
            name: "Shift",
            max: "@prof",
          }),
        },
      };
    },
    "Shifting: Wildhunt": () => {
      return {
        data: {
          "system.uses": this._getUsesWithSpent({
            type: "race",
            name: "Shift",
            max: "@prof",
          }),
        },
      };
    },
    "Steel Defender": {
      data: {
        "system.uses": {
          spent: null,
          max: "",
          recovery: [],
        },
      },
    },
    "Stonecunning": () => {
      return {
        data: {
          "system.uses": this._getUsesWithSpent({
            type: "race",
            name: "Stonecunning (Tremorsense)",
            max: "@prof",
            period: "lr",
          }),
        },
      };
    },
    "Summon Wildfire Spirit: Command": {
      data: {
        "system.uses": {
          spent: null,
          max: "",
        },
      },
    },
    "Telekinetic Master": () => {
      return {
        data: {
          "flags.ddbimporter.retainChildUses": true,
          "system.uses": this._getUsesWithSpent({
            type: "class",
            name: "Telekinetic Master: Weapon Attack",
            max: "1",
            period: "lr",
          }),
        },
      };
    },
    "Unbreakable Majesty": () => {
      return {
        data: {
          "system.uses": this._getUsesWithSpent({
            type: "class",
            name: "Assume Unbreakable Majesty",
            max: "1",
            period: "sr",
          }),
        },
      };
    },
    "Uncanny Metabolism": {
      data: {
        "flags.ddbimporter": {
          retainChildUses: true,
        },
      },
    },
    "War Bond": {
      data: {
        "flags.ddbimporter": {
          retainUseSpent: true,
        },
        "system.uses": {
          spent: 0,
          max: 2,
        },
      },
    },
    "War Priest": () => {
      const uses = this._getUsesWithSpent({
        type: "class",
        name: "War Priest: Bonus Attack",
        max: "max(1, @abilities.wis.mod)",
        period: "sr",
      });

      return {
        data: {
          "system.uses": uses,
        },
      };
    },
    "Wild Shape": {
      data: {
        "system.uses.max": "@scale.druid.wild-shape-uses",
      },
    },
  };

  EFFECT_HINTS = {
    "Aura of": () => {
      return {
        noCreate: true,
        data: {
          flags: {
            "dae.stackable": "noneName",
            ActiveAuras: {
              aura: "Allies",
              radius: `@scale.paladin.${this.data.name.toLowerCase().replaceAll(" ", "-")}`,
              isAura: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
      };
    },
    "Bardic Inspiration": {
      options: {
        durationSeconds: 600,
      },
    },
    "Battering Roots": {
      options: {
        transfer: true,
      },
      changes: [
        generateUnsignedAddChange("push", 20, "system.traits.weaponProf.mastery.bonus"),
        generateUnsignedAddChange("topple", 20, "system.traits.weaponProf.mastery.bonus"),
      ],
    },
    "Blessing of the Trickster": {
      options: {
        description: "Advantage on Dexterity (Stealth) checks.",
      },
    },
    "Circle Forms": {
      name: "Circle Form AC",
      options: {
        description: "You gain a minimum AC of 13 + your Wisdom modifier.",
      },
      changes: [
        generateUpgradeChange("13 + @abilities.wis.mod", 20, "system.attributes.ac.min"),
      ],
    },
    "Cloak of Shadows": {
      name: "Invisible",
      options: {
        durationSeconds: 60,
      },
      statuses: ["Invisible"],
    },
    "Diamond Soul": {
      options: {
        transfer: true,
      },
      changes: [
        generateOverrideChange("true", 20, "flags.dnd5e.diamondSoul"),
      ],
    },
    "Disciplined Survivor": {
      clearAutoEffects: true,
    },
    "Draconic Resilience": {
      noCreate: true,
      changesOverwrite: true,
      changes: [
        generateUnsignedAddChange("1 * @classes.sorcerer.levels", 20, "system.attributes.hp.bonuses.overall"),
        generateOverrideChange("draconic", 20, "system.attributes.ac.calc"),
      ],
    },
    "Dual Wielder": {
      options: {
        transfer: true,
      },
      changes: [
        generateOverrideChange("true", 20, "flags.dnd5e.enhancedDualWielding"),
      ],
    },
    "Divine Order: Thaumaturge": {
      noCreate: true,
      changes: [
        generateUnsignedAddChange("1", 20, "system.scale.cleric.cantrips-known.value"),
      ],
    },
    "Eldritch Invocations: Pact of the Blade": {
      type: "enchant",
      changes: [
        generateOverrideChange(`{} [Pact Weapon]`, 20, "name"),
        generateUnsignedAddChange("necrotic", 20, "system.damage.base.types"),
        generateUnsignedAddChange("psychic", 20, "system.damage.base.types"),
        generateUnsignedAddChange("radiant", 20, "system.damage.base.types"),
        generateUnsignedAddChange("true", 20, "system.proficient"),
        generateOverrideChange("cha", 20, "system.ability"),
      ],
    },
    "Eldritch Strike": {
      name: "Struck",
      options: {
        description: "",
      },
    },
    "Elemental Attunement": {
      name: "Elemental Attunement",
      data: {
        "flags.ddbimporter.activityMatch": "Elemental Attunement",
      },
    },
    "Elven Accuracy": {
      options: {
        transfer: true,
      },
      changes: [
        generateOverrideChange("true", 20, "flags.dnd5e.elvenAccuracy"),
      ],
    },
    "Empowered Strikes": {
      clearAutoEffects: true,
    },
    "Empty Body": () => {
      return {
        options: {
          durationSeconds: 60,
        },
        statuses: ["invisible"],
        changes: [
          "acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "poison", "psychic", "radiant",
          "thunder", "piercing", "slashing",
        ].map((element) =>
          generateUnsignedAddChange(element, 20, "system.traits.dr.value"),
        ),
      };
    },
    "Flurry of Blows: Topple": {
      name: "Prone",
      statuses: ["Prone"],
    },
    "Full of Stars": {
      changes: [
        generateUnsignedAddChange("bludgeoning", 20, "system.traits.dr.value"),
        generateUnsignedAddChange("piercing", 20, "system.traits.dr.value"),
        generateUnsignedAddChange("slashing", 20, "system.traits.dr.value"),
      ],
    },
    "Frost's Chill (Frost Giant)": {
      changes: [
        generateSignedAddChange("-10", 20, "system.attributes.movement.walk"),
      ],
    },
    "Giant's Might": {
      options: {
        durationSeconds: 60,
        description: "You also gain advantage on Strength checks and saving throws.",
      },
      atlChanges: [
        generateATLChange("ATL.width", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 2, 5),
        generateATLChange("ATL.height", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 2, 5),
      ],
      changes: [
        generateOverrideChange("lg", 25, "system.traits.size"),
      ],
    },
    "Halfling Lucky": {
      options: {
        transfer: true,
      },
      changes: [
        generateOverrideChange("true", 20, "flags.dnd5e.halflingLucky"),
      ],
    },
    "Heightened Focus": {
      clearAutoEffects: true,
    },
    "Brutal Strike": {
      name: "Hamstrung",
      changes: [
        generateOverrideChange("-15", 90, "system.attributes.movement.walk"),
      ],
      data: {
        "flags.ddbimporter.activityMatch": "Hamstrung Blow",
      },
    },
    "Hold Breath": {
      data: {
        "duration.rounds": 600,
      },
    },
    "Hill's Tumble (Hill Giant)": {
      statuses: ["Prone"],
    },
    "Innate Sorcery": {
      changes: [
        generateUnsignedAddChange("1", 20, "system.bonuses.spell.dc"),
      ],
    },
    "Improved Circle Forms": {
      noCreate: true,
    },
    "Improved Critical": {
      options: {
        transfer: true,
      },
      changes: [
        generateDowngradeChange("19", 20, "flags.dnd5e.weaponCriticalThreshold"),
      ],
    },
    "Jack of All Trades": {
      options: {
        transfer: true,
      },
      changes: [
        generateOverrideChange("true", 20, "flags.dnd5e.jackOfAllTrades"),
      ],
    },
    "Large Form": {
      changes: [
        generateOverrideChange("lg", 25, "system.traits.size"),
      ],
      atlChanges: [
        generateOverrideChange("2", 30, "ATL.width"),
        generateOverrideChange("2", 30, "ATL.height"),
      ],
    },
    "Maneuver: Ambush": {
      changes: [
        generateUnsignedAddChange("@scale.battle-master.combat-superiority-die", 20, "system.attributes.init.bonus"),
      ],
    },
    "Maneuver: Bait and Switch": {
      changes: [
        generateUnsignedAddChange("@scale.battle-master.combat-superiority-die", 20, "system.attributes.ac.bonus"),
      ],
    },
    "Maneuver: Evasive Footwork": {
      changes: [
        generateUnsignedAddChange("@scale.battle-master.combat-superiority-die", 20, "system.attributes.ac.bonus"),
      ],
    },
    // Future Enhancement: Add a macro that rolls dice and applies dr effect
    // "Maneuver: Parry": {
    //   changes: [
    //     {
    //       key: "system.traits.dm.amount.bludgeoning",
    //       value: "-@scale.battle-master.combat-superiority-die",
    //       mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    //       priority: 20,
    //     },
    //     {
    //       key: "system.traits.dm.amount.piercing",
    //       value: "-@scale.battle-master.combat-superiority-die",
    //       mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    //       priority: 20,
    //     },
    //     {
    //       key: "system.traits.dm.amount.slashing",
    //       value: "-@scale.battle-master.combat-superiority-die",
    //       mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    //       priority: 20,
    //     },
    //   ],
    // },
    "Maneuver: Tactical Assessment": {
      name: "Tactical Assessment Bonus",
      changes: [
        generateUnsignedAddChange("@scale.battle-master.combat-superiority-die", 20, "system.skills.his.bonuses.check"),
        generateUnsignedAddChange("@scale.battle-master.combat-superiority-die", 20, "system.skills.inv.bonuses.check"),
        generateUnsignedAddChange("@scale.battle-master.combat-superiority-die", 20, "system.skills.ins.bonuses.check"),
      ],
    },
    "Mindless Rage": {
      // options: {
      //   transfer: true,
      //   disabled: true,
      // },
      changes: [
        generateUnsignedAddChange("frighened", 20, "system.traits.ci.value"),
        generateUnsignedAddChange("charmed", 20, "system.traits.ci.value"),
      ],
    },
    "Momentary Stasis": {
      options: {
        durationRounds: 1,
      },
      changes: [
        generateOverrideChange("*0", 90, "system.attributes.movement.all"),
        generateOverrideChange("0", 90, "system.attributes.movement.walk"),
        generateOverrideChange("0", 90, "system.attributes.movement.fly"),
        generateOverrideChange("0", 90, "system.attributes.movement.swim"),
        generateOverrideChange("0", 90, "system.attributes.movement.climb"),
      ],
      statuses: ["incapacitated"],
    },
    "Moonlight Step": {
      name: "Moonlight Step: Advantage on Next Attack",
      options: {
        description: "You have Advantage on the next attack roll you make before the end of this turn.",
      },
    },
    "Nature's Ward": () => {
      const multiple = [
        {
          name: "Poison Immunity",
          options: {
            transfer: true,
          },
          changes: [
            generateUnsignedAddChange("poisoned", 20, "system.traits.ci.value"),
          ],
        },
      ];
      const activeType = this.ddbParser?._chosen.find((a) =>
        utils.nameString(a.label).startsWith("Nature's Ward"),
      )?.label ?? "";
      [
        { type: "fire", origin: "Arid" },
        { type: "cold", origin: "Polar" },
        { type: "lightning", origin: "Temperate" },
        { type: "poison", origin: "Tropical" },
      ].forEach((effect) => {
        multiple.push({
          name: `${effect.origin}: Resistance to ${effect.type}`,
          options: {
            transfer: true,
            disabled: !activeType.includes(effect.origin),
          },
          changes: [
            generateUnsignedAddChange(effect.type, 20, "system.traits.dr.value"),
          ],
        });
      });
      return {
        clearAutoEffects: true,
        multiple,
      };
    },
    "Observant": {
      options: {
        transfer: true,
      },
      changes: [
        generateOverrideChange("true", 20, "flags.dnd5e.observantFeat"),
      ],
    },
    "Partially Amphibious": {
      data: {
        "duration.rounds": 600,
      },
    },
    "Physician's Touch": {
      name: "Poisoned",
      statuses: ["Poisoned"],
      data: {
        "flags.ddbimporter.activitiesMatch": ["Hand of Harm"],
      },
    },
    "Poisoner": {
      name: "Poisoned",
      statuses: ["Poisoned"],
      data: {
        "flags.ddbimporter.activitiesMatch": ["Poison Save", "Poison Save (Dexterity)", "Poison Save (Intelligence)"],
      },
    },
    "Powerful Build": {
      options: {
        transfer: true,
      },
      changes: [
        generateOverrideChange("true", 20, "flags.dnd5e.powerfulBuild"),
      ],
    },
    "Psionic Power: Telekinetic Thrust": {
      name: "Telekinetic Thrust: Prone",
      statuses: ["Prone"],
    },
    "Raging Storm: Tundra": {
      changes: [
        generateCustomChange("*0", 20, "system.attributes.movement.all"),
        generateOverrideChange("0", 60, "system.attributes.movement.walk"),
        generateOverrideChange("0", 60, "system.attributes.movement.fly"),
      ],
    },
    "Reckless Attack": {
      name: "Attacking Recklessly",
    },
    "Reliable Talent": {
      options: {
        transfer: true,
      },
      changes: [
        {
          key: "flags.dnd5e.reliableTalent",
          value: "true",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 20,
        },
        generateOverrideChange("true", 20, "flags.dnd5e.reliableTalent"),
      ],
    },
    "Remarkable Athlete": {
      options: {
        transfer: true,
      },
      changes: [
        generateOverrideChange("true", 20, "flags.dnd5e.remarkableAthlete"),
      ],
    },
    "Shadow Arts": {
      clearAutoEffects: true,
      options: {
        transfer: true,
      },
      changes: [
        generateUnsignedAddChange("60", 20, "system.attributes.senses.darkvision"),
      ],
    },
    "Shifting: Beasthide": {
      changes: [
        generateUnsignedAddChange("1", 20, "system.attributes.ac.bonus"),
      ],
    },
    "Shifting: Swiftstride": {
      changes: [
        generateUnsignedAddChange("10", 20, "system.attributes.movement.walk"),
      ],
    },
    "Shifting: Wildhunt": {
    },
    "Steps of the Fey": {
      options: {
        description: "Disadvantage on attack rolls against creatures other than caster until the start of the casters next turn",
      },
      name: "Taunted",
    },
    "Stonecunning": {
      name: "Stonecunning: Tremorsense",
      options: {
        durationSeconds: 600,
      },
      changes: [
        generateUnsignedAddChange("60", 20, "system.attributes.senses.tremorsense"),
      ],
    },
    "Superior Critical": {
      options: {
        transfer: true,
      },
      changes: [
        generateDowngradeChange("18", 30, "flags.dnd5e.weaponCriticalThreshold"),
      ],
    },
    "Superior Defense": {
      clearAutoEffects: true,
      options: {
        durationSeconds: 60,
      },
      changes: [
        "acid", "bludgeoning", "cold", "fire", "lightning", "necrotic", "poison", "psychic", "radiant",
        "thunder", "piercing", "slashing",
      ].map((element) =>
        generateUnsignedAddChange(element, 20, "system.traits.dr.value"),
      ),
    },
    "Tactial Master": {
      options: {
        transfer: true,
      },
      changes: [
        generateUnsignedAddChange("push", 10, "system.traits.weaponProf.mastery.bonus"),
        generateUnsignedAddChange("sap", 10, "system.traits.weaponProf.mastery.bonus"),
        generateUnsignedAddChange("slow", 10, "system.traits.weaponProf.mastery.bonus"),
      ],
    },
    "Tavern Brawler": {
      options: {
        transfer: true,
      },
      changes: [
        generateOverrideChange("true", 20, "flags.dnd5e.tavernBrawlerFeat"),
      ],
    },
    "Tongue of the Sun and Moon": {
      options: {
        transfer: true,
      },
      changes: [
        generateUnsignedAddChange("standard:*", 20, "system.traits.languages.value"),
        generateUnsignedAddChange("exotic:*", 20, "system.traits.languages.value"),
        generateUnsignedAddChange("ddb:*", 10, "system.traits.languages.value"),
      ],
    },
    "Unarmored Movement": () => {
      const value = this.ddbParser.ddbData?.character?.modifiers && this.is2024
        ? this.ddbParser.ddbData.character.modifiers.class.filter((mod) => mod.isGranted
          && mod.friendlySubtypeName === "Unarmored Movement").reduce((acc, mod) => acc + mod.value, 0)
        : 10;
      return {
        noCreate: true,
        changesOverwrite: true,
        changes: [
          // can't use scale values here yet
          generateUnsignedAddChange(`${value}`, 20, "system.attributes.movement.walk"),
        ],
      };
    },
    "Unbreakable Majesty": {
      options: {
        durationSeconds: 60,
      },
      data: {
        "flags.ddbimporter.activityMatch": "Assume Unbreakable Majesty",
      },
    },
    "Unarmored Defense": {
      noCreate: true,
      changesOverwrite: true,
      changes: (data) => {
        const klass = foundry.utils.getProperty(data, "flags.ddbimporter.dndbeyond.class");
        if (klass === "Barbarian") {
          return [
            generateOverrideChange("unarmoredBarb", 15, "system.attributes.ac.calc"),
          ];
        } else if (klass === "Monk") {
          return [
            generateOverrideChange("unarmoredMonk", 15, "system.attributes.ac.calc"),
          ];
        }
        return [];
      },
    },
    "War Bond": {
      name: "Weapon Bond",
      type: "enchant",
      changes: [
        generateOverrideChange(`{} [Bonded]`, 20, "name"),
      ],
    },
    "War Caster": {
      options: {
        transfer: true,
      },
      changes: [
        generateUpgradeChange("1", 10, "system.attributes.concentration.roll.mode"),
      ],
    },
  };

  DOCUMENT_STUB = {

  };
}
