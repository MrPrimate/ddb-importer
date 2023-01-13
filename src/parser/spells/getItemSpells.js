/* eslint-disable no-continue */
import utils from "../../lib/utils.js";

// Import parsing functions
import { getLookups } from "./metadata.js";
import { fixSpells } from "./special.js";
import { parseSpell } from "./parseSpell.js";
import { hasSpellCastingAbility, convertSpellCastingAbilityId } from "./ability.js";


export async function getItemSpells(ddb, character) {
  let items = [];
  const proficiencyModifier = character.system.attributes.prof;
  const lookups = getLookups(ddb.character);

  // feat spells are handled slightly differently
  for (const spell of ddb.character.spells.item) {
    if (!spell.definition) continue;

    const itemInfo = lookups.item.find((it) => it.id === spell.componentId);
    if (!itemInfo) continue;

    const active
      = (!itemInfo.canEquip && !itemInfo.canAttune) // if item just gives a thing
      || itemInfo.isAttuned // if it is attuned (assume equipped)
      || (!itemInfo.canAttune && itemInfo.equipped); // can't attune but is equipped
    // for item spells the spell dc is often on the item spell
    let spellDC = 8;
    if (spell.overrideSaveDc) {
      spellDC = spell.overrideSaveDc;
    } else if (spell.spellCastingAbilityId) {
      // If the spell has an ability attached, use that
      // if there is no ability on spell, we default to wis
      let spellCastingAbility = "wis";
      if (hasSpellCastingAbility(spell.spellCastingAbilityId)) {
        spellCastingAbility = convertSpellCastingAbilityId(spell.spellCastingAbilityId);
      }

      const abilityModifier = utils.calculateModifier(character.flags.ddbimporter.dndbeyond.effectAbilities[spellCastingAbility].value);
      spellDC = 8 + proficiencyModifier + abilityModifier;
    } else {
      spellDC = null;
    }

    // add some data for the parsing of the spells into the data structure
    spell.flags = {
      ddbimporter: {
        dndbeyond: {
          lookup: "item",
          lookupName: itemInfo.name,
          lookupId: itemInfo.id,
          level: spell.castAtLevel,
          dc: spellDC,
          limitedUse: itemInfo.limitedUse,
          nameOverride: `${spell.definition.name} (${itemInfo.name})`,
          overrideDC: !!spell.overrideSaveDc,
          spellLimitedUse: spell.limitedUse,
          castAtLevel: spell.castAtLevel,
          active: active,
        },
      },
    };

    // eslint-disable-next-line no-await-in-loop
    items.push(await parseSpell(spell, character));
  }

  if (items) fixSpells(ddb, items);

  return items;
}
