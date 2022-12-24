// Import parsing functions
import { fixSpells } from "./special.js";
import { parseSpell } from "./parseSpell.js";

export async function getSpells(spells) {
  let items = await Promise.all(spells
    .filter((spell) => spell.definition)
    .filter((spell) => {
      // remove archived material
      if (spell.definition.sources && spell.definition.sources.some((source) => source.sourceId === 39)) {
        return false;
      } else {
        return true;
      }
    })
    .map(async (spell) => {
      spell.flags = {
        ddbimporter: {
          generic: true,
          dndbeyond: {
            lookup: "generic",
            lookupName: "generic",
            level: spell.castAtLevel,
            castAtLevel: spell.castAtLevel,
          },
        },
      };

      return parseSpell(spell, null);
    }));

  if (items) fixSpells(null, items);

  return items;
}
