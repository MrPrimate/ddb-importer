import { utils } from "../../lib/_module.mjs";
import { getLookups } from "./metadata.js";
import { hasSpellCastingAbility, convertSpellCastingAbilityId } from "./ability.js";
import DDBSpell from "./DDBSpell.js";

export default class GenericSpellFactory {

  static async getGenericItemSpells(itemList, itemSpells, generateSummons = null) {
    let items = [];

    // feat spells are handled slightly differently
    for (const spell of itemSpells.filter((s) => s.definition)) {
      const itemInfo = itemList.find((it) => it.definition.id === spell.componentId);
      // eslint-disable-next-line no-continue
      if (!itemInfo) continue;

      const active
        = (!itemInfo.definition.canEquip && !itemInfo.definition.canAttune) // if item just gives a thing
        || itemInfo.isAttuned // if it is attuned (assume equipped)
        || (!itemInfo.definition.canAttune && itemInfo.equipped); // can't attune but is equipped
      // for item spells the spell dc is often on the item spell
      let spellDC = null;
      if (spell.overrideSaveDc) {
        spellDC = spell.overrideSaveDc;
      }

      // add some data for the parsing of the spells into the data structure
      spell.flags = {
        ddbimporter: {
          dndbeyond: {
            lookup: "item",
            lookupName: itemInfo.definition.name,
            lookupId: itemInfo.definition.id,
            level: spell.castAtLevel,
            dc: spellDC,
            limitedUse: itemInfo.limitedUse,
            nameOverride: `${spell.definition.name} (${itemInfo.definition.name})`,
            overrideDC: !!spell.overrideSaveDc,
            spellLimitedUse: spell.limitedUse,
            castAtLevel: spell.castAtLevel,
            active: active,
            homebrew: spell.definition.isHomebrew,
          },
        },
      };
      const namePostfix = utils.namedIDStub(itemInfo.definition.name, { prefix: "", length: 5 });
      const parsedSpell = await DDBSpell.parseSpell(spell, null, {
        namePostfix: namePostfix,
        generateSummons,
      });

      items.push(parsedSpell);
    }

    return items;
  }

  static async getSpells(spells, notifier = null, generateSummons = null) {
    const results = [];

    const filteredSpells = spells
      .filter((spell) => spell.definition)
      .filter((spell) => {
        // remove archived material
        if (spell.definition.sources && spell.definition.sources.some((source) => source.sourceId === 39)) {
          return false;
        } else {
          return true;
        }
      });

    let i = 0;
    const length = filteredSpells.length;
    for (const spellData of filteredSpells) {
      if (notifier) notifier(`Parsing spell ${++i} of ${length}: ${spellData.definition.name}`, true);
      spellData.flags = {
        ddbimporter: {
          generic: true,
          dndbeyond: {
            lookup: "generic",
            lookupName: "generic",
            level: spellData.castAtLevel,
            castAtLevel: spellData.castAtLevel,
            homebrew: spellData.definition.isHomebrew,
          },
        },
      };
      const spell = await DDBSpell.parseSpell(spellData, null, { generateSummons, notifier });
      results.push(spell);
    }

    return results;
  }

  static getSpellCount(dict, name) {
    if (!dict[name]) {
      dict[name] = 0;
    }
    return ++dict[name];
  }

  static async getItemSpells(ddb, character, { generateSummons = null, notifier = null } = {}) {

    // console.warn("GenericSpellFactory.getItemSpells", { ddb, character });

    let items = [];
    const proficiencyModifier = character.system.attributes.prof;
    const lookups = getLookups(ddb.character);

    const spellCountDict = {};

    // feat spells are handled slightly differently
    const spells = [...ddb.character.spells.item];
    if (ddb.unequippedItemSpells) spells.push(...ddb.unequippedItemSpells);
    for (const spell of spells) {
      if (!spell.definition) continue;

      const itemInfo = lookups.item.find((item) => item.id === spell.componentId);
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
            homebrew: spell.definition.isHomebrew,
          },
        },
      };
      const namePostfix = `It${GenericSpellFactory.getSpellCount(spellCountDict, spell.definition.name)}`;
      items.push(await DDBSpell.parseSpell(spell, character, { namePostfix, generateSummons, notifier }));
    }

    return items;
  }


}
