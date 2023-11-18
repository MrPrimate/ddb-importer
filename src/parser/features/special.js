// import DICTIONARY from "../../dictionary.js";
// import logger from "../../logger.js";
import utils from "../../lib/utils.js";
import DDBHelper from "../../lib/DDBHelper.js";
import { generateEffects } from "../../effects/effects.js";
import { generateBaseACItemEffect } from "../../effects/acEffects.js";
import { generateTable } from "../../muncher/table.js";
import { featureEffectAdjustment } from "../../effects/specialFeats.js";
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

function setConsumeAmount(feature) {
  // ki point detection
  const kiPointRegex = /(?:spend|expend) (\d) ki point/;
  const match = feature.system.description.value.match(kiPointRegex);
  if (match) {
    setProperty(feature, "system.consume.amount", match[1]);
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

/**
 * Some features we need to fix up or massage because they are modified
 * in interesting ways
 * @param {*} ddb
 * @param {*} features
 */
// eslint-disable-next-line complexity
export async function fixFeatures(features) {
  for (let feature of features) {
    const name = feature.flags.ddbimporter?.originalName ?? feature.name;
    switch (name) {
      case "Action Surge": {
        feature.system.damage = { parts: [], versatile: "", value: "" };
        break;
      }
      case "Arcane Propulsion Armor Gauntlet": {
        feature.system.damage.parts[0][0] += " + @mod";
        break;
      }
      case "Arms of the Astral Self: Summon": {
        feature.system.target.type = "enemy";
        feature.system.target.units = "all";
        feature.system.range.value = 10;
        feature.system.range.units = "ft";
        break;
      }
      case "Bardic Inspiration": {
        feature.system.actionType = "util";
        feature.system.duration = {
          value: 10,
          units: "minute",
        };
        feature.system.target = {
          value: 1,
          width: null,
          units: "",
          type: "creature",
        };
        feature.system.range.value = 60;
        feature.system.range.units = "ft";
        break;
      }
      case "Blessed Healer": {
        feature.system.activation.type = "special";
        feature.system.activation.cost = null;
        feature.system.actionType = "heal";
        feature.system["target"]["type"] = "self";
        feature.system.range = { value: null, units: "self", long: null };
        feature.system.uses = { value: null, max: "0", per: "", type: "" };
        break;
      }
      case "Celestial Revelation": {
        feature.system.activation.type = "";
        feature.system.actionType = "";
        feature.system.uses = {
          value: null,
          max: null,
          per: "",
        };
        break;
      }
      case "Channel Divinity: Radiance of the Dawn":
        feature.system.damage = {
          parts: [["2d10[radiant] + @classes.cleric.levels", "radiant"]],
          versatile: "",
          value: "",
        };
        break;
      case "Channel Divinity: Sacred Weapon":
        feature.system["target"]["type"] = "self";
        feature.system.duration = {
          value: 1,
          units: "minute",
        };
        break;
      case "Daunting Roar": {
        feature.system.range.value = 10;
        break;
      }
      case "Dark One’s Blessing":
      case "Dark One's Blessing": {
        feature.system.damage = { parts: [["@classes.warlock.level + @mod", "temphp"]], versatile: "", value: "" };
        feature.system.actionType = "heal";
        feature.system.ability = "cha";
        feature.system.target.type = "self";
        feature.system.range.units = "self";
        feature.system.activation.condition = "Reduce a hostile creature to 0 HP";
        break;
      }
      case "Deflect Missiles": {
        feature.system.damage = { parts: [["1d10 + @mod + @classes.monk.levels"]], versatile: "", value: "" };
        break;
      }
      case "Divine Intervention":
        feature.system.damage = { parts: [["1d100", ""]], versatile: "", value: "" };
        feature.system.actionType = "other";
        break;
      case "Eldritch Cannon: Force Ballista":
        feature.system.target.value = 1;
        feature.system.target.type = "creature";
        feature.system.range.value = 120;
        feature.system.range.units = "ft";
        feature.system.ability = "int";
        feature.system.actionType = "rsak";
        feature.system.chatFlavor = "On hit pushed 5 ft away.";
        feature.system.damage = { parts: [["2d8[force]", "force"]], versatile: "", value: "" };
        break;
      case "Eldritch Cannon: Flamethrower":
        feature.system.damage = { parts: [["2d8[fire]", "fire"]], versatile: "", value: "" };
        break;
      case "Eldritch Cannon: Protector":
        feature.system.target.units = "any";
        feature.system.target.type = "ally";
        feature.system.range.value = 10;
        feature.system.ability = "int";
        feature.system.actionType = "heal";
        feature.system.damage = { parts: [["1d8 + @mod", "temphp"]], versatile: "", value: "" };
        break;
      case "Extra Attack": {
        feature.system.activation = { type: "", cost: 0, condition: "" };
        feature.system.actionType = "";
        feature.system.range.value = null;
        break;
      }
      case "Fighting Style: Interception":
        feature.system.damage = { parts: [["1d10 + @prof", ""]], versatile: "", value: "" };
        feature.system.target.type = "self";
        feature.system.range.units = "self";
        break;
      case "Form of the Beast: Tail (reaction)":
        feature.system.actionType = "other";
        feature.system.target.type = "self";
        feature.system.range.units = "self";
        break;
      case "Genie's Vessel: Genie's Wrath (Dao)": {
        feature.system.activation.type = "special";
        feature.system.target.value = 1;
        feature.system.target.type = "creature";
        feature.system.range.units = "spec";
        feature.system.actionType = "util";
        feature.system.duration.units = "inst";
        feature.system.damage = { parts: [["@prof", "bludgeoning"]], versatile: "", value: "" };
        break;
      }
      case "Giant's Might": {
        feature.system["target"]["type"] = "self";
        feature.system.range = { value: null, units: "self", long: null };
        feature.system.duration = {
          value: 1,
          units: "minute",
        };
        break;
      }
      case "Ghostly Gaze": {
        feature.system.duration = {
          value: 1,
          units: "minute",
        };
        break;
      }
      case "Hand of Healing": {
        feature.system.actionType = "heal";
        break;
      }
      case "Harness Divine Power": {
        feature.system.damage = { parts: [], versatile: "", value: "" };
        break;
      }
      case "Healing Hands": {
        feature.system.damage = {
          parts: [["@details.level[healing]", "healing"]],
          versatile: "",
          value: "",
        };
        feature.system.actionType = "heal";
        feature.system.target.type = "creature";
        feature.system.range = {
          type: "touch",
          value: null,
          long: null,
          units: "touch"
        };
        break;
      }
      case "Healing Light": {
        feature.system.actionType = "heal";
        feature.system.damage = { parts: [["1d6", "healing"]], versatile: "", value: "" };
        break;
      }
      case "Hold Breath": {
        feature.system.duration = { value: 1, units: "hour" };
        feature.system["target"]["type"] = "self";
        feature.system.range = { value: null, units: "self", long: null };
        break;
      }
      case "Hypnotic Gaze": {
        feature.system.uses = {
          value: null,
          max: null,
          per: "",
        };
        break;
      }
      case "Mantle of Inspiration": {
        feature.system.damage.parts[0][1] = "temphp";
        break;
      }
      case "Metamagic - Heightened Spell": {
        feature.system.consume.amount = 3;
        break;
      }
      case "Metamagic - Quickened Spell": {
        feature.system.consume.amount = 2;
        break;
      }
      case "Mind Link Response": {
        feature.system.target.value = 1;
        feature.system.target.type = "creature";
        feature.system.duration = { value: 1, units: "hour" };
        feature.system.range.units = "spec";
        break;
      }
      case "Momentary Stasis": {
        feature.system.actionType = "save";
        feature.system.save.ability = "con";
        break;
      }
      case "Polearm Master - Bonus Attack": {
        feature.system.actionType = "mwak";
        feature.system.range = { value: 10, long: null, units: "ft" };
        break;
      }
      case "Psionic Power: Recovery": {
        feature.system.damage = { parts: [], versatile: "", value: "" };
        setProperty(feature, "system.consume.amount", -1);
        break;
      }
      case "Quickened Healing": {
        feature.system.actionType = "heal";
        feature.system.target.type = "self";
        feature.system.range.units = "self";
        feature.system.damage.parts[0][0] += " + @prof[healing]";
        feature.system.damage.parts[0][1] = "healing";
        break;
      }
      case "Celestial Revelation (Radiant Soul)":
      case "Radiant Soul": {
        if (getProperty(feature, "flags.ddbimporter.type") == "race") {
          feature.system.uses = {
            value: 1,
            max: 1,
            per: "lr",
          };
        } else if (getProperty(feature, "flags.ddbimporter.type") == "class") {
          feature.system.activation.type = "special";
        }
        break;
      }
      case "Rage": {
        feature.system.duration = {
          value: 1,
          units: "minute",
        };
        break;
      }
      case "Second Wind":
        feature.system.damage = {
          parts: [["1d10[healing] + @classes.fighter.levels", "healing"]],
          versatile: "",
          value: "",
        };
        feature.system.actionType = "heal";
        feature.system.target.type = "self";
        feature.system.range.units = "self";
        break;
      case "Shifting": {
        feature.system.actionType = "heal";
        feature.system.target.type = "self";
        feature.system.range = { value: null, long: null, units: "self" };
        feature.system.duration.units = "inst";
        feature.system.ability = "con";
        feature.system.actionType = "heal";
        feature.system.damage = { parts: [["@details.level + max(1,@mod)", "temphp"]], versatile: "", value: "" };
        break;
      }
      case "Shift": {
        feature.system.actionType = "heal";
        feature.system.target.type = "self";
        feature.system.range = { value: null, long: null, units: "self" };
        feature.system.duration = {
          value: 1,
          units: "minute",
        };
        feature.system.ability = "con";
        feature.system.actionType = "heal";
        feature.system.damage = { parts: [["2 * @prof", "temphp"]], versatile: "", value: "" };
        break;
      }
      case "Sneak Attack": {
        if (!getProperty(feature, "flags.ddbimporter.action")) {
          feature.system.actionType = "other";
          feature.system.activation = { type: "special", cost: 0, condition: "" };
        }
        break;
      }
      case "Song of Rest": {
        feature.system.activation = { type: "hour", cost: 1, condition: "" };
        // feature.system.actionType = "other";
        feature.system.actionType = "heal";
        feature.system.target.type = "creature";
        feature.system.range = { value: null, long: null, units: "special" };
        feature.system.damage.parts[0][1] = "healing";
        setProperty(feature, "flags.midiProperties.magicdam", true);
        setProperty(feature, "flags.midiProperties.magiceffect", true);
        break;
      }
      case "Surprise Attack":
        feature.system.damage = { parts: [["2d6", ""]], versatile: "", value: "" };
        feature.system.activation.type = "special";
        break;
      case "Starry Form: Archer":
        feature.system.actionType = "rsak";
        feature.system.target.value = 1;
        feature.system.target.type = "creature";
        feature.system.range.units = "ft";
        feature.system.consume = { type: "", target: "", amount: null };
        break;
      case "Starry Form: Chalice":
        feature.system.damage.parts[0][1] = "healing";
        feature.system.actionType = "heal";
        feature.system.target.value = 1;
        feature.system.target.type = "ally";
        feature.system.range.value = 30;
        feature.system.range.units = "ft";
        feature.system.activation.type = "special";
        feature.system.consume = { type: "", target: "", amount: null };
        break;
      case "Starry Form: Dragon":
        break;
      case "Stone's Endurance":
      case "Stone’s Endurance":
        feature.system.damage = { parts: [["1d12 + @mod", ""]], versatile: "", value: "" };
        feature.system.actionType = "other";
        feature.system.ability = "con";
        feature.system.target.type = "self";
        feature.system.range.units = "self";
        feature.system.consume = { type: "", target: "", amount: null };
        break;
      case "Stunning Strike":
        feature.system.actionType = "save";
        feature.system.save = { ability: "con", dc: null, scaling: "wis" };
        feature.system.target = { value: null, width: null, units: "touch", type: "creature" };
        feature.system.range.units = "ft";
        break;
      case "Superiority Dice": {
        setProperty(feature.system, "damage.parts", [["@scale.battle-master.combat-superiority-die"]]);
        break;
      }
      // no default
    }

    if (name.endsWith(" Breath Weapon") && feature.system.target?.type === "line") {
      feature.system.target.value = 30;
    }

    // eslint-disable-next-line no-await-in-loop
    const tableDescription = await generateTable(feature.name, feature.system.description.value, true, feature.type);
    feature.system.description.value = tableDescription;
    const chatAdd = game.settings.get("ddb-importer", "add-description-to-chat");
    feature.system.description.chat = chatAdd ? tableDescription : "";
    feature = setConsumeAmount(feature);
  }
}

export async function addExtraEffects(ddb, documents, character) {
  const compendiumItem = character.flags.ddbimporter.compendium;
  const addCharacterEffects = compendiumItem
    ? game.settings.get("ddb-importer", "munching-policy-add-effects")
    : game.settings.get("ddb-importer", "character-update-policy-add-character-effects");

  if (addCharacterEffects) {
    const results = await Promise.all(documents.map((document) => {
      return featureEffectAdjustment(ddb, character, document);
    }));
    return results;
  } else {
    return documents;
  }

}
