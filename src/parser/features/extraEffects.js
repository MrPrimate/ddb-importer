import { featureEffectAdjustment } from "../../effects/specialFeats.js";

export async function addExtraEffects(ddb, documents, character) {
  // KNOWN_ISSUE_4_0: remove after corrections
  return documents;
  // eslint-disable-next-line no-unreachable
  const compendiumItem = character.flags.ddbimporter.compendium;
  const addCharacterEffects = compendiumItem
    ? game.settings.get("ddb-importer", "munching-policy-add-effects")
    : game.settings.get("ddb-importer", "character-update-policy-add-character-effects");

  const results = await Promise.all(documents.map((document) => {
    return featureEffectAdjustment(ddb, character, document, addCharacterEffects);
  }));
  // eslint-disable-next-line no-unreachable
  return results;

}
