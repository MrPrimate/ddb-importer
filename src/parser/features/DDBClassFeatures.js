import logger from "../../logger.js";
import DDBChoiceFeature from "./DDBChoiceFeature.js";
import DDBFeature from "./DDBFeature.js";
import DDBFeatures from "./DDBFeatures.js";


export default class DDBClassFeatures {

  constructor({ ddbData, rawCharacter = null } = {}) {
    this.ddbData = ddbData;
    this.rawCharacter = rawCharacter;
    this.data = [];

    this.featureList = {
      class: [],
      subClass: [],
    };
    this.data = [];
    this._processed = [];

    this.excludedFeatures = this.ddbData.character.optionalClassFeatures
      .filter((f) => f.affectedClassFeatureId)
      .map((f) => f.affectedClassFeatureId);
  }

  _getFeatures(featureDefinition, type, source, filterByLevel = true) {
    const feature = new DDBFeature({
      ddbData: this.ddbData,
      ddbDefinition: featureDefinition,
      rawCharacter: this.rawCharacter,
      type,
      source,
    });
    feature.build();
    const allowedByLevel = !filterByLevel || (filterByLevel && feature.hasRequiredLevel);

    logger.debug(`DDBClassFeatures._getFeatures: ${feature.ddbDefinition.name}`, {
      featureDefinition,
      feature,
      this: this,
    });

    if (!allowedByLevel) return [];
    if (feature.isChoiceFeature) {
      return DDBChoiceFeature.buildChoiceFeatures(feature);
    } else {
      return [feature.data];
    }
  }


  _generateClassFeatures(klass) {

    const className = klass.definition.name;
    const classFeatureIds = klass.definition.classFeatures.map((f) => f.id);

    const classFeatures = klass.classFeatures.filter(
      (feat) =>
        classFeatureIds.includes(feat.definition.id)
        && DDBFeatures.includedFeatureNameCheck(feat.definition.name)
        && feat.definition.requiredLevel <= klass.level
    );

    const classFeatureList = classFeatures
      .filter((feat) => !this.excludedFeatures.includes(feat.definition.id))
      .map((feat) => {
        let items = this._getFeatures(feat, "class", className);
        return items.map((item) => {
          item.flags.ddbimporter.dndbeyond.class = className;
          item.flags.ddbimporter.class = klass.definition.name;
          item.flags.ddbimporter.subclass = foundry.utils.hasProperty(klass, "subclassDefinition.name")
            ? klass.subclassDefinition.name
            : undefined;
          item.flags.obsidian.source.text = className;
          // add feature to all features list
          this.featureList.class.push(foundry.utils.duplicate(item));
          return item;
        });
      })
      .flat()
      .sort((a, b) => {
        return a.flags.ddbimporter.dndbeyond.displayOrder - b.flags.ddbimporter.dndbeyond.displayOrder;
      });

    classFeatureList.forEach((item) => {
      // have we already processed an identical item?
      if (!DDBFeatures.isDuplicateFeature(this._processed, item)) {
        const existingFeature = DDBFeatures.getNameMatchedFeature(this.data, item);
        const duplicateFeature = DDBFeatures.isDuplicateFeature(this.data, item);
        if (existingFeature && !duplicateFeature) {
          const levelAdjustment = `<h3>${className}: Level ${item.flags.ddbimporter.dndbeyond.requiredLevel}</h3>${item.system.description.value}`;
          existingFeature.system.description.value += levelAdjustment;
        } else if (!existingFeature) {
          this.data.push(item);
        }
      }
    });
    this._processed.push(...this.featureList.class, ...classFeatureList);
  }

  _generateSubClassFeatures(klass) {
    const subClassFeatureIds = klass.classFeatures
      .filter((f) => f.definition.classId === klass.subclassDefinition.id)
      .map((f) => f.definition.id);

    const className = klass.definition.name;
    const subClassName = `${className} : ${klass.subclassDefinition.name}`;

    let subClassItems = [];

    const subClassFeatures = klass.classFeatures.filter(
      (feat) =>
        subClassFeatureIds.includes(feat.definition.id)
        && DDBFeatures.includedFeatureNameCheck(feat.definition.name)
        && feat.definition.requiredLevel <= klass.level
        && !this.excludedFeatures.includes(feat.definition.id)
    );

    const subClassFeatureList = subClassFeatures
      .map((feat) => {
        let items = this._getFeatures(feat, "class", subClassName);
        return items.map((item) => {
          item.flags.ddbimporter.dndbeyond.class = subClassName;
          item.flags.obsidian.source.text = className;
          item.flags.ddbimporter.class = klass.definition.name;
          item.flags.ddbimporter.subclass = foundry.utils.hasProperty(klass, "subclassDefinition.name")
            ? klass.subclassDefinition.name
            : undefined;
          // add feature to all features list
          this.featureList.subClass.push(foundry.utils.duplicate(item));
          return item;
        });
      })
      .flat()
      .sort((a, b) => {
        return a.flags.ddbimporter.dndbeyond.displayOrder - b.flags.ddbimporter.dndbeyond.displayOrder;
      });

    // parse out duplicate features from class features
    subClassFeatureList.forEach((item) => {
      if (!DDBFeatures.isDuplicateFeature(this.featureList.class, item)) {
        const existingFeature = DDBFeatures.getNameMatchedFeature(subClassItems, item);
        const duplicateFeature = DDBFeatures.isDuplicateFeature(subClassItems, item);
        if (existingFeature && !duplicateFeature) {
          const levelAdjustment = `<h3>${subClassName}: At Level ${item.flags.ddbimporter.dndbeyond.requiredLevel}</h3>${item.system.description.value}`;
          existingFeature.system.description.value += levelAdjustment;
        } else if (!existingFeature) {
          subClassItems.push(item);
        }
      }
    });
    // add features to list to indicate processed
    this._processed.push(...this.featureList.subClass, ...subClassFeatureList);

    // now we take the unique subclass features and add to class
    subClassItems.forEach((item) => {
      const existingFeature = DDBFeatures.getNameMatchedFeature(this.data, item);
      const duplicateFeature = DDBFeatures.isDuplicateFeature(this.data, item);
      if (existingFeature && !duplicateFeature) {
        const levelAdjustment = `<h3>${subClassName}: At Level ${item.flags.ddbimporter.dndbeyond.requiredLevel}</h3>${item.system.description.value}`;
        existingFeature.system.description.value += levelAdjustment;
      } else if (!existingFeature) {
        this.data.push(item);
      }
    });

  }

  build() {

    // subclass features can often be duplicates of class features.
    this.ddbData.character.classes.forEach((klass) => {
      logger.debug(`Processing class features for ${klass.definition.name}`);
      this._generateClassFeatures(klass);
      // subclasses
      if (klass.subclassDefinition && klass.subclassDefinition.classFeatures) {
        logger.debug(`Processing subclass features for ${klass.subclassDefinition.name}`);
        this._generateSubClassFeatures(klass);
      }
      logger.debug(`ddbClassFeatures for ${klass.definition.name}`, { ddbClassFeatures: this });
    });
    // return this.data;
  }

}
