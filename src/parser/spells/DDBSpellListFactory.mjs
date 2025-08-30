import { DDBSources, logger } from "../../lib/_module.mjs";
import SpellListFactory from "./SpellListFactory.mjs";

export default class DDBSpellListFactory extends SpellListFactory {

  spellListsData = {};

  spellsBySourceAndClass = {};

  constructor() {
    super();

    this.ALL_SPELL_LISTS = DDBSpellListFactory.CLASS_NAMES.concat(DDBSpellListFactory.SUBCLASS_NAMES);

    for (const className of this.ALL_SPELL_LISTS) {
      this.spellListsData[className] = [];
    }

    for (const source of this.sources) {
      this.spellsBySourceAndClass[source.acronym] = {};
      this.uuidsBySourceAndSpellListName[source.acronym] = {};
      for (const className of this.ALL_SPELL_LISTS) {
        this._addSpellListOutline(className, source.acronym);
      }
    }
  }

  static CLASS_NAMES = [
    "Cleric",
    "Druid",
    "Sorcerer",
    "Warlock",
    "Wizard",
    "Paladin",
    "Ranger",
    "Bard",
    "Artificer",
  ];

  static SUBCLASS_NAMES = [
    "Graviturgy",
    "Chronurgy",
  ];

  static WIZARD_FILTER = ["Graviturgy", "Chronurgy"];

  static CLASS_NAMES_MAP = {
    "2014": DDBSpellListFactory.CLASS_NAMES.concat(DDBSpellListFactory.SUBCLASS_NAMES),
    "2024": [
      "Wizard",
    ],
  };

  _addSpellListOutline(spellListName, sourceAcronym) {
    this.spellsBySourceAndClass[sourceAcronym][spellListName] = [];
    super._addSpellListOutline(spellListName, sourceAcronym);
  }

  _generateSpellsBySourceAndSpellListName(spellListName) {
    for (const source of this.sources) {
      for (const spell of this.spellListsData[spellListName]) {
        if (spell.isHomebrew) {
          this.spellsBySourceAndClass["Homebrew"][spellListName].push(spell);
          continue;
        }
        const sourceMatch = spell.sources.some((s) => s.id === source.id);
        if (!sourceMatch) continue;
        this.spellsBySourceAndClass[source.acronym][spellListName].push(spell);
      }
    }
  }

  extractClassSpellListData(className, spellData) {
    this.spellListsData[className] = spellData
      .filter((s) => !DDBSpellListFactory.WIZARD_FILTER.includes(className)
        || (DDBSpellListFactory.WIZARD_FILTER.includes(className)
        && !this.spellListsData["Wizard"].some((w) => w.id === s.definition.id)),
      )
      .map((s) => {
        return {
          id: s.definition.id,
          name: s.definition.name,
          isLegacy: s.definition.isLegacy,
          sources: DDBSources.getSourceData(s.definition),
          sourceDefinition: s.definition.sources,
          isHomebrew: s.definition.isHomebrew,
        };
      });

    this._generateSpellsBySourceAndSpellListName(className);

    // console.warn(`Spell List Data for ${className}`, {
    //   spellListsData: this.spellListsData[className],
    //   spellData,
    //   uuidList: this.uuidLists,
    //   this: this,
    // })

    foundry.utils.setProperty(CONFIG, "DDBI.SPELL_LISTS", this.spellListsData);
  }

  #generateUuidsFromDefinitionId(source, className) {
    const spells = new Set();
    for (const spell of this.spellsBySourceAndClass[source.acronym][className]) {
      const sourceMatch = this.spellCompendium.index.find((s) => s.flags?.ddbimporter?.definitionId === spell.id);
      if (!sourceMatch) {
        logger.debug(`Spell not found in spell compendium: ${spell.name} (${spell.id})`, { spell });
        continue;
      }
      spells.add(sourceMatch.uuid);
    }
    this.uuidsBySourceAndSpellListName[source.acronym][className] = Array.from(spells);
  }

  #generateUuidsBySourceAndClass() {
    for (const source of this.sources) {
      for (const className of this.ALL_SPELL_LISTS) {
        this.#generateUuidsFromDefinitionId(source, className);
      }
    }
  }

  #sourceHasSpells(source) {
    for (const className of this.ALL_SPELL_LISTS) {
      const spellNumber = this.uuidsBySourceAndSpellListName[source.acronym][className].length;
      if (spellNumber > 0) return true;
      logger.debug(`Found ${spellNumber} Spells found for source "${source.label}" and class "${className}"`);
    }
    return false;
  }

  async buildClassSpellLists() {
    if (!this.available) return;
    await this.init();

    if (!this.sources) return;

    this.#generateUuidsBySourceAndClass();

    for (const source of this.filteredSources) {
      if (!this.#sourceHasSpells(source)) {
        logger.debug(`No Spells found for source "${source.label}"`);
        continue;
      }
      const journal = await this._getSpellListJournal(source);
      for (const className of DDBSpellListFactory.CLASS_NAMES) {
        this.type = "class";
        await this._generateJournalSpellListPage(journal, className, source);
      }
      for (const subclassName of DDBSpellListFactory.SUBCLASS_NAMES) {
        this.type = "subclass";
        await this._generateJournalSpellListPage(journal, subclassName, source);
      }
    }
  }

}
