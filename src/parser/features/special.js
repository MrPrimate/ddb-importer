// import DICTIONARY from "../../dictionary.js";
// import logger from "../../logger.js";
import utils from "../../utils.js";
import { generateEffects } from "../../effects/effects.js";
import { generateBaseACItemEffect } from "../../effects/acEffects.js";
import { generateTable } from "../../muncher/table.js";
import { generateExtraEffects } from "../../effects/specialFeats.js";
import parseTemplateString from "../templateStrings.js";

function generateFeatModifiers(ddb, ddbItem, choice, type) {
  // console.warn(ddbItem);
  // console.log(choice);
  if (ddbItem.grantedModifiers) return ddbItem;
  let modifierItem = JSON.parse(JSON.stringify(ddbItem));
  const modifiers = [
    utils.getChosenClassModifiers(ddb, true, true),
    utils.getModifiers(ddb, "race", true, true),
    utils.getModifiers(ddb, "background", true, true),
    utils.getModifiers(ddb, "feat", true, true),
  ].flat();

  // console.warn(modifiers);
  // console.log(ddb.character.options[type]);
  // console.warn("Adding modifiers");
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
          choice.componentId == option.componentId && // the choice id matches the option componentID
          option.definition.id == mod.componentId && // option id and mod id match
          (choice.componentTypeId == option.componentTypeId || // either the choice componenttype and optiontype match or
            choice.componentTypeId == option.definition.entityTypeId) && // the choice componentID matches the option definition entitytypeid
          option.definition.entityTypeId == mod.componentTypeId && // mod componentId matches option entity type id
          choice.id == mod.componentId // choice id and mod id match
      );
      // console.log(`choiceMatch ${choiceMatch}`);
      if (choiceMatch) return true;
    } else if (choice) {
      // && choice.parentChoiceId
      const choiceIdSplit = choice.choiceId.split("-").pop();
      if (mod.id == choiceIdSplit) return true;
    } else if (mod.componentId === ddbItem.id || mod.componentId === ddbItem.definition?.id) {
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
            t.definition.entityTypeId == mod.componentTypeId &&
            t.definition.id == mod.componentId &&
            t.definition.id == ddbItem.definition.id
        );
        if (traitMatch) return true;
      }
    }
    return false;
  });
  // console.warn(modifierItem);
  return modifierItem;
}

export function addFeatEffects(ddb, character, ddbItem, item, choice, type) {
  // can we apply any effects to this feature
  const daeInstalled = utils.isModuleInstalledAndActive("dae");
  const compendiumItem = character.flags.ddbimporter.compendium;
  const addCharacterEffects = compendiumItem
    ? game.settings.get("ddb-importer", "munching-policy-add-effects")
    : game.settings.get("ddb-importer", "character-update-policy-add-character-effects");
  const modifierItem = generateFeatModifiers(ddb, ddbItem, choice, type);
  if (daeInstalled && addCharacterEffects) {
    item = generateEffects(ddb, character, modifierItem, item, compendiumItem, "feat");
    // console.log(item);
  }

  item = generateBaseACItemEffect(ddb, character, modifierItem, item, compendiumItem);

  return item;
}

// const badDupes = ["Maneuvers: ", "Cosmic Omen"];
const allowDupes = [];

export function removeActionFeatures(actions, features) {
  const actionAndFeature = game.settings.get("ddb-importer", "character-update-policy-use-action-and-feature");

  actions = actions.map((action) => {
    const featureMatch = features.find((feature) => feature.name === action.name);
    if (featureMatch &&
      action.effects && action.effects.length === 0 &&
      featureMatch.effects && featureMatch.effects.length > 0
    ) {
      action.effects = featureMatch.effects;
    }
    return action;
  });

  features = features
    .filter((feature) =>
      actionAndFeature ||
      allowDupes.includes(feature.name) ||
      !actions.some((action) => action.name.trim().toLowerCase() === feature.name.trim().toLowerCase())
    )
    .map((feature) => {
      const actionMatch = actionAndFeature && actions.some((action) => feature.name === action.name);
      if (actionMatch) feature.effects = [];
      return feature;
    });

  return [actions, features];
}

function setConsumeAmount(feature) {
  // ki point detection
  const kiPointRegex = /(?:spend|expend) (\d) ki point/;
  const match = feature.data.description.value.match(kiPointRegex);
  if (match) {
    setProperty(feature, "data.consume.amount", match[1]);
  }
  return feature;
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

export function getDescription(ddb, character, feat, forceFull = false) {
  // for now none actions probably always want the full text
  const useFullSetting = game.settings.get("ddb-importer", "character-update-policy-use-full-description");
  const useFull = forceFull || useFullSetting;
  const chatAdd = game.settings.get("ddb-importer", "add-description-to-chat");

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

  if (utils.stringKindaEqual(description, snippet)) snippet = "";

  // const fullDescription = description !== "" ? description + (snippet !== "" ? "<h3>Summary</h3>" + snippet : "") : snippet;
  const fullDescription = buildFullDescription(description, snippet);
  const value = !useFull && snippet.trim() !== "" ? snippet : fullDescription;

  return {
    value: value,
    chat: chatAdd ? snippet : "",
    unidentified: "",
  };
}

export function setLevelScales(classes, features) {
  const scaleSupport = utils.versionCompare(game.data.system.data.version, "1.6.0") >= 0;
  const useScale = game.settings.get("ddb-importer", "character-update-policy-use-scalevalue");
  if (scaleSupport && useScale) {
    features.forEach((feature) => {
      const featureName = feature.name.toLowerCase().replace(/\s|'|’/g, '-');
      const scaleKlass = classes.find((klass) =>
        klass.data.advancement
          .some((advancement) => advancement.type === "ScaleValue" &&
            advancement.configuration.identifier === featureName
          ));

      if (scaleKlass) {
        if (hasProperty(feature, "data.damage.parts") && feature.data.damage.parts.length > 0) {
          feature.data.damage.parts[0][0] = `@scale.${scaleKlass.data.identifier}.${featureName}`;
        } else {
          setProperty(feature, "data.damage.parts", [[`@scale.${scaleKlass.data.identifier}.${featureName}`]]);
        }
      }
    });
  }
}

/**
 * Some features we need to fix up or massage because they are modified
 * in interesting ways
 * @param {*} ddb
 * @param {*} features
 */
export function fixFeatures(features) {
  const useScale = game.settings.get("ddb-importer", "character-update-policy-use-scalevalue");
  // eslint-disable-next-line complexity
  features.forEach((feature) => {
    const name = feature.flags.ddbimporter.originalName || feature.name;
    switch (name) {
      case "Arcane Propulsion Armor Gauntlet": {
        feature.data.damage.parts[0][0] += " + @mod";
        break;
      }
      case "Arms of the Astral Self: Summon": {
        feature.data.target.type = "enemy";
        feature.data.target.units = "all";
        feature.data.range.value = 10;
        feature.data.range.units = "ft";
        break;
      }
      case "Bardic Inspiration": {
        feature.data.actionType = "util";
        feature.data.duration = {
          value: 10,
          units: "minute",
        };
        feature.data.target = {
          value: 1,
          width: null,
          units: "",
          type: "creature",
        };
        feature.data.range.value = 60;
        feature.data.range.units = "ft";
        break;
      }
      case "Channel Divinity: Radiance of the Dawn":
        feature.data.damage = {
          parts: [["2d10[radiant] + @classes.cleric.levels", "radiant"]],
          versatile: "",
          value: "",
        };
        break;
      case "Dark One’s Blessing":
      case "Dark One's Blessing": {
        feature.data.damage = { parts: [["@classes.warlock.level + @mod", "temphp"]], versatile: "", value: "" };
        feature.data.actionType = "heal";
        feature.data.ability = "cha";
        feature.data.target.type = "self";
        feature.data.range.type = "self";
        feature.data.activation.condition = "Reduce a hostile creature to 0 HP";
        break;
      }
      case "Deflect Missiles": {
        feature.data.damage = { parts: [["1d10 + @mod + @classes.monk.levels"]], versatile: "", value: "" };
        break;
      }
      case "Divine Intervention":
        feature.data.damage = { parts: [["1d100", ""]], versatile: "", value: "" };
        feature.data.actionType = "other";
        break;
      case "Eldritch Cannon: Force Ballista":
        feature.data.target.value = 1;
        feature.data.target.type = "creature";
        feature.data.range.value = 120;
        feature.data.range.units = "ft";
        feature.data.ability = "int";
        feature.data.actionType = "rsak";
        feature.data.chatFlavor = "On hit pushed 5 ft away.";
        feature.data.damage = { parts: [["2d8[force]", "force"]], versatile: "", value: "" };
        break;
      case "Eldritch Cannon: Flamethrower":
        feature.data.damage = { parts: [["2d8[fire]", "fire"]], versatile: "", value: "" };
        break;
      case "Eldritch Cannon: Protector":
        feature.data.target.units = "any";
        feature.data.target.type = "ally";
        feature.data.range.value = 10;
        feature.data.ability = "int";
        feature.data.actionType = "heal";
        feature.data.damage = { parts: [["1d8 + @mod", "temphp"]], versatile: "", value: "" };
        break;
      case "Extra Attack": {
        feature.data.activation = { type: "", cost: 0, condition: "" };
        feature.data.actionType = "";
        feature.data.range.value = null;
        break;
      }
      case "Fighting Style: Interception":
        feature.data.damage = { parts: [["1d10 + @prof", ""]], versatile: "", value: "" };
        feature.data.target.type = "self";
        feature.data.range.type = "self";
        break;
      case "Genie's Vessel: Genie's Wrath (Dao)": {
        feature.data.activation.type = "special";
        feature.data.target.value = 1;
        feature.data.target.type = "creature";
        feature.data.range.units = "spec";
        feature.data.actionType = "util";
        feature.data.duration.units = "inst";
        feature.data.damage = { parts: [["@prof", "bludgeoning"]], versatile: "", value: "" };
        break;
      }
      case "Healing Hands": {
        feature.data.damage = {
          parts: [["@details.level[healing]", "healing"]],
          versatile: "",
          value: "",
        };
        feature.data.actionType = "heal";
        feature.data.target.type = "creature";
        feature.data.range = {
          type: "touch",
          value: null,
          long: null,
          units: "touch"
        };
        break;
      }
      case "Healing Light": {
        feature.data.damage = { parts: [["1d6"]], versatile: "", value: "" };
        break;
      }
      case "Polearm Master - Bonus Attack": {
        feature.data.actionType = "mwak";
        feature.data.range = { value: 10, long: null, units: "ft" };
        break;
      }
      case "Psionic Power: Recovery": {
        feature.data.damage = { parts: [], versatile: "", value: "" };
        setProperty(feature, "data.consume.amount", -1);
        break;
      }
      case "Quickened Healing": {
        // if (useScale) {
        //   feature.data.damage.parts[0][0] += "[healing]";
        //   feature.data.damage.parts[0][1] = "healing";
        // }
        break;
      }
      case "Rage": {
        feature.data.target = {
          value: null,
          width: null,
          units: "",
          type: "self",
        };
        feature.data.duration = {
          value: 1,
          units: "minute",
        };
        break;
      }
      case "Second Wind":
        feature.data.damage = {
          parts: [["1d10[healing] + @classes.fighter.levels", "healing"]],
          versatile: "",
          value: "",
        };
        feature.data.actionType = "heal";
        feature.data.target.type = "self";
        feature.data.range.type = "self";
        break;
      case "Shifting": {
        feature.data.actionType = "heal";
        feature.data.target.type = "self";
        feature.data.range = { value: null, long: null, units: "self" };
        feature.data.duration.units = "inst";
        feature.data.ability = "con";
        feature.data.actionType = "heal";
        feature.data.damage = { parts: [["@details.level + max(1,@mod)", "temphp"]], versatile: "", value: "" };
        break;
      }
      case "Sneak Attack": {
        if (!useScale) feature.data.damage = { parts: [["(ceil(@classes.rogue.levels /2))d6", ""]], versatile: "", value: "" };
        if (!feature.flags.ddbimporter.action) {
          feature.data.actionType = "other";
          feature.data.activation = { type: "special", cost: 0, condition: "" };
        }
        break;
      }
      case "Surprise Attack":
        feature.data.damage = { parts: [["2d6", ""]], versatile: "", value: "" };
        feature.data.activation.type = "special";
        break;
      case "Starry Form: Archer":
        feature.data.actionType = "rsak";
        feature.data.target.value = 1;
        feature.data.target.type = "creature";
        feature.data.range.units = "ft";
        break;
      case "Starry Form: Chalice":
        feature.data.damage.parts[0][1] = "healing";
        feature.data.actionType = "heal";
        feature.data.target.value = 1;
        feature.data.target.type = "ally";
        feature.data.range.value = 30;
        feature.data.range.units = "ft";
        feature.data.activation.type = "special";
        break;
      case "Starry Form: Dragon":
        break;
      case "Stone's Endurance":
      case "Stone’s Endurance":
        feature.data.damage = { parts: [["1d12 + @mod", ""]], versatile: "", value: "" };
        feature.data.actionType = "other";
        feature.data.ability = "con";
        feature.data.target.type = "self";
        feature.data.range.type = "self";
        break;
      case "Stunning Strike":
        feature.data.actionType = "save";
        feature.data.save = { ability: "con", dc: null, scaling: "wis" };
        feature.data.target = { value: null, width: null, units: "touch", type: "creature" };
        feature.data.range.units = "ft";
        break;
      case "Superiority Dice": {
        if (!hasProperty(feature, "data.damage.parts")) break;
        // feature parses as all available dice, rather than 1 per us
        if (feature.data.damage?.parts?.length === 0) {
          feature.data.damage.parts = [["1d6"]];
        } else {
          feature.data.damage.parts[0][0] = `1d${feature.data.damage.parts[0][0].split("d").pop()}`;
        }
        break;
      }
      // no default
    }

    const tableDescription = generateTable(feature.name, feature.data.description.value, true, feature.type);
    feature.data.description.value = tableDescription;
    feature.data.description.chat = tableDescription;
    feature = setConsumeAmount(feature);


    // if (useScale) {
    //   feature = setLevelScale(feature);
    // }
  });
}

export async function addExtraEffects(ddb, documents, character) {
  const compendiumItem = character.flags.ddbimporter.compendium;
  const addCharacterEffects = compendiumItem
    ? game.settings.get("ddb-importer", "munching-policy-add-effects")
    : game.settings.get("ddb-importer", "character-update-policy-add-character-effects");

  if (addCharacterEffects) {
    const results = await Promise.all(documents.map((document) => {
      return generateExtraEffects(ddb, character, document);
    }));
    return results;
  } else {
    return documents;
  }

}
