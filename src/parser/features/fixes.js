import { generateTable } from "../../lib/DDBTable.js";
import { featureEffectAdjustment } from "../../effects/specialFeats.js";

/**
 * Some features we need to fix up or massage because they are modified
 * in interesting ways
 * @param {*} ddb
 * @param {*} features
 */
// eslint-disable-next-line complexity
export async function fixFeatures(features) {
  // THESE FEATURES ARE NOT CURRENTLY CALLED AND HAVE NOT BEEN MIGRATED
  for (let feature of features) {
    const name = foundry.utils.getProperty(feature, "flags.ddbimporter.originalName") ?? feature.name;
    // eslint-disable-next-line no-continue
    if (foundry.utils.getProperty(feature, "flags.ddbimporter.isCustomAction") === true) continue;
    switch (name) {
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
      case "Summon Wildfire Spirit": {
        foundry.utils.setProperty(document, "system.target.value", 1);
        foundry.utils.setProperty(document, "system.target.type", "space");
        foundry.utils.setProperty(document, "system.range.units", "ft");
        foundry.utils.setProperty(document, "system.range.value", 30);
        foundry.utils.setProperty(document, "system.duration", {
          value: 1,
          units: "hour",
        });
        feature.system.damage = { parts: [["2d6", "fire"]], versatile: "", value: "" };
        feature.system.ability = "wis";
        feature.system.save = { ability: "dex", dc: null, scaling: "spell" };
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
    const tableDescription = await generateTable(feature.name, feature.system.description.value, true, feature.type);
    feature.system.description.value = tableDescription;
    const chatAdd = game.settings.get("ddb-importer", "add-description-to-chat");
    if (chatAdd && feature.system.description.chat !== "") {
      feature.system.description.chat = await generateTable(feature.name, feature.system.description.chat, true, feature.type);
    }
  }
}

export async function addExtraEffects(ddb, documents, character) {
  // TODO: remove after corrections
  return documents;
  const compendiumItem = character.flags.ddbimporter.compendium;
  const addCharacterEffects = compendiumItem
    ? game.settings.get("ddb-importer", "munching-policy-add-effects")
    : game.settings.get("ddb-importer", "character-update-policy-add-character-effects");

  const results = await Promise.all(documents.map((document) => {
    return featureEffectAdjustment(ddb, character, document, addCharacterEffects);
  }));
  return results;

}
