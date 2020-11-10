import utils from "../../utils.js";
import parseTemplateString from "../templateStrings.js";

/**
 * Searches for selected options if a given feature provides choices to the user
 * @param {string} type character property: "class", "race" etc.
 * @param {object} feat options to search for
 */
let getChoices = (ddb, type, feat) => {
  const id = feat.id;

  /**
   * EXAMPLE: Totem Spirit: Bear
    componentId: 100
    componentTypeId: 12168134
    defaultSubtypes: []
    id: "3-0-43966541"
    isInfinite: false
    isOptional: false
    label: null
    optionValue: 177
    options: Array(5)
      0: {id: 177, label: "Bear", description: "<p>While raging, you have resistance to all damage…u tough enough to stand up to any punishment.</p>"}
      1: {id: 178, label: "Eagle", description: "<p>While you’re raging, other creatures have disad…tor who can weave through the fray with ease.</p>"}
      2: {id: 179, label: "Wolf", description: "<p>While you’re raging, your friends have advantag…it of the wolf makes you a leader of hunters.</p>"}
      3: {id: 180, label: "Elk", description: "<p>While you are raging and aren't wearing heavy a…t of the elk makes you extraordinarily swift.</p>"}
      4: {id: 181, label: "Tiger", description: "<p>While raging, you can add 10 feet to your long … The spirit of the tiger empowers your leaps.</p>"}
 */

  if (ddb.character.choices[type] && Array.isArray(ddb.character.choices[type])) {
    // find a choice in the related choices-array
    const choices = ddb.character.choices[type].filter(
      (characterChoice) => characterChoice.componentId && characterChoice.componentId === id
    );

    if (choices) {
      const options = choices
        .filter(
          (choice) =>
            choice.options &&
            Array.isArray(choice.options) &&
            choice.optionValue &&
            choice.options.find((opt) => opt.id === choice.optionValue)
        )
        .map((choice) => {
          return choice.options.find((opt) => opt.id === choice.optionValue);
        });
      return options;
    }
  }
  // we could not determine if there are any choices left
  return undefined;
};

function getDescription(ddb, character, feat) {
  let snippet = "";
  let description = "";

  if (feat.definition && feat.definition.snippet) {
    snippet = parseTemplateString(ddb, character, feat.definition.snippet, feat);
  } else if (feat.snippet) {
    snippet = parseTemplateString(ddb, character, feat.snippet, feat);
  } else {
    snippet = "";
  }

  if (feat.definition && feat.definition.description) {
    description = parseTemplateString(ddb, character, feat.definition.description, feat);
  } else if (feat.description) {
    description = parseTemplateString(ddb, character, feat.description, feat);
  } else {
    description = "";
  }

  return {
    value: description !== "" ? description + (snippet !== "" ? "<h3>Summary</h3>" + snippet : "") : snippet,
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
        dndbeyond: {
          requiredLevel: feat.requiredLevel,
          displayOrder:
            feat.definition && feat.definition.displayOrder ? feat.definition.displayOrder : feat.displayOrder,
        },
      },
    },
  };

  // Add choices to the textual description of that feat
  let choices = getChoices(ddb, type, feat);

  if (choices.length > 0) {
    choices.forEach((choice) => {
      let choiceItem = JSON.parse(JSON.stringify(item));
      let choiceFeat = JSON.parse(JSON.stringify(feat));

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

      features.push(choiceItem);
    });
  } else {
    item.data.description = getDescription(ddb, character, feat);
    item.data.source = source;

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

function parseClassFeatures(ddb, character) {
  // class and subclass traits
  let classItems = [];
  let classesFeatureList = [];
  let subClassesFeatureList = [];
  let processedClassesFeatureList = [];

  // subclass features can often be duplicates of class features.
  ddb.character.classes.forEach((klass) => {
    const classFeatures = klass.definition.classFeatures.filter(
      (feat) =>
        feat.name !== "Proficiencies" &&
        feat.name !== "Ability Score Improvement" &&
        feat.requiredLevel <= klass.level
    );
    const klassName = klass.definition.name;
    const klassFeatureList = classFeatures
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
          feat.name !== "Proficiencies" &&
          feat.name !== "Bonus Proficiency" &&
          feat.name !== "Ability Score Improvement" &&
          feat.requiredLevel <= klass.level &&
          !ddb.character.actions.class.some((action) => action.name === feat.name)
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
  let items = [];

  // racial traits
  ddb.character.race.racialTraits
    .filter(
      (trait) =>
        !["Ability Score Increase", "Age", "Alignment", "Size", "Speed", "Languages"].includes(trait.definition.name) &&
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
  let classItems = parseClassFeatures(ddb, character);

  // now we loop over class features and add to list, removing any that match racial traits, e.g. Darkvision
  classItems.forEach((item) => {
    const existingFeature = getNameMatchedFeature(items, item);
    const duplicateFeature = isDuplicateFeature(items, item);
    if (existingFeature && !duplicateFeature) {
      const klassAdjustment = `<h3>${item.flags.ddbimporter.dndbeyond.class}</h3>${item.data.description.value}`;
      existingFeature.data.description.value += klassAdjustment;
    } else if (!existingFeature) {
      items.push(item);
    }
  });

  // finally add feats
  ddb.character.feats
    .filter((feat) => !ddb.character.actions.feat.some((action) => action.name === feat.name))
    .forEach((feat) => {
      const source = utils.parseSource(feat.definition);
      let feats = parseFeature(feat, ddb, character, source, "feat");
      feats.forEach((item) => {
        items.push(item);
      });
    });

  return items;
}
