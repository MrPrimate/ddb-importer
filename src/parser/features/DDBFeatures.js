/* eslint-disable no-await-in-loop */
import DDBHelper from "../../lib/DDBHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import SETTINGS from "../../settings.js";
import DDBChoiceFeature from "./DDBChoiceFeature.js";
import DDBClassFeatures from "./DDBClassFeatures.js";
import DDBFeature from "./DDBFeature.js";
import { addExtraEffects, fixFeatures } from "./fixes.js";


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
    "Expertise",
    "Darkvision",
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
      && !featName.startsWith("Ability Score")
      && !featName.startsWith("Size")
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
    });

    ddbFeature.build();
    logger.debug(`DDBFeatures.getFeaturesFromDefinition: ${ddbFeature.ddbDefinition.name}`, {
      ddbFeature,
      featDefinition,
      this: this,
    });
    // only background features get advancements for now
    if (type === "background") {
      await ddbFeature.generateAdvancements();
      await ddbFeature.buildBackgroundFeatAdvancements();
    }
    if (ddbFeature.isChoiceFeature) {
      return DDBChoiceFeature.buildChoiceFeatures(ddbFeature);
    } else {
      return [ddbFeature.data];
    }
  }

  async _buildRacialTraits() {
    logger.debug("Parsing racial traits");
    const traits = this.ddbData.character.race.racialTraits
      .filter(
        (trait) => DDBFeatures.includedFeatureNameCheck(trait.definition.name)
          && !trait.definition.hideInSheet
          && !this.excludedOriginFeatures.includes(trait.definition.id)
      );

    for (const feat of traits) {
      const features = await this.getFeaturesFromDefinition(feat, "race");
      features.forEach((item) => {
        const existingFeature = DDBFeatures.getNameMatchedFeature(this.parsed, item);
        const duplicateFeature = DDBFeatures.isDuplicateFeature(this.parsed, item);
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
    this._ddbClassFeatures.build();
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
    for (const feat of this.ddbData.character.feats) {
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
            && advancement.configuration.identifier === featureName
          ));

      if (scaleKlass) {
        const identifier = utils.referenceNameString(scaleKlass.system.identifier).toLowerCase();
        if (foundry.utils.hasProperty(feature, "system.damage.parts") && feature.system.damage.parts.length > 0) {
          feature.system.damage.parts[0][0] = `@scale.${identifier}.${featureName}`;
        } else {
          foundry.utils.setProperty(feature, "system.damage.parts", [[`@scale.${identifier}.${featureName}`]]);
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
    await this._buildRacialTraits();
    await this._buildClassFeatures();
    await this._addFeats();
    await this._addBackground();

    this._setLevelScales();

    await fixFeatures(this.parsed);
    this.fixAcEffects();
    this.data = await addExtraEffects(this.ddbData, this.parsed, this.rawCharacter);
  }
}
