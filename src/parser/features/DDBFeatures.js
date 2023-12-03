import DDBHelper from "../../lib/DDBHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
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

  static SKIPPED_FEATURES = [
    "Hit Points",
    "Languages",
    "Bonus Proficiency",
    "Speed",
    "Skills",
    // "Feat",
  ];

  static isDuplicateFeature(items, item) {
    return items.some((dup) => dup.name === item.name && dup.system.description.value === item.system.description.value);
  }

  static getNameMatchedFeature(items, item) {
    return items.find((dup) => dup.name === item.name && item.flags.ddbimporter.type === dup.flags.ddbimporter.type);
  }

  static includedFeatureNameCheck(featName) {
    const nameAllowed = !featName.startsWith("Proficiencies")
      && !featName.startsWith("Ability Score")
      && !featName.startsWith("Size")
      // && !featName.startsWith("Skills")
      && !DDBFeatures.SKIPPED_FEATURES.includes(featName);

    return nameAllowed;
  }

  getFeaturesFromDefinition(featDefinition, type) {
    const source = DDBHelper.parseSource(featDefinition);
    const ddbFeature = new DDBFeature({
      ddbData: this.ddbData,
      ddbDefinition: featDefinition,
      rawCharacter: this.rawCharacter,
      type,
      source,
    });

    ddbFeature.build();
    if (ddbFeature.isChoiceFeature) {
      return DDBChoiceFeature.buildChoiceFeatures(ddbFeature);
    } else {
      return [ddbFeature.data];
    }
  }

  _buildRacialTraits() {
    logger.debug("Parsing racial traits");
    this.ddbData.character.race.racialTraits
      .filter(
        (trait) => DDBFeatures.includedFeatureNameCheck(trait.definition.name)
          && !trait.definition.hideInSheet
          && !this.excludedOriginFeatures.includes(trait.definition.id)
      )
      .forEach((feat) => {
        const features = this.getFeaturesFromDefinition(feat.definition, "race");
        features.forEach((item) => {
          const existingFeature = DDBFeatures.getNameMatchedFeature(this.parsed, item);
          const duplicateFeature = DDBFeatures.isDuplicateFeature(this.parsed, item);
          if (existingFeature && !duplicateFeature) {
            existingFeature.system.description.value += `<h3>Racial Trait Addition</h3>${item.system.description.value}`;
          } else if (!existingFeature) {
            this.parsed.push(item);
          }
        });
      });
  }

  _buildOptionalClassFeatures() {
    // optional class features
    logger.debug("Parsing optional class features");
    if (this.ddbData.classOptions) {
      this.ddbData.classOptions
        .forEach((feat) => {
          logger.debug(`Parsing Optional Feature ${feat.name}`);
          const feats = this.getFeaturesFromDefinition(feat, "class");
          feats.forEach((item) => {
            this.parsed.push(item);
          });
        });
    }
  }

  _buildClassFeatures() {
    logger.debug("Parsing class and subclass features");
    const ddbClassFeature = new DDBClassFeatures({
      ddbData: this.ddbData,
      rawCharacter: this.rawCharacter,
    });
    ddbClassFeature.build();
    this._buildOptionalClassFeatures();

    // now we loop over class features and add to list, removing any that match racial traits, e.g. Darkvision
    logger.debug("Removing matching traits");
    ddbClassFeature.data
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

  _addFeats() {
    // add feats
    logger.debug("Parsing feats");
    this.ddbData.character.feats
      .forEach((feat) => {
        const feats = this.getFeaturesFromDefinition(feat.definition, "feat");
        feats.forEach((item) => {
          this.parsed.push(item);
        });
      });
  }

  _addBackground() {
    logger.debug("Parsing background");
    const backgroundFeature = this.ddbCharacter.getBackgroundData();
    const backgroundFeats = this.getFeaturesFromDefinition(backgroundFeature.definition, "background");

    backgroundFeats.forEach((item) => {
      this.parsed.push(item);
    });
  }

  _setLevelScales() {
    this.parsed.forEach((feature) => {
      const featureName = utils.referenceNameString(feature.name.toLowerCase());
      const scaleKlass = this.ddbCharacter.raw.classes.find((klass) =>
        klass.system.advancement
          .some((advancement) => advancement.type === "ScaleValue"
            && advancement.configuration.identifier === featureName
          ));

      if (scaleKlass) {
        if (hasProperty(feature, "system.damage.parts") && feature.system.damage.parts.length > 0) {
          feature.system.damage.parts[0][0] = `@scale.${scaleKlass.system.identifier}.${featureName}`;
        } else {
          setProperty(feature, "system.damage.parts", [[`@scale.${scaleKlass.system.identifier}.${featureName}`]]);
        }
      }
    });
  }

  async build() {
    this._buildRacialTraits();
    this._buildClassFeatures();
    this._addFeats();
    this._addBackground();

    this._setLevelScales();

    await fixFeatures(this.parsed);
    this.data = await addExtraEffects(this.ddbData, this.parsed, this.rawCharacter);
  }
}
