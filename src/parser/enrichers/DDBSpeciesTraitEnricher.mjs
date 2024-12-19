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
  };

  NAME_HINT_INCLUDES = {
    " Lineage": "Lineage",
    " Legacy": "Lineage",
  };

  ENRICHERS = {
    None: GenericEnrichers.None,
    Generic: SpeciesEnrichers.Generic.Generic,
    Lineage: SpeciesEnrichers.Generic.Lineage,
    "Breath Weapon (Acid)": SpeciesEnrichers.Dragonborn.BreathWeapon2024,
    "Breath Weapon (Cold)": SpeciesEnrichers.Dragonborn.BreathWeapon2024,
    "Breath Weapon (Fire)": SpeciesEnrichers.Dragonborn.BreathWeapon2024,
    "Breath Weapon (Lightning)": SpeciesEnrichers.Dragonborn.BreathWeapon2024,
    "Breath Weapon (Poison)": SpeciesEnrichers.Dragonborn.BreathWeapon2024,
    "Celestial Revelation (Heavenly Wings)": SpeciesEnrichers.Aasimar.CelestialRevelationHeavenlyWings,
    "Celestial Revelation (Inner Radiance)": SpeciesEnrichers.Aasimar.CelestialRevelationInnerRadiance,
    "Celestial Revelation (Necrotic Shroud)": SpeciesEnrichers.Aasimar.CelestialRevelationNecroticShroud,
    "Celestial Revelation (Radiant Consumption)": SpeciesEnrichers.Aasimar.CelestialRevelationRadiantConsumption,
    "Celestial Revelation (Radiant Soul)": GenericEnrichers.CelestialRevelationRadiantSoul,
    "Celestial Revelation": SpeciesEnrichers.Aasimar.CelestialRevelation,
    "Cloud's Jaunt (Cloud Giant)": SpeciesEnrichers.Goliath.CloudsJaunt,
    "Equine Build": SpeciesEnrichers.Generic.PowerfulBuild,
    "Fire's Burn (Fire Giant)": SpeciesEnrichers.Goliath.FiresBurn,
    "Frost's Chill (Frost Giant)": SpeciesEnrichers.Goliath.FrostsChill,
    "Gift of the Chromatic Dragon: Chromatic Infusion": SpeciesEnrichers.Dragonborn.ChromaticInfusion,
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
    "Reckless Attack": GenericEnrichers.RecklessAttack,
    "Savage Attacks": SpeciesEnrichers.HalfOrc.SavageAttacks,
    "Shifting: Beasthide": SpeciesEnrichers.Shifter.ShiftingBeasthide,
    "Shifting: Longtooth": SpeciesEnrichers.Shifter.ShiftingLongtooth,
    "Shifting: Swiftstride": SpeciesEnrichers.Shifter.ShiftingSwiftstride,
    "Shifting: Wildhunt": SpeciesEnrichers.Shifter.ShiftingWildhunt,
    "Shifting": SpeciesEnrichers.Shifter.Shifting,
    "Stone's Endurance (Stone Giant)": SpeciesEnrichers.Goliath.StonesEndurance,
    "Stone's Endurance": SpeciesEnrichers.Goliath.StonesEndurance,
    "Stonecunning": SpeciesEnrichers.Dwarf.Stonecunning,
    "Storm's Thunder (Storm Giant)": SpeciesEnrichers.Goliath.StormsThunder,
    "Surprise Attack": SpeciesEnrichers.Bugbear.SurpriseAttack,
    "Unarmed Strike": GenericEnrichers.UnarmedStrike,
    "Uncanny Dodge": GenericEnrichers.UncannyDodge,
    "Daunting Roar": SpeciesEnrichers.Leonin.DauntingRoar,
    "Vedalken Dispassion": SpeciesEnrichers.Vedalken.VedalkenDispassion,
    "Fury of the Small": SpeciesEnrichers.Goblin.FuryOfTheSmall,
  };

  FALLBACK_ENRICHERS = {
    Generic: SpeciesEnrichers.Generic.Generic,
  };

}
