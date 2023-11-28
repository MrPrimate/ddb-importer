// import DICTIONARY from "../../dictionary.js";
// import logger from "../../logger.js";
import utils from "../../lib/utils.js";
import DDBHelper from "../../lib/DDBHelper.js";
import { generateEffects } from "../../effects/effects.js";
import { generateBaseACItemEffect } from "../../effects/acEffects.js";

import parseTemplateString from "../../lib/DDBTemplateStrings.js";

function generateFeatModifiers(ddb, ddbItem, choice, type) {
  // console.warn(ddbItem);
  // console.log(choice);
  if (ddbItem.grantedModifiers) return ddbItem;
  let modifierItem = duplicate(ddbItem);
  const modifiers = [
    DDBHelper.getChosenClassModifiers(ddb, { includeExcludedEffects: true, effectOnly: true }),
    DDBHelper.getModifiers(ddb, "race", true, true),
    DDBHelper.getModifiers(ddb, "background", true, true),
    DDBHelper.getModifiers(ddb, "feat", true, true),
  ].flat();

  // console.warn(modifiers);
  // console.log(ddb.character.options[type]);
  // console.warn(`${ddbItem.name} Adding modifiers`, { ddbItem, choice, type, modifiers });
  // console.log(type);
  // if (type === "race") console.log(modifiers);

  if (!modifierItem.definition) modifierItem.definition = {};
  modifierItem.definition.grantedModifiers = modifiers.filter((mod) => {
    if (mod.componentId === ddbItem.definition?.id && mod.componentTypeId === ddbItem.definition?.entityTypeId)
      return true;
    if (choice && ddb.character.options[type]?.length > 0) {
      // if it is a choice option, try and see if the mod matches
      const choiceMatch = ddb.character.options[type].some(
        (option) =>
          // id match
          choice.componentId == option.componentId // the choice id matches the option componentID
          && option.definition.id == mod.componentId // option id and mod id match
          && (choice.componentTypeId == option.componentTypeId // either the choice componenttype and optiontype match or
            || choice.componentTypeId == option.definition.entityTypeId) // the choice componentID matches the option definition entitytypeid
          && option.definition.entityTypeId == mod.componentTypeId // mod componentId matches option entity type id
          && choice.id == mod.componentId // choice id and mod id match
      );
      // console.log(`choiceMatch ${choiceMatch}`);
      if (choiceMatch) return true;
    } else if (choice) {
      // && choice.parentChoiceId
      const choiceIdSplit = choice.choiceId.split("-").pop();
      if (mod.id == choiceIdSplit) return true;
    }

    if (mod.componentId === ddbItem.id || mod.componentId === ddbItem.definition?.id) {
      if (type === "class") {
        // logger.log("Class check - feature effect parsing");
        const classFeatureMatch = ddb.character.classes.some((klass) =>
          klass.classFeatures.some(
            (f) => f.definition.entityTypeId == mod.componentTypeId && f.definition.id == ddbItem.id
          )
        );
        if (classFeatureMatch) return true;
      } else if (type === "feat") {
        const featMatch = ddb.character.feats.some(
          (f) => f.definition.entityTypeId == mod.componentTypeId && f.definition.id == ddbItem.id
        );
        if (featMatch) return true;
      } else if (type === "race") {
        const traitMatch = ddb.character.race.racialTraits.some(
          (t) =>
            t.definition.entityTypeId == mod.componentTypeId
            && t.definition.id == mod.componentId
            && t.definition.id == ddbItem.definition.id
        );
        if (traitMatch) return true;
      }
    }
    return false;
  });
  // console.warn("Modifier Item", modifierItem);
  return modifierItem;
}

export function addFeatEffects(ddb, character, ddbItem, item, choice, type) {
  // can we apply any effects to this feature
  const daeInstalled = game.modules.get("dae")?.active;
  const compendiumItem = character.flags.ddbimporter.compendium;
  const addCharacterEffects = compendiumItem
    ? game.settings.get("ddb-importer", "munching-policy-add-effects")
    : game.settings.get("ddb-importer", "character-update-policy-add-character-effects");
  const modifierItem = generateFeatModifiers(ddb, ddbItem, choice, type);
  if (daeInstalled && addCharacterEffects) {
    item = generateEffects(ddb, character, modifierItem, item, compendiumItem, "feat");
    // console.log(item);
  } else {
    item = generateBaseACItemEffect(ddb, character, modifierItem, item, compendiumItem);
  }

  return item;
}

function buildFullDescription(main, summary, title) {
  let result = "";

  if (summary && !utils.stringKindaEqual(main, summary) && summary.trim() !== "" && main.trim() !== "") {
    result += summary.trim();
    result += `
<details>
  <summary>
    ${title ? title : "More Details"}
  </summary>
  <p>
    ${main.trim()}
  </p>
</details>`;
  } else if (main.trim() === "") {
    result += summary.trim();
  } else {
    result += main.trim();
  }

  return result;
}

function getClassFeatureDescription(ddb, character, feat) {
  const componentId = feat.definition?.componentId
    ? feat.definition.componentId
    : feat.componentId;
  const componentTypeId = feat.definition?.componentTypeId
    ? feat.definition.componentTypeId
    : feat.componentTypeId;

  const findFeatureKlass = ddb.character.classes
    .find((cls) => cls.classFeatures.find((feature) =>
      feature.definition.id == componentId
      && feature.definition.entityTypeId == componentTypeId
    ));

  if (findFeatureKlass) {
    const feature = findFeatureKlass.classFeatures
      .find((feature) =>
        feature.definition.id == componentId
        && feature.definition.entityTypeId == componentTypeId
      );
    if (feature) {
      return parseTemplateString(ddb, character, feature.definition.description, feat).text;
    }
  }
  return "";

}


export function getDescription(ddb, character, feat, forceFull = false) {
  // for now none actions probably always want the full text
  const useFullSetting = game.settings.get("ddb-importer", "character-update-policy-use-full-description");
  const useFull = forceFull || useFullSetting;
  const chatAdd = game.settings.get("ddb-importer", "add-description-to-chat");

  const rawSnippet = feat.definition?.snippet
    ? parseTemplateString(ddb, character, feat.definition.snippet, feat).text
    : feat.snippet
      ? parseTemplateString(ddb, character, feat.snippet, feat).text
      : "";

  const description = feat.definition?.description && feat.definition.description !== ""
    ? parseTemplateString(ddb, character, feat.definition.description, feat).text
    : feat.description && feat.description !== ""
      ? parseTemplateString(ddb, character, feat.description, feat).text
      : getClassFeatureDescription(ddb, character, feat);

  const snippet = utils.stringKindaEqual(description, rawSnippet) ? "" : rawSnippet;
  const fullDescription = buildFullDescription(description, snippet);
  const value = !useFull && snippet.trim() !== "" ? snippet : fullDescription;

  return {
    value: value,
    chat: chatAdd ? snippet : "",
    unidentified: "",
  };
}

export function setLevelScales(classes, features) {
  features.forEach((feature) => {
    const featureName = utils.referenceNameString(feature.name.toLowerCase());
    const scaleKlass = classes.find((klass) =>
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

