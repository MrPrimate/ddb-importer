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
