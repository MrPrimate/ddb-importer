import { generateTable } from "../../muncher/table.js";
import { featureEffectAdjustment } from "../../effects/specialFeats.js";

/**
 * Some features we need to fix up or massage because they are modified
 * in interesting ways
 * @param {*} ddb
 * @param {*} features
 */
// eslint-disable-next-line complexity
export async function fixFeatures(features) {
  for (let feature of features) {
    const name = foundry.utils.getProperty(feature, "flags.ddbimporter.originalName") ?? feature.name;
    // eslint-disable-next-line no-continue
    if (foundry.utils.getProperty(feature, "flags.ddbimporter.isCustomAction") === true) continue;
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
        feature.system.target = {
          value: 10,
          units: "ft",
          type: "radius",
        };
        feature.system.range.units = "self";
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
      case "Draconic Resilience": {
        if (feature.effects.length === 1) {
          const toKeepChanges = feature.effects[0].changes.filter((change) => !change.key.includes("system.attributes.ac"));
          feature.effects[0].changes = [
            ...toKeepChanges,
            {
              key: "system.attributes.ac.calc",
              value: "draconic",
              mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
              priority: 15,
            },
          ];
        }
        break;
      }
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
      case "Hound of Ill Omen": {
        feature.system.consume.amount = 3;
        break;
      }
      case "Intimidating Presence": {
        feature.system.duration = { value: 2, units: "turns" };
        feature.system.target.value = 1;
        feature.system.target.type = "creature";
        feature.system.range = { value: 30, units: "ft", long: null };
        feature.system.actionType = "save";
        feature.system.save.ability = "wis";
        feature.system.save.scaling = "cha";
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
        foundry.utils.setProperty(feature, "system.consume.amount", -1);
        break;
      }
      case "Psychic Blades: Attack (DEX)":
      case "Psychic Blades: Attack (STR)":
      case "Psychic Blades: Bonus Attack (DEX)":
      case "Psychic Blades: Bonus Attack (STR)":
      case "Psychic Blades: Bonus Attack":
      case "Psychic Blades: Attack": {
        feature.system.actionType = "mwak";
        feature.system.properties.push("fin");
        feature.system.properties.push("thr");
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
        if (foundry.utils.getProperty(feature, "flags.ddbimporter.type") == "race") {
          feature.system.uses = {
            value: 1,
            max: 1,
            per: "lr",
          };
        } else if (foundry.utils.getProperty(feature, "flags.ddbimporter.type") == "class") {
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
      case "Raging Storm: Desert": {
        feature.system.duration.units = "inst";
        feature.system.target.value = 1;
        feature.system.target.type = "creature";
        feature.system.range.value = 10;
        feature.system.damage.parts = [["floor(@classes.barbarian.levels / 2)", "fire"]];
        feature.system.save.scaling = "con";
        break;
      }
      case "Raging Storm: Sea": {
        feature.system.activation = { type: "special", cost: 0, condition: "" };
        feature.system.duration.units = "perm";
        feature.system.target.value = 1;
        feature.system.target.type = "creature";
        feature.system.range = { value: null, long: null, units: "" };
        feature.system.save.scaling = "con";
        break;
      }
      case "Raging Storm: Tundra": {
        feature.system.activation = { type: "special", cost: 0, condition: "" };
        feature.system.actionType = "save";
        feature.system.save = { ability: "str", dc: null, scaling: "con" };
        feature.system.duration.units = "perm";
        feature.system.target.value = 1;
        feature.system.target.type = "creature";
        feature.system.range.value = 10;
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
      case "Storm Aura: Desert": {
        feature.system.target = { value: 10, units: "ft", type: "creature" };
        feature.system.range = { value: null, long: null, units: "spec" };
        feature.system.duration.units = "inst";
        feature.system.damage.parts = [["@scale.path-of-the-storm-herald.storm-aura-desert", "fire"]];
        break;
      }
      case "Storm Aura: Sea": {
        feature.system.target = { value: 1, units: "", type: "creature" };
        feature.system.range = { value: 10, long: null, units: "ft" };
        feature.system.duration.units = "inst";
        feature.system.damage.parts = [["@scale.path-of-the-storm-herald.storm-aura-sea", "lightning"]];
        break;
      }
      case "Storm Aura: Tundra": {
        feature.system.actionType = "heal";
        feature.system.target = { value: 10, units: "ft", type: "ally" };
        feature.system.range = { value: null, long: null, units: "self" };
        feature.system.duration.units = "inst";
        feature.system.damage.parts = [["@scale.path-of-the-storm-herald.storm-aura-tundra", "temphp"]];
        break;
      }
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
        if (!foundry.utils.getProperty(feature, "flags.ddbimporter.action")) {
          feature.system.actionType = "other";
          feature.system.activation = { type: "special", cost: 0, condition: "" };
        }
        break;
      }
      case "Song of Rest": {
        feature.system.activation = { type: "hour", cost: 1, condition: "" };
        feature.system.actionType = "heal";
        feature.system.target.type = "creature";
        feature.system.range = { value: null, long: null, units: "spec" };
        feature.system.damage.parts[0][1] = "healing";
        foundry.utils.setProperty(feature, "flags.midiProperties.magicdam", true);
        foundry.utils.setProperty(feature, "flags.midiProperties.magiceffect", true);
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
        foundry.utils.setProperty(feature.system, "damage.parts", [["@scale.battle-master.combat-superiority-die"]]);
        break;
      }
      case "Unarmored Defense": {
        if (feature.effects.length === 1) {
          const klass = foundry.utils.getProperty(feature, "flags.ddbimporter.class");
          if (klass == "Barbarian") {
            feature.effects[0].changes = [
              {
                key: "system.attributes.ac.calc",
                value: "unarmoredBarb",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                priority: 15,
              },
            ];
          } else if (klass === "Monk") {
            feature.effects[0].changes = [
              {
                key: "system.attributes.ac.calc",
                value: "unarmoredMonk",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                priority: 15,
              },
            ];
          }
        }
        break;
      }
      case "Wrath of the Storm": {
        feature.system.damage = { parts: [["2d8", "lightning"]], versatile: "", value: "" };
        break;
      }
      // no default
    }

    if (name.endsWith(" Breath Weapon") && feature.system.target?.type === "line") {
      feature.system.target.value = 30;
    } else if (name.endsWith("[Infusion] Spell-Refueling Ring")) {
      feature.system.activation.type = "action";
    }

    // eslint-disable-next-line no-await-in-loop
    const tableDescription = await generateTable(feature.name, feature.system.description.value, true, feature.type);
    feature.system.description.value = tableDescription;
    const chatAdd = game.settings.get("ddb-importer", "add-description-to-chat");
    if (chatAdd && feature.system.description.chat !== "") {
      // eslint-disable-next-line no-await-in-loop
      feature.system.description.chat = await generateTable(feature.name, feature.system.description.chat, true, feature.type);
    }
  }
}

export async function addExtraEffects(ddb, documents, character) {
  const compendiumItem = character.flags.ddbimporter.compendium;
  const addCharacterEffects = compendiumItem
    ? game.settings.get("ddb-importer", "munching-policy-add-effects")
    : game.settings.get("ddb-importer", "character-update-policy-add-character-effects");

  const results = await Promise.all(documents.map((document) => {
    return featureEffectAdjustment(ddb, character, document, addCharacterEffects);
  }));
  return results;

}
