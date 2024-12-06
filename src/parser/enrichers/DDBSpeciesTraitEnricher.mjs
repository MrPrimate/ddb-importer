import DDBEnricherMixin from "./mixins/DDBEnricherMixin.mjs";
import { SpeciesEnrichers, GenericEnrichers } from "./_module.mjs";

export default class DDBSpeciesTraitEnricher extends DDBEnricherMixin {
  constructor({ activityGenerator, notifier = null, fallbackEnricher = null } = {}) {
    super({
      activityGenerator,
      effectType: "feat",
      enricherType: "feat",
      fallbackEnricher,
      notifier,
      actionType: "race",
    });
  }

  load({ ddbParser, document, name = null, fallbackEnricher = null } = {}) {
    if (fallbackEnricher) this.fallbackEnricher = fallbackEnricher;
    super.load({ ddbParser, document, name });
    this._prepare();
  }

  NAME_HINTS = {
    "Halfling Lucky": "Lucky",
    "Powerful Build, Hippo Build": "Hippo Build",
  };

  NAME_HINT_INCLUDES = {
    " Lineage": "Lineage",
    " Legacy": "Lineage",
  };

  ENRICHERS = {
    None: GenericEnrichers.None,
    "Lineage": SpeciesEnrichers.Generic.Lineage,
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
    "Equine Build": SpeciesEnrichers.Generic.PowerfulBuild,
    "Gift of the Chromatic Dragon: Chromatic Infusion": SpeciesEnrichers.Dragonborn.ChromaticInfusion,
    "Hippo Build": SpeciesEnrichers.Generic.PowerfulBuild,
    "Little Giant": SpeciesEnrichers.Generic.PowerfulBuild,
    "Savage Attacks": SpeciesEnrichers.HalfOrc.SavageAttacks,
    "Unarmed Strike": GenericEnrichers.UnarmedStrike,
    "Reckless Attack": GenericEnrichers.RecklessAttack,
    "Uncanny Dodge": GenericEnrichers.UncannyDodge,
    "Lucky": GenericEnrichers.Lucky,
    "Cloud's Jaunt (Cloud Giant)": SpeciesEnrichers.Goliath.CloudsJaunt,
    "Fire's Burn (Fire Giant)": SpeciesEnrichers.Goliath.FiresBurn,
    "Frost's Chill (Frost Giant)": SpeciesEnrichers.Goliath.FrostsChill,
    "Healing Hands": SpeciesEnrichers.Aasimar.HealingHands,
    "Hill's Tumble (Hill Giant)": SpeciesEnrichers.Goliath.HillsTumble,
    "Hold Breath": SpeciesEnrichers.Generic.HoldBreath,
    "Large Form": SpeciesEnrichers.Goliath.LargeForm,
    "Mind Link Response": SpeciesEnrichers.Kalashtar.MindLinkResponse,
    "Partially Amphibious": SpeciesEnrichers.Vedalken.PartiallyAmphibious,
    "Shifting: Beasthide": SpeciesEnrichers.Shifter.ShiftingBeasthide,
    "Shifting: Longtooth": SpeciesEnrichers.Shifter.ShiftingLongtooth,
    "Shifting: Swiftstride": SpeciesEnrichers.Shifter.ShiftingSwiftstride,
    "Shifting: Wildhunt": SpeciesEnrichers.Shifter.ShiftingWildhunt,
    "Shifting": SpeciesEnrichers.Shifter.Shifting,
    "Stonecunning": SpeciesEnrichers.Dwarf.Stonecunning,
    "Stone's Endurance": SpeciesEnrichers.Goliath.StonesEndurance,
    "Stone's Endurance (Stone Giant)": SpeciesEnrichers.Goliath.StonesEndurance,
    "Storm's Thunder (Storm Giant)": SpeciesEnrichers.Goliath.StormsThunder,
    "Surprise Attack": SpeciesEnrichers.Bugbear.SurpriseAttack,
    "Powerful Build": SpeciesEnrichers.Generic.PowerfulBuild,
  };

  FALLBACK_ENRICHERS = {
    Generic: SpeciesEnrichers.Generic.Generic,
  };

}
