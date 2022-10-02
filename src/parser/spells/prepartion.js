import DICTIONARY from "../../dictionary.js";
import utils from "../../lib/utils.js";


function classSpell(data, result) {
  const classPrepMode = utils.findByProperty(
    DICTIONARY.spell.preparationModes,
    "name",
    data.flags.ddbimporter.dndbeyond.class
  );
  if (data.restriction === "As Ritual Only") {
    result.mode = "prepared";
    result.prepared = false;
  } else if (!data.usesSpellSlot && data.definition.level !== 0) {
    // some class features such as druid circle of stars grants x uses of a spell
    // at the lowest level. for these we add as an innate.
    result.mode = "innate";
  } else if (data.alwaysPrepared) {
    result.mode = "always";
  } else if (result.mode && classPrepMode) {
    result.mode = classPrepMode.value;
  }
  // Warlocks should use Pact spells
  // but lets mark level 0 as regular spells so they show up as cantrips
  if (result.mode === "pact" && data.definition.level === 0) {
    result.mode = "prepared";
    result.prepared = true;
  } else if (result.mode === "pact" && game.settings.get("ddb-importer", "pact-spells-prepared")) {
    result.prepared = true;
  }
  return result;
}

/**
 * Retrieves the spell preparation mode, depending on the location this spell came from
 *
 */
export function getSpellPreparationMode(data) {
  // default values
  let result = {
    mode: "prepared",
    // If always prepared mark as such, if not then check to see if prepared
    prepared: data.alwaysPrepared || data.prepared,
  };

  // handle classSpells
  const featureClass = data.flags.ddbimporter.dndbeyond.lookup === "classFeature"
    && data.flags.ddbimporter.dndbeyond.class;

  if (data.flags.ddbimporter.dndbeyond.lookup === "classSpell" || featureClass) {
    result = classSpell(data, result);
  } else if (data.flags.ddbimporter.dndbeyond.lookup === "race" && data.definition.level !== 0) {
    // set race spells as innate
    result.mode = "innate";
    if (data.usesSpellSlot) {
      // some racial spells allow the spell to also be added to spell lists
      result.mode = "always";
    }
  } else if (
    // Warlock Mystic Arcanum are passed in as Features
    data.flags.ddbimporter.dndbeyond.lookupName.startsWith("Mystic Arcanum")
  ) {
    // these have limited uses (set with getUses())
    result.mode = "pact";
    result.prepared = false;
  } else if (data.flags.ddbimporter.dndbeyond.lookup === "item " && data.definition.level !== 0) {
    result.mode = "prepared";
    result.prepared = false;
  } else {
    // If spell doesn't use a spell slot and is not a cantrip, mark as always preped
    let always = !data.usesSpellSlot && data.definition.level !== 0;
    let ritaulOnly = data.ritualCastingType !== null || data.castOnlyAsRitual; // e.g. Book of ancient secrets & totem barb
    if (always && ritaulOnly) {
      // in this case we want the spell to appear in the spell list unprepared
      result.prepared = false;
    } else if (always) {
      // these spells are always prepared, and have a limited use that's
      // picked up by getUses() later
      // this was changed to "atwill"
      result.mode = "atwill";
    }
    if (data.flags.ddbimporter.dndbeyond.lookup === "classFeature") {
      if (data.alwaysPrepared) {
        result.mode = "always";
      }
    }
  }

  return result;
}
