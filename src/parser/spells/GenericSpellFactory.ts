import { utils } from "../../lib/_module";
import { hasSpellCastingAbility, convertSpellCastingAbilityId } from "./ability";
import DDBSpell from "./DDBSpell";

export default class GenericSpellFactory {

  static async getSpells(spells: IDDBSpellEntry[], notifier: ((message: string, options?: any) => void) | null = null, generateSummons: boolean | null = null, notifierV2: ((data: any) => void) | null = null) {
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
      if (notifierV2) {
        notifierV2({
          progress: { current: ++i, total: length },
          section: "level4",
          message: `Parsing spell: ${spellData.definition.name}`,
          progressBar: "secondary",
        });
      } else if (notifier) {
        notifier(`Parsing spell ${++i} of ${length}: ${spellData.definition.name}`, { nameField: true });
      } else {
        i++;
      }
      const flagData: IParseSpellFlagData = {
        ddbimporter: {
          generic: true,
          dndbeyond: {
            lookup: "generic",
            lookupName: "generic",
            level: spellData.castAtLevel ?? undefined,
            castAtLevel: spellData.castAtLevel ?? undefined,
            homebrew: spellData.definition.isHomebrew,
          },
        },
      };
      const spell = await DDBSpell.parseSpell(spellData, null, { generateSummons, notifier, flagData, isGeneric: true });
      results.push(spell);
    }

    if (notifierV2) {
      notifierV2({ section: "level4", message: "", clear: true });
      notifierV2({ progress: { current: length, total: length }, message: "", progressBar: "secondary", clear: true });
    }

    return results;
  }

  static getSpellCount(dict: Record<string, number>, name: string): number {
    if (!dict[name]) {
      dict[name] = 0;
    }
    return ++dict[name];
  }

  static async getItemSpells(ddb: IDDBData, character: I5ePCData, { generateSummons = null, notifier = null }: {
    generateSummons?: boolean | null;
    notifier?: ((message: string, options?: any) => void) | null;
  } = {}) {

    // console.warn("GenericSpellFactory.getItemSpells", { ddb, character });

    const items = [];
    const proficiencyModifier = character.flags?.ddbimporter?.dndbeyond?.profBonus ?? 0;
    const spellCountDict = {};

    // feat spells are handled slightly differently
    const spells = [...(ddb.character.spells.item ?? [])];
    if (ddb.unequippedItemSpells) spells.push(...ddb.unequippedItemSpells);
    for (const spell of spells) {
      if (!spell.definition) continue;

      const itemInfo = ddb.character.inventory.find((item) => item.definition.id === spell.componentId);
      if (!itemInfo) continue;

      const active
        = (!itemInfo.definition.canEquip && !itemInfo.definition.canAttune) // if item just gives a thing
        || itemInfo.isAttuned // if it is attuned (assume equipped)
        || (!itemInfo.definition.canAttune && itemInfo.equipped); // can't attune but is equipped
      // for item spells the spell dc is often on the item spell
      let spellDC;
      if (spell.overrideSaveDc) {
        spellDC = spell.overrideSaveDc;
      } else if (spell.spellCastingAbilityId) {
        // If the spell has an ability attached, use that
        // if there is no ability on spell, we default to wis
        let spellCastingAbility: T5eAbility = "wis";
        if (hasSpellCastingAbility(spell.spellCastingAbilityId)) {
          spellCastingAbility = convertSpellCastingAbilityId(spell.spellCastingAbilityId);
        }

        const abilityValue = character.flags?.ddbimporter?.dndbeyond?.effectAbilities?.[spellCastingAbility]?.value ?? 10;
        const abilityModifier = utils.calculateModifier(abilityValue);
        spellDC = 8 + proficiencyModifier + abilityModifier;
      } else {
        spellDC = null;
      }

      // add some data for the parsing of the spells into the data structure
      const flagData: IParseSpellFlagData = {
        ddbimporter: {
          dndbeyond: {
            lookup: "item",
            lookupName: itemInfo.definition.name,
            lookupId: itemInfo.definition.id,
            level: spell.castAtLevel ?? undefined,
            dc: spellDC,
            limitedUse: itemInfo.limitedUse ?? undefined,
            nameOverride: `${spell.definition.name} (${itemInfo.definition.name})`,
            overrideDC: !!spell.overrideSaveDc,
            spellLimitedUse: spell.limitedUse,
            castAtLevel: spell.castAtLevel ?? undefined,
            active: active,
            homebrew: spell.definition.isHomebrew,
          },
        },
      };
      const namePostfix = `It${GenericSpellFactory.getSpellCount(spellCountDict, spell.definition.name)}`;
      items.push(await DDBSpell.parseSpell(spell, character, { namePostfix, generateSummons, notifier, flagData }));
    }

    return items;
  }


}
