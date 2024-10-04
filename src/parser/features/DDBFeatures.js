import DDBHelper from "../../lib/DDBHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import SETTINGS from "../../settings.js";
import DDBBasicActivity from "../enrichers/DDBBasicActivity.js";
import DDBFeatureEnricher from "../enrichers/DDBFeatureEnricher.js";
import DDBBaseFeature from "./DDBBaseFeature.js";
import DDBChoiceFeature from "./DDBChoiceFeature.js";
import DDBClassFeatures from "./DDBClassFeatures.js";
import DDBFeature from "./DDBFeature.js";
import { addExtraEffects } from "./extraEffects.js";


export default class DDBFeatures {

  constructor({ ddbCharacter, ddbData, rawCharacter = null } = {}) {
    this.ddbCharacter = ddbCharacter;
    this.ddbData = ddbData;
    this.rawCharacter = rawCharacter;


    this.excludedOriginFeatures = this.ddbData.character.optionalOrigins
      .filter((f) => f.affectedRacialTraitId)
      .map((f) => f.affectedRacialTraitId);

    this.parsed = [];

    this.data = [];
    this.enricher = new DDBFeatureEnricher();
  }

  static LEGACY_SKIPPED_FEATURES = [
    "Hit Points",
    "Languages",
    "Bonus Proficiency",
    "Bonus Proficiencies",
    "Speed",
    "Skills",
    "Feat",
    "Primal Knowledge",
    "Creature Type",
  ];

  static TASHA_VERSATILE = [
    "Martial Versatility",
    "Bardic Versatility",
    "Cantrip Versatility",
    "Sorcerous Versatility",
    "Eldritch Versatility",
  ];

  static SKIPPED_FEATURES = [
    "Equipment",
    "Expertise",
    "Darkvision",
    "Core Barbarian Traits",
    "Core Bard Traits",
    "Core Cleric Traits",
    "Core Druid Traits",
    "Core Fighter Traits",
    "Core Monk Traits",
    "Core Paladin Traits",
    "Core Ranger Traits",
    "Core Rogue Traits",
    "Core Sorcerer Traits",
    "Core Warlock Traits",
    "Core Wizard Traits",
    "Weapon Mastery",
    "Maneuver Options",
    "Lay On Hands", // 2024
    "Lay on Hands", // 2014
    "Epic Boon: Choose an Epic Boon feat",
    "Epic Boon",
    "Maneuver: Trip Attack (Dex.)",
    "Maneuver: Disarming Attack (Dex.)",
    "Maneuver: Parry (Dex.)",
    "Maneuver: Menacing Attack (Dex.)",
  ];

  static NO_DUPLICATE_DESCRIPTION = [
    "Blessed Strikes",
  ];

  static isDuplicateFeature(items, item) {
    return items.some((dup) => dup.name === item.name && dup.system.description.value === item.system.description.value);
  }

  static getNameMatchedFeature(items, item) {
    return items.find((dup) => dup.name === item.name && item.flags.ddbimporter.type === dup.flags.ddbimporter.type);
  }

  static includedFeatureNameCheck(featName) {
    const includeTashaVersatile = game.settings.get(SETTINGS.MODULE_ID, "character-update-include-versatile-features");

    const nameAllowed = !featName.startsWith("Proficiencies")
      && !featName.includes("Ability Score")
      && !featName.startsWith("Size")
      && !featName.startsWith("Expertise")
      && !featName.endsWith("Subclass")
      && !featName.match(/(?:\w+) Weapon Masteries(?:y|ies)(?:$|:)/igm)
      && !featName.match(/(?:\d+:) Weapon Master(?:y|ies)(?:$|:)/igm)
      && !featName.startsWith("Weapon Mastery -")
      // && !featName.endsWith(" Weapon Mastery")
      // && !featName.startsWith("Skills")
      && (includeTashaVersatile || (!includeTashaVersatile && !DDBFeatures.TASHA_VERSATILE.includes(featName)))
      && !DDBFeatures.LEGACY_SKIPPED_FEATURES.includes(featName)
      && !DDBFeatures.SKIPPED_FEATURES.includes(featName);

    return nameAllowed;
  }

  async getFeaturesFromDefinition(featDefinition, type) {
    const source = DDBHelper.parseSource(featDefinition);
    const ddbFeature = new DDBFeature({
      ddbData: this.ddbData,
      ddbDefinition: featDefinition,
      rawCharacter: this.rawCharacter,
      type,
      source,
      enricher: this.enricher,
    });
    ddbFeature.build();
    logger.debug(`DDBFeatures.getFeaturesFromDefinition (type: ${type}): ${ddbFeature.ddbDefinition.name}`, {
      ddbFeature,
      featDefinition,
      this: this,
    });
    // only background features get advancements for now
    if (type === "background") {
      ddbFeature.generateBackgroundAbilityScoreAdvancement();
      await ddbFeature.generateAdvancements();
      await ddbFeature.buildBackgroundFeatAdvancements();
    }
    const choiceFeatures = ddbFeature.isChoiceFeature
      ? await DDBChoiceFeature.buildChoiceFeatures(ddbFeature)
      : [];
    return [ddbFeature.data].concat(choiceFeatures);
  }

  async _buildRacialTraits() {
    logger.debug("Parsing racial traits");
    const traits = this.ddbData.character.race.racialTraits
      .filter(
        (trait) => DDBFeatures.includedFeatureNameCheck(trait.definition.name)
          && !trait.definition.hideInSheet
          && !this.excludedOriginFeatures.includes(trait.definition.id)
          && (trait.requiredLevel === undefined || trait.requiredLevel >= this.ddbCharacter.totalLevels),
      );

    for (const feat of traits) {
      const features = await this.getFeaturesFromDefinition(feat, "race");
      features.forEach((item) => {
        const existingFeature = DDBFeatures.getNameMatchedFeature(this.parsed, item);
        const duplicateFeature = DDBFeatures.isDuplicateFeature(this.parsed, item)
          && !DDBFeatures.NO_DUPLICATE_DESCRIPTION.includes(item.flags.ddbimporter.originalName ?? item.name);
        if (existingFeature && !duplicateFeature) {
          existingFeature.system.description.value += `<h3>Racial Trait Addition</h3>${item.system.description.value}`;
        } else if (!existingFeature) {
          this.parsed.push(item);
        }
      });
    };
  }

  async _buildOptionalClassFeatures({ requireLevel = true } = {}) {
    // optional class features
    logger.debug("Parsing optional class features");
    if (this.ddbData.classOptions) {
      const options = this.ddbData.classOptions
        .filter((feat) => {
          if (!requireLevel || !foundry.utils.hasProperty(feat, "requiredLevel")) return true;
          const requiredLevel = foundry.utils.getProperty(feat, "requiredLevel");
          const klass = this.ddbData.character.classes.find((cls) => cls.definition.id === feat.classId
            || cls.subclassDefinition?.id === feat.classId);
          if (!klass) {
            logger.info(`Unable to determine class for optional feature ${feat.name}, you might not have a suitable subclass`, { feat, this: this, requiredLevel });
            return false;
          }
          return klass.level >= requiredLevel;
        })
        .filter((feat) => DDBFeatures.includedFeatureNameCheck(feat.name));
      for (const feat of options) {
        logger.debug(`Parsing Optional Feature ${feat.name}`);
        const feats = await this.getFeaturesFromDefinition(feat, "class");
        this.parsed.push(...feats);
      };
    }
  }

  async _buildClassFeatures() {
    logger.debug("Parsing class and subclass features");
    this._ddbClassFeatures = new DDBClassFeatures({
      ddbData: this.ddbData,
      rawCharacter: this.rawCharacter,
    });
    await this._ddbClassFeatures.build();
    await this._buildOptionalClassFeatures();

    logger.debug("ddbClassFeatures._buildClassFeatures", {
      ddbClassFeature: this._ddbClassFeatures,
      this: this,
    });

    // now we loop over class features and add to list, removing any that match racial traits, e.g. Darkvision
    logger.debug("Removing matching traits");
    this._ddbClassFeatures.data
      .forEach((item) => {
        const existingFeature = DDBFeatures.getNameMatchedFeature(this.parsed, item);
        const duplicateFeature = DDBFeatures.isDuplicateFeature(this.parsed, item);
        if (existingFeature && !duplicateFeature) {
          const klassAdjustment = `<h3>${item.flags.ddbimporter.dndbeyond.class}</h3>${item.system.description.value}`;
          existingFeature.system.description.value += klassAdjustment;
        } else if (!existingFeature) {
          this.parsed.push(item);
        }
      });
  }

  async _addFeats() {
    // add feats
    logger.debug("Parsing feats");
    const validFeats = this.ddbData.character.feats.filter((feat) => DDBFeatures.includedFeatureNameCheck(feat.definition.name));
    for (const feat of validFeats) {
      const feats = await this.getFeaturesFromDefinition(feat, "feat");
      this.parsed.push(...feats);
    };
  }

  async _addBackground() {
    logger.debug("Parsing background");
    const backgroundFeature = this.ddbCharacter.getBackgroundData();
    const backgroundFeats = await this.getFeaturesFromDefinition(backgroundFeature, "background");
    this.parsed.push(...backgroundFeats);
  }

  _setLevelScales() {
    this.parsed.forEach((feature) => {
      const featureName = utils.referenceNameString(feature.name).toLowerCase();
      const scaleKlass = this.ddbCharacter.raw.classes.find((klass) =>
        klass.system.advancement
          .some((advancement) => advancement.type === "ScaleValue"
            && advancement.configuration.identifier === featureName,
          ));

      // KNOWN_ISSUE_4_0: fix level scales for activities
      if (scaleKlass) {
        const identifier = utils.referenceNameString(scaleKlass.system.identifier).toLowerCase();
        const damage = DDBBasicActivity.buildDamagePart({
          damageString: `@scale.${identifier}.${featureName}`,
        });
        if (foundry.utils.hasProperty(feature, "system.damage.base")) {
          feature.system.damage.base.custom = damage.custom;
        } else if (foundry.utils.hasProperty(feature, "system.activities")) {
          for (const [key, activity] of Object.entries(feature.system.activities)) {
            if (activity.damage && activity.damage.parts.length === 0) {
              // console.warn(`adding scale for ${feature.name} ${key}`, {
              //   feature,
              //   activity: deepClone(activity),
              //   damage,
              // });
              activity.damage.parts = [damage];
            } else if (activity.damage && activity.damage.parts.length > 0) {
              // console.warn(`Replacing scale for ${feature.name} ${key}`, {
              //   feature,
              //   activity: deepClone(activity),
              //   damage,
              // });
              activity.damage.parts[0].custom = damage.custom;
            }
            feature.system.activities[key] = activity;
          }

        }
      }
    });
  }

  fixAcEffects() {
    for (const feature of this.parsed) {
      logger.debug(`Checking ${feature.name} for AC effects`);
      for (const effect of (feature.effects ?? [])) {
        if (
          !["Natural", "Unarmored Defense", "Custom", "Unarmored"].includes(this.ddbCharacter.armor.results.maxType)
          && (
            (effect.changes.length === 2
            && effect.changes.some((change) => change.key === "system.attributes.ac.formula")
            && effect.changes.some((change) => change.key === "system.attributes.ac.calc"))
            || (effect.changes.length === 1
              && effect.changes.some((change) => change.key === "system.attributes.ac.calc"))
          )
        ) {
          effect.disabled = true;
        }
      }
    }
  }

  async build() {
    await this.enricher.init();
    await this._buildRacialTraits();
    await this._buildClassFeatures();
    await this._addFeats();
    await this._addBackground();

    this._setLevelScales();

    for (const feature of this.parsed) {
      await DDBBaseFeature.finalFixes(feature);
    }
    this.fixAcEffects();
    this.data = await addExtraEffects(this.ddbData, this.parsed, this.rawCharacter);
  }
}
