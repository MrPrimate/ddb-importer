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
    if (!allowedByLevel) return [];
    if (feature.isChoiceFeature) {
      return DDBChoiceFeature.buildChoiceFeatures(feature);
    } else {
      return [feature.data];
    }
  }


  _generateClassFeatures(klass) {
    const classFeatures = klass.definition.classFeatures.filter(
      (feat) =>
        DDBFeatures.includedFeatureNameCheck(feat.name)
        && feat.requiredLevel <= klass.level
    );
    const klassName = klass.definition.name;
    const klassFeatureList = classFeatures
      .filter((feat) => !this.excludedFeatures.includes(feat.id))
      .map((feat) => {
        let items = this._getFeatures(feat, "class", klassName);
        return items.map((item) => {
          item.flags.ddbimporter.dndbeyond.class = klassName;
          item.flags.ddbimporter.class = klass.definition.name;
          item.flags.ddbimporter.subclass = hasProperty(klass, "subclassDefinition.name")
            ? klass.subclassDefinition.name
            : undefined;
          item.flags.obsidian.source.text = klassName;
          // add feature to all features list
          this.featureList.class.push(duplicate(item));
          return item;
        });
      })
      .flat()
      .sort((a, b) => {
        return a.flags.ddbimporter.dndbeyond.displayOrder - b.flags.ddbimporter.dndbeyond.displayOrder;
      });

    klassFeatureList.forEach((item) => {
      // have we already processed an identical item?
      if (!DDBFeatures.isDuplicateFeature(this._processed, item)) {
        const existingFeature = DDBFeatures.getNameMatchedFeature(this.data, item);
        const duplicateFeature = DDBFeatures.isDuplicateFeature(this.data, item);
        if (existingFeature && !duplicateFeature) {
          const levelAdjustment = `<h3>${klassName}: Level ${item.flags.ddbimporter.dndbeyond.requiredLevel}</h3>${item.system.description.value}`;
          existingFeature.system.description.value += levelAdjustment;
        } else if (!existingFeature) {
          this.data.push(item);
        }
      }
    });
    this._processed.push(...this.featureList.class, ...klassFeatureList);
  }

  _generateSubClassFeatures(klass) {
    const klassName = klass.definition.name;

    let subClassItems = [];
    const subFeatures = klass.subclassDefinition.classFeatures.filter(
      (feat) =>
        DDBFeatures.includedFeatureNameCheck(feat.name)
        && feat.requiredLevel <= klass.level
        && !this.excludedFeatures.includes(feat.id)
    );
    const subKlassName = `${klassName} : ${klass.subclassDefinition.name}`;
    const subKlassFeatureList = subFeatures
      .map((feat) => {
        let items = this._getFeatures(feat, "class", subKlassName);
        return items.map((item) => {
          item.flags.ddbimporter.dndbeyond.class = subKlassName;
          item.flags.obsidian.source.text = klassName;
          item.flags.ddbimporter.class = klass.definition.name;
          item.flags.ddbimporter.subclass = hasProperty(klass, "subclassDefinition.name")
            ? klass.subclassDefinition.name
            : undefined;
          // add feature to all features list
          this.featureList.subClass.push(duplicate(item));
          return item;
        });
      })
      .flat()
      .sort((a, b) => {
        return a.flags.ddbimporter.dndbeyond.displayOrder - b.flags.ddbimporter.dndbeyond.displayOrder;
      });

    // parse out duplicate features from class features
    subKlassFeatureList.forEach((item) => {
      if (!DDBFeatures.isDuplicateFeature(this.featureList.class, item)) {
        const existingFeature = DDBFeatures.getNameMatchedFeature(subClassItems, item);
        const duplicateFeature = DDBFeatures.isDuplicateFeature(subClassItems, item);
        if (existingFeature && !duplicateFeature) {
          const levelAdjustment = `<h3>${subKlassName}: At Level ${item.flags.ddbimporter.dndbeyond.requiredLevel}</h3>${item.system.description.value}`;
          existingFeature.system.description.value += levelAdjustment;
        } else if (!existingFeature) {
          subClassItems.push(item);
        }
      }
    });
    // add features to list to indicate processed
    this._processed.push(...this.featureList.subClass, ...subKlassFeatureList);

    // now we take the unique subclass features and add to class
    subClassItems.forEach((item) => {
      const existingFeature = DDBFeatures.getNameMatchedFeature(this.data, item);
      const duplicateFeature = DDBFeatures.isDuplicateFeature(this.data, item);
      if (existingFeature && !duplicateFeature) {
        const levelAdjustment = `<h3>${subKlassName}: At Level ${item.flags.ddbimporter.dndbeyond.requiredLevel}</h3>${item.system.description.value}`;
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
    });
    // return this.data;
  }

}
