import logger from "../../logger.js";
import utils from "../../lib/utils.js";
import DDBHelper from "../../lib/DDBHelper.js";
import { fixFeatures, getDescription, addFeatEffects, addExtraEffects, setLevelScales } from "./special.js";
import DDBCharacter from "../DDBCharacter.js";

function parseFeature(feat, ddb, character, source, type) {
  let features = [];
  // filter proficiencies and Ability Score Improvement
  const name = feat.definition ? feat.definition.name : feat.name;
  let item = {
    name: name.replace("’", "'").trim(),
    type: "feat",
    system: JSON.parse(utils.getTemplate("feat")),
    flags: {
      ddbimporter: {
        id: feat.definition?.id ? feat.definition.id : feat.id,
        type: type,
        entityTypeId: feat.definition?.entityTypeId ? feat.definition.entityTypeId : feat.entityTypeId,
        dndbeyond: {
          requiredLevel: feat.requiredLevel,
          displayOrder:
            feat.definition && feat.definition.displayOrder ? feat.definition.displayOrder : feat.displayOrder,
        },
      },
      obsidian: {
        source: {
          type: type,
        },
      },
    },
  };

  item.system.type.value = type === "race" ? "species" : type;

  logger.debug(`Getting Feature ${item.name}`);

  const klassAction = DDBHelper.findComponentByComponentId(ddb, feat.id);
  if (klassAction) {
    setProperty(item.flags, "ddbimporter.dndbeyond.levelScale", klassAction.levelScale);
    setProperty(item.flags, "ddbimporter.dndbeyond.levelScales", klassAction.definition?.levelScales);
    setProperty(item.flags, "ddbimporter.dndbeyond.limitedUse", klassAction.definition?.limitedUse);
  }

  if (!klassAction) {
    const classOption = [ddb.character.options.race, ddb.character.options.class, ddb.character.options.feat]
      .flat()
      .find((option) => option.definition.id === feat.componentId);
    if (classOption) {
      const classOptionLink = DDBHelper.findComponentByComponentId(ddb, classOption.componentId);
      if (classOptionLink) {
        setProperty(item.flags, "ddbimporter.dndbeyond.levelScale", classOptionLink.levelScale);
        setProperty(item.flags, "ddbimporter.dndbeyond.levelScales", classOptionLink.definition?.levelScales);
        setProperty(item.flags, "ddbimporter.dndbeyond.limitedUse", classOptionLink.definition?.limitedUse);
      }
    }
  }

  if (feat?.requiredLevel) {
    const klass = ddb.character.classes.find((klass) => klass.definition.id === feat.classId || klass.subclassDefinition?.id === feat.classId);
    if (klass && feat.requiredLevel > klass.level) return [];
  }

  logger.debug(`Searching for ${name} choices`);

  // Add choices to the textual description of that feat
  let choices = DDBHelper.getChoices(ddb, type, feat);

  if (type === "background") {
    logger.debug(`Found background ${feat.name}`);
    logger.debug(`Found ${choices.map((c) => c.label).join(",")}`);
    item.system.description = getDescription(ddb, character, feat, true);
    item.system.description.value += `<h3>Choices</h3><ul>`;
    item.system.source = source;
    choices.forEach((choice) => {
      let choiceItem = duplicate(item);
      item = addFeatEffects(ddb, character, feat, choiceItem, choice, type);
      item.system.description.value += `<li>${choice.label}</li>`;
    });
    item.system.description.value += `</ul>`;
    features.push(item);
    item.type = "background";
    item.img = "icons/skills/trades/academics-book-study-purple.webp";
    item.name = item.name.split("Background: ").pop();

  } else if (choices.length > 0) {
    logger.debug(`Found ${choices.map((c) => c.label).join(",")}`);
    choices.forEach((choice) => {
      logger.debug(`Adding choice ${choice.label}`);
      let choiceItem = duplicate(item);
      let choiceFeat = feat.definition ? duplicate(feat.definition) : duplicate(feat);

      if (item.name === choice.label) return;

      choiceItem.name = choice.label
        ? `${choiceItem.name}: ${choice.label}`
        : choiceItem.name;
      choiceItem.name = choiceItem.name.replace("’", "'");
      if (choice.wasOption && choice.description) {
        choiceFeat.description = choice.description;
        choiceFeat.snippet = choice.snippet ? choice.snippet : "";
      } else {
        if (choiceFeat.description) {
          choiceFeat.description = choice.description
            ? choiceFeat.description + "<h3>" + choice.label + "</h3>" + choice.description
            : choiceFeat.description;
        }
        if (choiceFeat.snippet) {
          choiceFeat.snippet = choice.description
            ? choiceFeat.snippet + "<h3>" + choice.label + "</h3>" + choice.description
            : choiceFeat.snippet;
        }
      }
      // add these flags in so they can be used by the description parser
      setProperty(choiceFeat, "flags.ddbimporter.dndbeyond.choice", choice);

      choiceItem.system.description = getDescription(ddb, character, choiceFeat, false);
      choiceItem.system.source = source;
      choiceItem.flags.ddbimporter.dndbeyond.choice = {
        label: choice.label,
        choiceId: choice.choiceId,
        componentId: choice.componentId,
        componentTypeId: choice.componentTypeId,
        parentChoiceId: choice.parentChoiceId,
        subType: choice.subType,
        wasOption: choice.wasOption,
        entityTypeId: choice.entityTypeId,
        type: choice.type,
      };

      choiceItem = addFeatEffects(ddb, character, feat, choiceItem, choice, type);
      features.push(choiceItem);
    });
  } else {
    item.system.description = getDescription(ddb, character, feat, true);
    item.system.source = source;
    item = addFeatEffects(ddb, character, feat, item, undefined, type);

    features.push(item);
  }

  return features;
}

function isDuplicateFeature(items, item) {
  return items.some((dup) => dup.name === item.name && dup.system.description.value === item.system.description.value);
}

function getNameMatchedFeature(items, item) {
  return items.find((dup) => dup.name === item.name && item.flags.ddbimporter.type === dup.flags.ddbimporter.type);
}

const SKIPPED_FEATURES = [
  "Hit Points",
  "Languages",
  "Bonus Proficiency",
  "Speed",
];
function includedFeatureNameCheck(featName) {
  const nameAllowed = !featName.startsWith("Proficiencies")
    && !featName.startsWith("Ability Score")
    && !featName.startsWith("Size")
    && !SKIPPED_FEATURES.includes(featName);

  return nameAllowed;
}


function parseClassFeatures(ddb, character) {
  // class and subclass traits
  let classItems = [];
  let classesFeatureList = [];
  let subClassesFeatureList = [];
  let processedClassesFeatureList = [];
  const excludedFeatures = ddb.character.optionalClassFeatures
    .filter((f) => f.affectedClassFeatureId)
    .map((f) => f.affectedClassFeatureId);

  // subclass features can often be duplicates of class features.
  ddb.character.classes.forEach((klass) => {
    const classFeatures = klass.definition.classFeatures.filter(
      (feat) =>
        includedFeatureNameCheck(feat.name)
        && feat.requiredLevel <= klass.level
    );
    const klassName = klass.definition.name;
    const klassFeatureList = classFeatures
      .filter((feat) => !excludedFeatures.includes(feat.id))
      .map((feat) => {
        let items = parseFeature(feat, ddb, character, klassName, "class");
        return items.map((item) => {
          item.flags.ddbimporter.dndbeyond.class = klassName;
          item.flags.ddbimporter.class = klass.definition.name;
          item.flags.ddbimporter.subclass = hasProperty(klass, "subclassDefinition.name")
            ? klass.subclassDefinition.name
            : undefined;
          item.flags.obsidian.source.text = klassName;
          // add feature to all features list
          classesFeatureList.push(duplicate(item));
          return item;
        });
      })
      .flat()
      .sort((a, b) => {
        return a.flags.ddbimporter.dndbeyond.displayOrder - b.flags.ddbimporter.dndbeyond.displayOrder;
      });

    klassFeatureList.forEach((item) => {
      // have we already processed an identical item?
      if (!isDuplicateFeature(processedClassesFeatureList, item)) {
        const existingFeature = getNameMatchedFeature(classItems, item);
        const duplicateFeature = isDuplicateFeature(classItems, item);
        if (existingFeature && !duplicateFeature) {
          const levelAdjustment = `<h3>${klassName}: Level ${item.flags.ddbimporter.dndbeyond.requiredLevel}</h3>${item.system.description.value}`;
          existingFeature.system.description.value += levelAdjustment;
        } else if (!existingFeature) {
          classItems.push(item);
        }
      }
    });
    processedClassesFeatureList = processedClassesFeatureList.concat(classesFeatureList, klassFeatureList);

    // subclasses
    if (klass.subclassDefinition && klass.subclassDefinition.classFeatures) {
      let subClassItems = [];
      const subFeatures = klass.subclassDefinition.classFeatures.filter(
        (feat) =>
          includedFeatureNameCheck(feat.name)
          && feat.requiredLevel <= klass.level
          && !excludedFeatures.includes(feat.id)
      );
      const subKlassName = `${klassName} : ${klass.subclassDefinition.name}`;
      const subKlassFeatureList = subFeatures
        .map((feat) => {
          let subClassItems = parseFeature(feat, ddb, character, subKlassName, "class");
          return subClassItems.map((item) => {
            item.flags.ddbimporter.dndbeyond.class = subKlassName;
            item.flags.obsidian.source.text = klassName;
            item.flags.ddbimporter.class = klass.definition.name;
            item.flags.ddbimporter.subclass = hasProperty(klass, "subclassDefinition.name")
              ? klass.subclassDefinition.name
              : undefined;
            // add feature to all features list
            subClassesFeatureList.push(duplicate(item));
            return item;
          });
        })
        .flat()
        .sort((a, b) => {
          return a.flags.ddbimporter.dndbeyond.displayOrder - b.flags.ddbimporter.dndbeyond.displayOrder;
        });

      // parse out duplicate features from class features
      subKlassFeatureList.forEach((item) => {
        if (!isDuplicateFeature(classesFeatureList, item)) {
          const existingFeature = getNameMatchedFeature(subClassItems, item);
          const duplicateFeature = isDuplicateFeature(subClassItems, item);
          if (existingFeature && !duplicateFeature) {
            const levelAdjustment = `<h3>${subKlassName}: At Level ${item.flags.ddbimporter.dndbeyond.requiredLevel}</h3>${item.system.description.value}`;
            existingFeature.system.description.value += levelAdjustment;
          } else if (!existingFeature) {
            subClassItems.push(item);
          }
        }
      });
      // add features to list to indicate processed
      processedClassesFeatureList = processedClassesFeatureList.concat(subClassesFeatureList, subKlassFeatureList);

      // now we take the unique subclass features and add to class
      subClassItems.forEach((item) => {
        const existingFeature = getNameMatchedFeature(classItems, item);
        const duplicateFeature = isDuplicateFeature(classItems, item);
        if (existingFeature && !duplicateFeature) {
          const levelAdjustment = `<h3>${subKlassName}: At Level ${item.flags.ddbimporter.dndbeyond.requiredLevel}</h3>${item.system.description.value}`;
          existingFeature.system.description.value += levelAdjustment;
        } else if (!existingFeature) {
          classItems.push(item);
        }
      });
    }
  });
  return classItems;
}

DDBCharacter.prototype._generateFeatures = async function _generateFeatures() {
  const ddb = this.source.ddb;
  const character = this.raw.character;
  const classes = this.raw.classes;
  let items = [];

  const excludedOriginFeatures = ddb.character.optionalOrigins
    .filter((f) => f.affectedRacialTraitId)
    .map((f) => f.affectedRacialTraitId);

  // racial traits
  logger.debug("Parsing racial traits");
  ddb.character.race.racialTraits
    .filter(
      (trait) => includedFeatureNameCheck(trait.definition.name) && !trait.definition.hideInSheet && !excludedOriginFeatures.includes(trait.definition.id))
    .forEach((feat) => {
      const source = DDBHelper.parseSource(feat.definition);
      const features = parseFeature(feat, ddb, character, source, "race");
      features.forEach((item) => {
        const existingFeature = getNameMatchedFeature(items, item);
        const duplicateFeature = isDuplicateFeature(items, item);
        if (existingFeature && !duplicateFeature) {
          existingFeature.system.description.value += `<h3>Racial Trait Addition</h3>${item.system.description.value}`;
        } else if (!existingFeature) {
          items.push(item);
        }
      });
    });

  // class and subclass traits
  logger.debug("Parsing class and subclass features");
  let classItems = parseClassFeatures(ddb, character);

  // optional class features
  logger.debug("Parsing optional class features");
  if (ddb.classOptions) {
    ddb.classOptions
      .forEach((feat) => {
        logger.debug(`Parsing Optional Feature ${feat.name}`);
        const source = DDBHelper.parseSource(feat);
        const feats = parseFeature(feat, ddb, character, source, "class");
        feats.forEach((item) => {
          items.push(item);
        });
      });
  }

  // now we loop over class features and add to list, removing any that match racial traits, e.g. Darkvision
  logger.debug("Removing matching traits");
  classItems
    .forEach((item) => {
      const existingFeature = getNameMatchedFeature(items, item);
      const duplicateFeature = isDuplicateFeature(items, item);
      if (existingFeature && !duplicateFeature) {
        const klassAdjustment = `<h3>${item.flags.ddbimporter.dndbeyond.class}</h3>${item.system.description.value}`;
        existingFeature.system.description.value += klassAdjustment;
      } else if (!existingFeature) {
        items.push(item);
      }
    });

  // add feats
  logger.debug("Parsing feats");
  ddb.character.feats
    .forEach((feat) => {
      const source = DDBHelper.parseSource(feat.definition);
      const feats = parseFeature(feat, ddb, character, source, "feat");
      feats.forEach((item) => {
        items.push(item);
      });
    });

  logger.debug("Parsing backgrounds");
  const backgroundFeature = this.getBackgroundData();
  const backgroundSource = DDBHelper.parseSource(backgroundFeature.definition);
  const backgroundFeat = parseFeature(backgroundFeature, ddb, character, backgroundSource, "background");
  backgroundFeat.forEach((item) => {
    items.push(item);
  });

  logger.debug("Feature fixes");
  setLevelScales(classes, items);
  fixFeatures(items);
  this.raw.features = await addExtraEffects(ddb, items, character);
};
