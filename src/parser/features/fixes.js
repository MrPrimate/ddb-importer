import { featureEffectAdjustment } from "../../effects/specialFeats.js";

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
