import { logger } from "../../lib/_module.mjs";
import DDBChoiceFeature from "./DDBChoiceFeature.js";
import DDBFeature from "./DDBFeature.js";
import { DDBClassFeatureEnricher } from "../enrichers/_module.mjs";
import { DDBFeatureActivity } from "../activities/_module.mjs";
import CharacterFeatureFactory from "./CharacterFeatureFactory.js";

export default class DDBClassFeatures {

  static EXCLUDED_FEATURES = [
    "Expertise",
  ];

  static EXCLUDED_FEATURES_2014 = [
  ];

  static EXCLUDED_FEATURES_2024 = [
    "Rage",
  ];

  deriveFeatures() {
    this.ddbData.character.classes.forEach((klass) => {
      const derived = klass.classFeatures;
      const klassDefinitionFeatures = klass.definition.classFeatures;
      const subKlassDefinitionFeatures = klass.subclassDefinition?.classFeatures;

      const klassDefinitionFeatureIds = klassDefinitionFeatures.map((f) => f.id);
      const subKlassDefinitionFeatureIds = klass.subclassDefinition
        ? derived
          .filter((f) => f.definition.classId === klass.subclassDefinition.id)
          .map((f) => f.definition.id)
        : [];

      const filteredSubClassDefinitionFeatures = derived.filter((derivedFeature) =>
        subKlassDefinitionFeatureIds.includes(derivedFeature.definition.id)
        && CharacterFeatureFactory.includedFeatureNameCheck(derivedFeature.definition.name)
        && derivedFeature.definition.requiredLevel <= klass.level
        && !this.excludedFeatures.includes(derivedFeature.definition.id),
        // && DDBClassFeatures.highestLevelFeature(klass, feat)?.definition?.id === feat.definition.id,
      );

      const filteredKlassDefinitionFeatures = derived.filter((derivedFeature) =>
        klassDefinitionFeatureIds.includes(derivedFeature.definition.id)
        && CharacterFeatureFactory.includedFeatureNameCheck(derivedFeature.definition.name)
        && derivedFeature.definition.requiredLevel <= klass.level
        && !this.excludedFeatures.includes(derivedFeature.definition.id)
        && !filteredSubClassDefinitionFeatures.some((sf) => sf.definition.name === derivedFeature.definition.name),
        // && DDBClassFeatures.highestLevelFeature(klass, feat)?.definition?.id === feat.definition.id,
      );

      this.klassFeatures[klass.definition.name] = {
        derived,
        class: klassDefinitionFeatures,
        classFeatureIds: klassDefinitionFeatureIds,
        subclass: subKlassDefinitionFeatures,
        subclassFeatureIds: subKlassDefinitionFeatureIds,
        filtered: {
          class: filteredKlassDefinitionFeatures,
          subclass: filteredSubClassDefinitionFeatures,
        },
      };
    });
  }

  constructor({ ddbData, rawCharacter = null, ddbCharacter = null } = {}) {
    this.ddbCharacter = ddbCharacter;
    this.ddbData = ddbData;
    this.rawCharacter = rawCharacter;
    this.data = [];

    // object off ddb parsed features by class/subclass
    this._parsed = {};
    // general array to check for duplicates
    this._generated = [];
    // final array of processed, filtered features
    this._processed = [];

    // object to hold filtered features to be generated
    this.klassFeatures = {};
    this.ddbData.character.classes.forEach((klass) => {
      this._parsed[klass.definition.name] = [];
      this.klassFeatures[klass.definition.name] = [];
      if (klass.subclassDefinition) {
        this._parsed[klass.subclassDefinition.name] = [];
      };
    });

    this.excludedFeatures = this.ddbData.character.optionalClassFeatures
      .filter((f) => f.affectedClassFeatureId)
      .map((f) => f.affectedClassFeatureId);

    this.deriveFeatures();
  }

  async _getFeatures({ featureDefinition, type, source, filterByLevel = true, flags = {} } = {}) {
    const enricher = new DDBClassFeatureEnricher({
      activityGenerator: DDBFeatureActivity,
      fallbackEnricher: "Generic",
    });
    await enricher.init();
    const feature = new DDBFeature({
      ddbCharacter: this.ddbCharacter,
      ddbData: this.ddbData,
      ddbDefinition: featureDefinition,
      rawCharacter: this.rawCharacter,
      type,
      source,
      extraFlags: flags,
      enricher,
    });
    feature.build();
    const allowedByLevel = !filterByLevel || (filterByLevel && feature.hasRequiredLevel);

    logger.debug(`DDBClassFeatures._getFeatures generated: ${feature.ddbDefinition.name}`, {
      featureDefinition,
      feature,
      this: this,
    });

    if (DDBClassFeatures.EXCLUDED_FEATURES.some((e) => feature.name.startsWith(e))
      || (feature.is2014 && DDBClassFeatures.EXCLUDED_FEATURES_2014.includes(feature.originalName))
      || (!feature.is2014 && DDBClassFeatures.EXCLUDED_FEATURES_2024.includes(feature.originalName))
    ) {
      logger.debug(`DDBClassFeatures._getFeatures: ${feature.ddbDefinition.name} excluded`, {
        featureDefinition,
        feature,
        this: this,
      });
      return [];
    }
    if (!allowedByLevel) {
      logger.debug(`DDBClassFeatures._getFeatures: ${feature.ddbDefinition.name} not allowed by level`, {
        featureDefinition,
        feature,
        this: this,
      });
      return [];
    }
    const choiceFeatures = feature.isChoiceFeature
      ? await DDBChoiceFeature.buildChoiceFeatures(feature)
      : [];
    return [feature.data].concat(choiceFeatures);
  }

  // static highestLevelFeature(klass, feature) {
  //   const match = klass.classFeatures
  //     .filter((f) => f.definition.name === feature.definition.name
  //       && f.definition.requiredLevel <= klass.level)
  //     .reduce((prev, cur) => {
  //       return prev.definition.requiredLevel > cur.definition.requiredLevel ? prev : cur;
  //     }, { definition: { requiredLevel: 0 } });

  //   return match;
  // }

  async _generateClassFeatures(klass) {
    const className = klass.definition.name;
    const classFeatures = this.klassFeatures[klass.definition.name].filtered.class;
    const parsedFeatures = [];

    for (const feature of classFeatures) {
      const features = await this._getFeatures({
        featureDefinition: feature,
        type: "class",
        source: className,
        flags: {
          "ddbimporter": {
            class: klass.definition.name,
            classId: klass.definition.id,
          },
        },
      });
      parsedFeatures.push(...features);
    }
    this._parsed[className] = foundry.utils.duplicate(parsedFeatures);

    parsedFeatures
      .sort((a, b) => {
        return a.flags.ddbimporter.dndbeyond.displayOrder - b.flags.ddbimporter.dndbeyond.displayOrder;
      })
      .forEach((item) => {
        // have we already processed an identical item?
        if (!CharacterFeatureFactory.isDuplicateFeature(this._generated, item)) {
          const name = item.flags.ddbimporter.originalName ?? item.name;
          const existingFeature = CharacterFeatureFactory.getNameMatchedFeature(this._processed, item);
          const duplicateFeature = CharacterFeatureFactory.isDuplicateFeature(this._processed, item)
            || CharacterFeatureFactory.FORCE_DUPLICATE_FEATURE.includes(name);
          if (existingFeature && !duplicateFeature) {
            const levelAdjustment = `<h3>${className}: Level ${item.flags.ddbimporter.dndbeyond.requiredLevel}</h3>${item.system.description.value}`;
            existingFeature.system.description.value += levelAdjustment;
            existingFeature.effects.push(...item.effects);
          } else if (!existingFeature) {
            this._processed.push(item);
          }
        }
      });
    this._generated.push(...parsedFeatures);

  }

  async _generateSubClassFeatures(klass) {
    const className = klass.definition.name;
    const subClassName = `${klass.subclassDefinition.name}`;
    const parsedFeatures = [];
    const subClassFeatures = this.klassFeatures[klass.definition.name].filtered.subclass;
    const subClass = foundry.utils.getProperty(klass, "subclassDefinition");

    for (const feature of subClassFeatures) {
      const features = await this._getFeatures({
        featureDefinition: feature,
        type: "class",
        source: `${className} : ${klass.subclassDefinition.name}`,
        flags: {
          "ddbimporter": {
            class: klass.definition.name,
            classId: klass.definition.id,
            subClass: subClass?.name,
            subClassId: subClass?.id,
          },
        },
      });
      parsedFeatures.push(...features);
    }
    this._parsed[subClassName] = foundry.utils.duplicate(parsedFeatures);

    const subClassDocs = [];

    // parse out duplicate features from class features
    parsedFeatures.forEach((item) => {
      if (!CharacterFeatureFactory.isDuplicateFeature(this._parsed[className], item)) {
        const name = item.flags.ddbimporter.originalName ?? item.name;
        const existingFeature = CharacterFeatureFactory.getNameMatchedFeature(subClassDocs, item);
        const duplicateFeature = CharacterFeatureFactory.isDuplicateFeature(subClassDocs, item)
          || CharacterFeatureFactory.FORCE_DUPLICATE_FEATURE.includes(name);
        if (existingFeature && !duplicateFeature) {
          if (CharacterFeatureFactory.FORCE_DUPLICATE_OVERWRITE.includes(name)) {
            existingFeature.system.description.value = `${item.system.description.value}`;
          } else {
            const levelAdjustment = `<h3>${subClassName}: At Level ${item.flags.ddbimporter.dndbeyond.requiredLevel}</h3>${item.system.description.value}`;
            existingFeature.system.description.value += levelAdjustment;
          }
        } else if (!existingFeature) {
          subClassDocs.push(item);
        }
      }
    });
    // add features to list to indicate processed
    this._generated.push(...parsedFeatures);

    // now we take the unique subclass features and add to class
    subClassDocs
      .sort((a, b) => {
        return a.flags.ddbimporter.dndbeyond.displayOrder - b.flags.ddbimporter.dndbeyond.displayOrder;
      })
      .forEach((item) => {
        const name = item.flags.ddbimporter.originalName ?? item.name;
        const existingFeature = CharacterFeatureFactory.getNameMatchedFeature(this._processed, item);
        const duplicateFeature = CharacterFeatureFactory.isDuplicateFeature(this._processed, item)
          || CharacterFeatureFactory.FORCE_DUPLICATE_FEATURE.includes(name);
        if (existingFeature && !duplicateFeature) {
          if (CharacterFeatureFactory.FORCE_DUPLICATE_OVERWRITE.includes(name)) {
            existingFeature.system.description.value = `${item.system.description.value}`;
          } else {
            const levelAdjustment = `<h3>${subClassName}: At Level ${item.flags.ddbimporter.dndbeyond.requiredLevel}</h3>${item.system.description.value}`;
            existingFeature.system.description.value += levelAdjustment;
          }
        } else if (!existingFeature) {
          this._processed.push(item);
        }
      });

  }

  async build() {
    // subclass features can often be duplicates of class features.
    for (const klass of this.ddbData.character.classes) {
      logger.debug(`Processing class features for ${klass.definition.name}`);
      await this._generateClassFeatures(klass);
      // subclasses
      if (klass.subclassDefinition && klass.subclassDefinition.classFeatures) {
        logger.debug(`Processing subclass features for ${klass.subclassDefinition.name}`);
        await this._generateSubClassFeatures(klass);
      }
      logger.debug(`ddbClassFeatures for ${klass.definition.name}`, { ddbClassFeatures: this });
    }
    this.data = foundry.utils.duplicate(this._processed);
    // return this.data;
  }

}
