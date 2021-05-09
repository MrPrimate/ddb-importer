import logger from "../../logger.js";
import utils from "../../utils.js";
import parseTemplateString from "../templateStrings.js";
import { fixFeatures, stripHtml, addFeatEffects } from "./special.js";
import { getBackgroundData } from "../character/bio.js";

function getDescription(ddb, character, feat) {
  // for now none actions probably always want the full text
  // const useFull = game.settings.get("ddb-importer", "character-update-policy-use-full-description");
  const useFull = true;
  let snippet = "";
  let description = "";

  if (feat.definition?.snippet) {
    snippet = parseTemplateString(ddb, character, feat.definition.snippet, feat).text;
  } else if (feat.snippet) {
    snippet = parseTemplateString(ddb, character, feat.snippet, feat).text;
  } else {
    snippet = "";
  }

  if (feat.definition?.description) {
    description = parseTemplateString(ddb, character, feat.definition.description, feat).text;
  } else if (feat.description) {
    description = parseTemplateString(ddb, character, feat.description, feat).text;
  } else {
    description = "";
  }

  if (stripHtml(description) === snippet) snippet = "";

  const fullDescription = description !== "" ? description + (snippet !== "" ? "<h3>Summary</h3>" + snippet : "") : snippet;
  const value = !useFull && snippet.trim() !== "" ? snippet : fullDescription;

  return {
    value: value,
    chat: snippet,
    unidentified: "",
  };
}

function parseFeature(feat, ddb, character, source, type) {
  let features = [];
  // filter proficiencies and Ability Score Improvement
  const name = feat.definition ? feat.definition.name : feat.name;
  let item = {
    name: name,
    type: "feat",
    data: JSON.parse(utils.getTemplate("feat")),
    flags: {
      ddbimporter: {
        id: feat.id,
        entityTypeId: feat.entityTypeId,
        dndbeyond: {
          requiredLevel: feat.requiredLevel,
          displayOrder:
            feat.definition && feat.definition.displayOrder ? feat.definition.displayOrder : feat.displayOrder,
        },
      },
    },
  };

  const klassAction = utils.findComponentByComponentId(ddb, feat.id);
  if (klassAction) {
    setProperty(item.flags, "ddbimporter.dndbeyond.levelScale", klassAction.levelScale);
    setProperty(item.flags, "ddbimporter.dndbeyond.levelScales", klassAction.definition?.levelScales);
    setProperty(item.flags, "ddbimporter.dndbeyond.limitedUse", klassAction.definition?.limitedUse);
  }

  if (feat?.requiredLevel) {
    const klass = ddb.character.classes.find((klass) => klass.definition.id === feat.classId);
    if (klass && feat.requiredLevel > klass.level) return [];
  }

  logger.debug(`Searching for ${name} choices`);

  // Add choices to the textual description of that feat
  let choices = utils.getChoices(ddb, type, feat);

  if (choices.length > 0) {
    logger.debug(`Found ${choices.map((c) => c.label).join(",")}`);
    choices.forEach((choice) => {
      logger.debug(`Adding choice ${choice.label}`);
      let choiceItem = JSON.parse(JSON.stringify(item));
      let choiceFeat = feat.definition ? JSON.parse(JSON.stringify(feat.definition)) : JSON.parse(JSON.stringify(feat));

     if (item.name === choice.label) return;

      choiceItem.name = choice.label ? `${choiceItem.name}: ${choice.label}` : choiceItem.name;
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
      choiceItem.data.description = getDescription(ddb, character, choiceFeat);
      choiceItem.data.source = source;

      choiceItem = addFeatEffects(ddb, character, feat, choiceItem, choice, type);
      features.push(choiceItem);
    });
  } else {
    item.data.description = getDescription(ddb, character, feat);
    item.data.source = source;
    item = addFeatEffects(ddb, character, feat, item, undefined, type);

    features.push(item);
  }

  return features;
}

function isDuplicateFeature(items, item) {
  return items.some((dup) => dup.name === item.name && dup.data.description.value === item.data.description.value);
}

function getNameMatchedFeature(items, item) {
  return items.find((dup) => dup.name === item.name);
}

function includedFeatureNameCheck(featName, addEffects) {
  // we add all features when parsing active effects
  if (addEffects) {
    const nameAllowed = !featName.startsWith("Ability Score");
    return nameAllowed;
  }

  const nameAllowed = !featName.startsWith("Proficiencies") &&
    !featName.startsWith("Ability Score") &&
    featName !== "Bonus Proficiency";

  return nameAllowed;
}


function parseClassFeatures(ddb, character, addEffects, actionAndFeature) {
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
        includedFeatureNameCheck(feat.name, addEffects) &&
        feat.requiredLevel <= klass.level
    );
    const klassName = klass.definition.name;
    const klassFeatureList = classFeatures
      .filter((feat) => !excludedFeatures.includes(feat.id))
      .map((feat) => {
        let items = parseFeature(feat, ddb, character, klassName, "class");
        return items.map((item) => {
          item.flags.ddbimporter.dndbeyond.class = klassName;
          // add feature to all features list
          classesFeatureList.push(JSON.parse(JSON.stringify(item)));
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
          const levelAdjustment = `<h3>${klassName}: Level ${item.flags.ddbimporter.dndbeyond.requiredLevel}</h3>${item.data.description.value}`;
          existingFeature.data.description.value += levelAdjustment;
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
          includedFeatureNameCheck(feat.name, addEffects) &&
          feat.requiredLevel <= klass.level &&
          (actionAndFeature || !ddb.character.actions.class.some((action) => action.name === feat.name)) &&
          !excludedFeatures.includes(feat.id)
      );
      const subKlassName = `${klassName} : ${klass.subclassDefinition.name}`;
      const subKlassFeatureList = subFeatures
        .map((feat) => {
          let subClassItems = parseFeature(feat, ddb, character, subKlassName, "class");
          return subClassItems.map((item) => {
            item.flags.ddbimporter.dndbeyond.class = subKlassName;
            // add feature to all features list
            subClassesFeatureList.push(JSON.parse(JSON.stringify(item)));
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
            const levelAdjustment = `<h3>${subKlassName}: At Level ${item.flags.ddbimporter.dndbeyond.requiredLevel}</h3>${item.data.description.value}`;
            existingFeature.data.description.value += levelAdjustment;
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
          const levelAdjustment = `<h3>${subKlassName}: At Level ${item.flags.ddbimporter.dndbeyond.requiredLevel}</h3>${item.data.description.value}`;
          existingFeature.data.description.value += levelAdjustment;
        } else if (!existingFeature) {
          classItems.push(item);
        }
      });
    }
  });
  return classItems;
}

export default function parseFeatures(ddb, character) {
  const daeInstalled = utils.isModuleInstalledAndActive("dae");
  const compendiumItem = character.flags.ddbimporter.compendium;
  const addEffects = (daeInstalled && compendiumItem)
    ? game.settings.get("ddb-importer", "munching-policy-add-effects")
    : game.settings.get("ddb-importer", "character-update-policy-add-character-effects");
  const actionAndFeature = game.settings.get("ddb-importer", "character-update-policy-use-action-and-feature");

  let items = [];

  // racial traits
  ddb.character.race.racialTraits
    .filter(
      (trait) =>
        // (!trait.definition.hideInSheet || (trait.definition.hideInSheet && addEffects)) &&
        !trait.definition.hideInSheet &&
        !ddb.character.actions.race.some((action) => action.name === trait.definition.name)
    )
    .forEach((feat) => {
      const source = utils.parseSource(feat.definition);
      let features = parseFeature(feat, ddb, character, source, "race");
      features.forEach((item) => {
        const existingFeature = getNameMatchedFeature(items, item);
        const duplicateFeature = isDuplicateFeature(items, item);
        if (existingFeature && !duplicateFeature) {
          existingFeature.data.description.value += `<h3>Racial Trait Addition</h3>${item.data.description.value}`;
        } else if (!existingFeature) {
          items.push(item);
        }
      });
    });

  // class and subclass traits
  let classItems = parseClassFeatures(ddb, character, addEffects);

  // optional class features
  if (ddb.classOptions) {
    ddb.classOptions
    .filter((feat) => actionAndFeature || !ddb.character.actions.class.some((action) => action.name === feat.name))
    .forEach((feat) => {
      logger.debug(`Parsing Optional Feature ${feat.name}`);
      const source = utils.parseSource(feat);
      let feats = parseFeature(feat, ddb, character, source, "feat");
      feats.forEach((item) => {
        items.push(item);
      });
    });
  }

  // now we loop over class features and add to list, removing any that match racial traits, e.g. Darkvision
  classItems
  .filter((item) => actionAndFeature || !ddb.character.actions.class.some((action) => action.name === item.name))
  .forEach((item) => {
    const existingFeature = getNameMatchedFeature(items, item);
    const duplicateFeature = isDuplicateFeature(items, item);
    if (existingFeature && !duplicateFeature) {
      const klassAdjustment = `<h3>${item.flags.ddbimporter.dndbeyond.class}</h3>${item.data.description.value}`;
      existingFeature.data.description.value += klassAdjustment;
    } else if (!existingFeature) {
      items.push(item);
    }
  });

  // add feats
  ddb.character.feats
    .filter((feat) => !ddb.character.actions.feat.some((action) => action.name === feat.name))
    .forEach((feat) => {
      const source = utils.parseSource(feat.definition);
      let feats = parseFeature(feat, ddb, character, source, "feat");
      feats.forEach((item) => {
        items.push(item);
      });
    });

  const backgroundFeature = getBackgroundData(ddb);
  const backgroundSource = utils.parseSource(backgroundFeature.definition);
  const backgroundFeat = parseFeature(backgroundFeature, ddb, character, backgroundSource, "background");
  backgroundFeat.forEach((item) => {
    items.push(item);
  });

  fixFeatures(items);
  return items;
}
