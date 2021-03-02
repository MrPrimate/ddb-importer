// import DICTIONARY from "../../dictionary.js";
import logger from "../../logger.js";
import utils from "../../utils.js";
import { generateBaseACItemEffect } from "../effects/acEffects.js";

function generateFeatModifiers(ddb, ddbItem, choice, type) {
  // console.warn(ddbItem);
  // console.log(choice);
  if (ddbItem.grantedModifiers) return ddbItem;
  let modifierItem = JSON.parse(JSON.stringify(ddbItem));
  const modifiers = [
    utils.getChosenClassModifiers(ddb),
    ddb.character.modifiers.race,
    ddb.character.modifiers.background,
    ddb.character.modifiers.feat,
  ].flat();

  // console.log(ddb.character.options[type]);
  // console.warn("Adding modifiers");
  // console.log(type);

  if (!modifierItem.definition) modifierItem.definition = {};
  modifierItem.definition.grantedModifiers = modifiers.filter((mod) => {
    if (mod.componentId === ddbItem.definition?.id && mod.componentTypeId === ddbItem.definition?.entityTypeId) return true;
    if (choice && ddb.character.options[type]) {
      // if it is a choice option, try and see if the mod matches
      const choiceMatch = ddb.character.options[type].find((option) =>
        // id match
        choice.componentId == option.componentId && // the choice id matches the option componentID
        option.definition.id == mod.componentId && // option id and mod id match
        (choice.componentTypeId == option.componentTypeId ||  //either the choice componenttype and optiontype match or
         choice.componentTypeId  == option.definition.entityTypeId) && // the choice componentID matches the option definition entitytypeid

        option.definition.entityTypeId == mod.componentTypeId && //mod componentId matches option entity type id
        choice.id == mod.componentId // choice id and mod id match
      );
      if (choiceMatch) return true;
    }
    if (mod.componentId === ddbItem.id) {
      if (type === "class") {
        // logger.log("Class check - feature effect parsing");
        const classFeatureMatch = ddb.character.classes.some((klass) =>
          klass.classFeatures.some((f) =>
            f.definition.entityTypeId == mod.componentTypeId && f.definition.id == ddbItem.id
          )
        );
        if (classFeatureMatch) return true;
      }
      if (type === "feat") {
        const featMatch = ddb.character.feats.some((f) =>
            f.definition.entityTypeId == mod.componentTypeId && f.definition.id == ddbItem.id
          );
        if (featMatch) return true;
      }
      if (type === "race") {
        const traitMatch = ddb.character.race.racialTraits.some((f) =>
            f.definition.entityTypeId == mod.componentTypeId && f.definition.id == ddbItem.id
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
  const addEffects = (compendiumItem)
    ? game.settings.get("ddb-importer", "munching-policy-add-effects")
    : game.settings.get("ddb-importer", "character-update-policy-add-effects");
  const modifierItem = generateFeatModifiers(ddb, ddbItem, choice, type);
  if (daeInstalled && addEffects) {
    // item = generateItemEffects(ddb, character, modifierItem, item, compendiumItem);
    item = generateBaseACItemEffect(ddb, character, modifierItem, item, compendiumItem);
    console.log(item);
  }
  return item;
}

export function stripHtml(html) {
   let tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}

/**
 * Some features we need to fix up or massage because they are modified
 * in interesting ways
 * @param {*} ddb
 * @param {*} features
 */
export function fixFeatures(features) {
  features.forEach((feature) => {
    switch (feature.name) {
      case "Channel Divinity: Radiance of the Dawn":
        feature.data.damage = { parts: [["2d10[radiant] + @classes.cleric.levels", "radiant"]], versatile: "", value: "" };
        break;
      case "Surprise Attack":
        feature.data.damage = { parts: [["2d6", ""]], versatile: "", value: "" };
        feature.data.activation['type'] = 'special';
        break;
      case "Eldritch Cannon: Force Ballista":
        feature.data['target']['value'] = 1;
        feature.data['target']['type'] = "creature";
        feature.data['range']['value'] = 120;
        feature.data['range']['units'] = "ft";
        feature.data.ability = "int";
        feature.data.actionType = "rsak";
        feature.data.chatFlavor = "On hit pushed 5 ft away.";
        feature.data.damage = { parts: [["2d8[force]", "force"]], versatile: "", value: "" };
        break;
      case "Eldritch Cannon: Protector":
        feature.data['target']['units'] = "any";
        feature.data['target']['type'] = "ally";
        feature.data['range']['value'] = 10;
        feature.data.ability = "int";
        feature.data.actionType = "heal";
        feature.data.damage = { parts: [["1d8 + @mod", "temphp"]], versatile: "", value: "" };
        break;
      case "Eldritch Cannon: Flamethrower":
        feature.data.damage = { parts: [["2d8[fire]", "fire"]], versatile: "", value: "" };
        break;
      case "Second Wind":
        feature.data.damage = { parts: [["1d10[healing] + @classes.fighter.levels", "healing"]], versatile: "", value: "" };
        feature.data.actionType = "heal";
        feature.data['target']['type'] = "self";
        feature.data['range']['type'] = "self";
        break;
      case "Stone's Endurance":
      case "Stone’s Endurance":
        feature.data.damage = { parts: [["1d12 + @mod", ""]], versatile: "", value: "" };
        feature.data.actionType = "other";
        feature.data.ability = "con";
        feature.data['target']['type'] = "self";
        feature.data['range']['type'] = "self";
        break;
      case "Divine Intervention":
        feature.data.damage = { parts: [["1d100", ""]], versatile: "", value: "" };
        feature.data.actionType = "other";
        break;
      // add a rage effect
      case "Rage":
        feature.effects = [
          {
            "flags": {
              "dae": {
                "transfer": false,
                "stackable": false
              }
            },
            "changes": [
              {
                "key": "data.bonuses.mwak.damage",
                "value": "2",
                "mode": 0,
                "priority": 0
              },
              {
                "key": "data.traits.dr.value",
                "value": "piercing",
                "mode": 0,
                "priority": 0
              },
              {
                "key": "data.traits.dr.value",
                "value": "slashing",
                "mode": 0,
                "priority": 20
              },
              {
                "key": "data.traits.dr.value",
                "value": "bludgeoning",
                "mode": 0,
                "priority": 20
              }
            ],
            "disabled": false,
            "duration": {
              "startTime": null,
              "seconds": null,
              "rounds": null,
              "turns": null,
              "startRound": null,
              "startTurn": null
            },
            "icon": "systems/dnd5e/icons/skills/red_10.jpg",
            "label": "Rage",
            "tint": "",
            "transfer": false
          }
        ];
      // no default
    }
  });
}
