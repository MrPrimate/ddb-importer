import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin.mjs";
import { SpeciesEnrichers, GenericEnrichers } from "./_module.mjs";

export default class DDBSpeciesTraitEnricher extends DDBEnricherFactoryMixin {
  constructor({ activityGenerator, notifier = null, fallbackEnricher = null } = {}) {
    super({
      activityGenerator,
      effectType: "feat",
      enricherType: "feat",
      fallbackEnricher,
      notifier,
      ddbActionType: "race",
    });
  }

  NAME_HINTS = {
    "Halfling Lucky": "Lucky",
    "Powerful Build, Hippo Build": "Hippo Build",
    "Gnomish Lineage": "Generic",
    "Gnomish Lineage: Rock Gnome": "Generic",
    "Gnomish Lineage: Forest Gnome": "Generic",
    "Breath Weapon (Acid)": "Breath Weapon (2024)",
    "Breath Weapon (Cold)": "Breath Weapon (2024)",
    "Breath Weapon (Fire)": "Breath Weapon (2024)",
    "Breath Weapon (Lightning)": "Breath Weapon (2024)",
    "Breath Weapon (Poison)": "Breath Weapon (2024)",
  };

  NAME_HINT_INCLUDES = {
    " Lineage": "Lineage",
    " Legacy": "Lineage",
    "Breath Weapon (": "Breath Weapon",
  };

  ENRICHERS = {
    None: GenericEnrichers.None,
    Generic: SpeciesEnrichers.Generic.Generic,
    Lineage: SpeciesEnrichers.Generic.Lineage,
    "Breath Weapon": SpeciesEnrichers.Dragonborn.BreathWeapon,
    "Breath Weapon (2024)": SpeciesEnrichers.Dragonborn.BreathWeapon2024,
    "Celestial Revelation (Heavenly Wings)": SpeciesEnrichers.Aasimar.CelestialRevelationHeavenlyWings,
    "Celestial Revelation (Inner Radiance)": SpeciesEnrichers.Aasimar.CelestialRevelationInnerRadiance,
    "Celestial Revelation (Necrotic Shroud)": SpeciesEnrichers.Aasimar.CelestialRevelationNecroticShroud,
    "Celestial Revelation (Radiant Consumption)": SpeciesEnrichers.Aasimar.CelestialRevelationRadiantConsumption,
    "Celestial Revelation (Radiant Soul)": SpeciesEnrichers.Aasimar.CelestialRevelationRadiantSoul,
    "Celestial Revelation: Heavenly Wings": SpeciesEnrichers.Aasimar.CelestialRevelationHeavenlyWings,
    "Celestial Revelation: Inner Radiance": SpeciesEnrichers.Aasimar.CelestialRevelationInnerRadiance,
    "Celestial Revelation: Necrotic Shroud": SpeciesEnrichers.Aasimar.CelestialRevelationNecroticShroud,
    "Celestial Revelation: Radiant Consumption": SpeciesEnrichers.Aasimar.CelestialRevelationRadiantConsumption,
    "Celestial Revelation: Radiant Soul": SpeciesEnrichers.Aasimar.CelestialRevelationRadiantSoul,
    "Celestial Revelation": SpeciesEnrichers.Aasimar.CelestialRevelation,
    "Cloud's Jaunt (Cloud Giant)": SpeciesEnrichers.Goliath.CloudsJaunt,
    "Daunting Roar": SpeciesEnrichers.Leonin.DauntingRoar,
    "Equine Build": SpeciesEnrichers.Generic.PowerfulBuild,
    "Fire's Burn (Fire Giant)": SpeciesEnrichers.Goliath.FiresBurn,
    "Frost's Chill (Frost Giant)": SpeciesEnrichers.Goliath.FrostsChill,
    "Fury of the Small": SpeciesEnrichers.Goblin.FuryOfTheSmall,
    "Gift of the Chromatic Dragon: Chromatic Infusion": SpeciesEnrichers.Dragonborn.ChromaticInfusion,
    "Glide": SpeciesEnrichers.Hadozee.GlideReaction,
    "Hadozee Dodge": SpeciesEnrichers.Hadozee.HadozeeDodge,
    "Healing Hands": SpeciesEnrichers.Aasimar.HealingHands,
    "Hill's Tumble (Hill Giant)": SpeciesEnrichers.Goliath.HillsTumble,
    "Hippo Build": SpeciesEnrichers.Generic.PowerfulBuild,
    "Hold Breath": SpeciesEnrichers.Generic.HoldBreath,
    "Large Form": SpeciesEnrichers.Goliath.LargeForm,
    "Little Giant": SpeciesEnrichers.Generic.PowerfulBuild,
    "Lucky": GenericEnrichers.Lucky,
    "Mind Link Response": SpeciesEnrichers.Kalashtar.MindLinkResponse,
    "Partially Amphibious": SpeciesEnrichers.Vedalken.PartiallyAmphibious,
    "Powerful Build": SpeciesEnrichers.Generic.PowerfulBuild,
    "Radiant Soul": SpeciesEnrichers.Aasimar.RadiantSoul,
    "Reckless Attack": GenericEnrichers.RecklessAttack,
    "Savage Attacks": SpeciesEnrichers.HalfOrc.SavageAttacks,
    "Shift": SpeciesEnrichers.Shifter.Shift,
    "Shifting": SpeciesEnrichers.Shifter.Shifting,
    "Stone's Endurance (Stone Giant)": SpeciesEnrichers.Goliath.StonesEndurance,
    "Stone's Endurance": SpeciesEnrichers.Goliath.StonesEndurance,
    "Stonecunning": SpeciesEnrichers.Dwarf.Stonecunning,
    "Storm's Thunder (Storm Giant)": SpeciesEnrichers.Goliath.StormsThunder,
    "Surprise Attack": SpeciesEnrichers.Bugbear.SurpriseAttack,
    "Unarmed Strike": GenericEnrichers.UnarmedStrike,
    "Uncanny Dodge": GenericEnrichers.UncannyDodge,
    "Vedalken Dispassion": SpeciesEnrichers.Vedalken.VedalkenDispassion,
    "Adrenaline Rush": SpeciesEnrichers.Orc.AdrenalineRush,
    "Fey Step": SpeciesEnrichers.Eladrin.FeyStep,
    "Natural Attack (Claws)": SpeciesEnrichers.Wulven.NaturalAttackClaws,
    "Draconic Flight": SpeciesEnrichers.Dragonborn.DraconicFlight,
  };

  FALLBACK_ENRICHERS = {
    Generic: SpeciesEnrichers.Generic.Generic,
  };

}
