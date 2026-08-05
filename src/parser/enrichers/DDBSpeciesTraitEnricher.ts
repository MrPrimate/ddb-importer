import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin";
import * as SpeciesEnrichers from "./trait/_module";
import * as GenericEnrichers from "./generic/_module";
import { utils } from "../../lib/_module";
import type DDBEnricherData from "./data/DDBEnricherData";

export default class DDBSpeciesTraitEnricher extends DDBEnricherFactoryMixin {
  constructor({ activityGenerator, notifier = null, fallbackEnricher = null }: {
    activityGenerator?: TActivityGenerator;
    notifier?: NotifierV1 | null;
    fallbackEnricher?: string | null;
  } = {}) {
    super({
      activityGenerator,
      effectType: "feat",
      enricherType: "feat",
      fallbackEnricher,
      notifier,
      ddbActionType: "race",
    });
  }

  get speciesFullRaceName(): string | undefined {
    const species = this.ddbParser?.species;
    return species && typeof species === "object" ? species.fullRaceName : undefined;
  }

  get speciesRaceName(): string | undefined {
    const species = this.ddbParser?.species;
    return species && typeof species === "object" ? species.baseRaceName : undefined;
  }

  get speciesGroupName(): string | undefined {
    const species = this.ddbParser?.species;
    return species && typeof species === "object" ? species.groupName : undefined;
  }

  _tryLoadEnricherEnricher(featName: string, speciesName: string): DDBEnricherData | null {
    // match _linkBuilder.js namespace derivation: hyphens split words too
    // ("Shadar-kai" -> "ShadarKai", not pascalCase's "Shadarkai")
    const speciesNameHint = utils.pascalCase(speciesName.replace(/-/g, " "));
    const Enricher = (SpeciesEnrichers as TEnricherGroupMap)[speciesNameHint]?.[featName];
    if (!Enricher) {
      return null;
    }
    return new Enricher({
      ddbEnricher: this,
    });
  }

  _defaultClassLoader(): DDBEnricherData | null {
    if (!this.hintName) return null;
    const featName = utils.pascalCase(this.hintName);
    const speciesRaceName = this.speciesRaceName;
    const speciesGroupName = this.speciesGroupName;
    const speciesFullRaceName = this.speciesFullRaceName;
    const attempts = new Set<string>();

    if (speciesFullRaceName) {
      attempts.add(speciesFullRaceName);
      if (speciesFullRaceName.includes("(")) {
        attempts.add(speciesFullRaceName.split("(")[0].trim());
      }
    }
    if (speciesGroupName) {
      attempts.add(speciesGroupName);
    }
    if (speciesRaceName) {
      attempts.add(speciesRaceName);
    }
    for (const name of attempts) {
      const enricher = this._tryLoadEnricherEnricher(featName, name);
      if (enricher) {
        return enricher;
      }
    }

    return null;
  }

  _defaultNameLoader(): DDBEnricherData | null {
    const hintName = this.hintName;
    if (!hintName || !this.ENRICHERS[hintName]) {
      return this._defaultClassLoader();
    }
    return new this.ENRICHERS[hintName]({
      ddbEnricher: this,
    });
  }

  NAME_HINTS: Record<string, string> = {
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

  NAME_HINT_INCLUDES: Record<string, string> = {
    " Lineage": "Lineage",
    " Legacy": "Lineage",
    "Breath Weapon (": "Breath Weapon",
  };

  ENRICHERS: Record<string, EnricherConstructor> = {
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
    "Halfling Lucky": SpeciesEnrichers.Halfling.Luck,
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
    // The species-name convention loader (_defaultClassLoader tries
    // fullRaceName, name-before-paren, groupName, baseRaceName) resolves most
    // trait enrichers; map entries below are only for names that cannot match
    // by convention (file name differs from trait name, or the enricher is
    // shared across species in the Generic namespace).
    "Necrotic Shroud": SpeciesEnrichers.Aasimar.CelestialRevelationNecroticShroud,
    "Radiant Consumption": SpeciesEnrichers.Aasimar.CelestialRevelationRadiantConsumption,
    "Fade Away": SpeciesEnrichers.Generic.FadeAway,
    "Burst of Speed": SpeciesEnrichers.Generic.BurstOfSpeed,
  };

  FALLBACK_ENRICHERS: Record<string, EnricherConstructor> = {
    Generic: SpeciesEnrichers.Generic.Generic,
  };
}
