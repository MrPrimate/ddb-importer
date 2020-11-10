import DICTIONARY from "../../dictionary.js";
import utils from "../../utils.js";

/**
 * Retrieves the spell preparation mode, depending on the location this spell came from
 *
 */
export function getSpellPreparationMode(data) {
  // default values
  let prepMode = "prepared";
  // If always prepared mark as such, if not then check to see if prepared
  let prepared = data.alwaysPrepared || data.prepared;
  // handle classSpells
  if (data.flags.ddbimporter.dndbeyond.lookup === "classSpell") {
    const classPrepMode = utils.findByProperty(
      DICTIONARY.spell.preparationModes,
      "name",
      data.flags.ddbimporter.dndbeyond.class
    ).value;
    if (data.alwaysPrepared) {
      prepMode = "always";
    } else if (prepMode) {
      prepMode = classPrepMode;
    }
    // Warlocks should use Pact spells
    // but lets mark level 0 as regular spells so they show up as cantrips
    if (prepMode === "pact" && data.definition.level === 0) {
      prepMode = "prepared";
      prepared = true;
    }
  } else if (data.flags.ddbimporter.dndbeyond.lookup === "race" && data.definition.level !== 0) {
    // set race spells as innate
    prepMode = "innate";
  } else if (
    // Warlock Mystic Arcanum are passed in as Features
    data.flags.ddbimporter.dndbeyond.lookupName.startsWith("Mystic Arcanum")
  ) {
    // these have limited uses (set with getUses())
    prepMode = "pact";
    prepared = false;
  } else if (data.flags.ddbimporter.dndbeyond.lookup === "item " && data.definition.level !== 0) {
    prepared = false;
    prepMode = "prepared";
  } else {
    // If spell doesn't use a spell slot and is not a cantrip, mark as always preped
    let always = !data.usesSpellSlot && data.definition.level !== 0;
    let ritaulOnly = data.ritualCastingType !== null || data.castOnlyAsRitual; // e.g. Book of ancient secrets & totem barb
    if (always && ritaulOnly) {
      // in this case we want the spell to appear in the spell list unprepared
      prepared = false;
    } else if (always) {
      // these spells are always prepared, and have a limited use that's
      // picked up by getUses() later
      // this was changed to "atwill"
      prepMode = "atwill";
    }
    if (data.flags.ddbimporter.dndbeyond.lookup === "classFeature") {
      if (data.alwaysPrepared) {
        prepMode = "always";
      }
    }
  }

  return {
    mode: prepMode,
    prepared: prepared,
  };
}
