import { CompendiumHelper, DDBHelper, logger, utils } from "../../lib/_module.mjs";

const BASE_CLASS_PAGE = {
  sort: 1,
  name: "Spell List",
  type: "spells",
  system: {
    type: "class",
    grouping: "level",
    description: {
      value: "",
    },
    spells: [],
    unlinkedSpells: [],
    identifier: "",
  },
  title: {
    show: true,
    level: 3,
  },
  image: {},
  text: {
    format: 1,
  },
  src: null,
  ownership: {
    default: -1,
  },
  flags: {
    ddbimporter: {},
    dnd5e: {
      tocHidden: true,
    },
  },
};


export default class SpellListFactory {

  spellListsData = {};

  journalCompendium = null;

  spellListJournalNameBit = "Spell List";

  spellListJournalFlagName = "DDB Spell List";

  sources = null;

  journalFolder = null;

  uuidLists = {};


  #buildSources() {
    const ddbSources = foundry.utils.getProperty(CONFIG, "DDB.sources");
    if (!ddbSources) return;

    const sources = ddbSources
      .filter((s) => s.isReleased)
      .map((s) => {
        return {
          id: s.id,
          acronym: DDBHelper.getAdjustedSourceBook(s.name),
          label: s.description,
        };
      });

    sources.push({
      id: 9999999,
      acronym: "Homebrew",
      label: "Homebrew",
    });

    this.sources = sources;

  }

  constructor() {
    for (const className of SpellListFactory.CLASS_NAMES) {
      this.spellListsData[className] = [];
    }
    this.journalCompendium = CompendiumHelper.getCompendiumType("journals");
    this.spellCompendium = CompendiumHelper.getCompendiumType("spells");
    this.#buildSources();

    for (const source of this.sources) {
      this.uuidLists[source.acronym] = {};
      for (const className of SpellListFactory.CLASS_NAMES) {
        this.uuidLists[source.acronym][className] = [];
      }
    }
  }


  async init() {
    await this.spellCompendium.getIndex({
      fields: ["name", "flags.ddbimporter.definitionId", "flags.ddbimporter.isLegacy"],
    });
    await this.journalCompendium.getIndex({
      fields: ["name", "flags.ddbimporter"],
    });

    this.journalFolder = await CompendiumHelper.createFolder({
      pack: this.journalCompendium,
      name: `${this.spellListJournalNameBit}s`,
      flagTag: "spell-lists",
      entityType: "JournalEntry",
    });
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
    "Graviturgy",
    "Chronurgy",
    "Artificer",
  ];

  static WIZARD_FILTER = ["Graviturgy", "Chronurgy"];


  #generateUuidLists(className) {
    for (const source of this.sources) {
      for (const spell of this.spellListsData[className]) {
        if (spell.isHomebrew) {
          this.uuidLists["Homebrew"][className].push(spell);
          continue;
        }
        const sourceMatch = spell.sources.some((s) => s.id === source.id);
        if (!sourceMatch) continue;
        this.uuidLists[source.acronym][className].push(spell);
      }
    }
  }

  extractSpellListData(className, spellData) {
    this.spellListsData[className] = spellData
      .filter((s) => !SpellListFactory.WIZARD_FILTER.includes(className)
        || (SpellListFactory.WIZARD_FILTER.includes(className)
        && !this.spellListsData["Wizard"].some((w) => w.id === s.definition.id)),
      )
      .map((s) => {
        return {
          id: s.definition.id,
          name: s.definition.name,
          isLegacy: s.definition.isLegacy,
          sources: DDBHelper.getSourceData(s.definition),
          sourceDefinition: s.definition.sources,
          isHomebrew: s.definition.isHomebrew,
        };
      });

    this.#generateUuidLists(className);

    // console.warn(`Spell List Data for ${className}`, {
    //   spellListsData: this.spellListsData[className],
    //   spellData,
    //   uuidList: this.uuidLists,
    //   this: this,
    // })

    foundry.utils.setProperty(CONFIG, "DDBI.SPELL_LISTS", this.spellListsData);
  }

  async #createSpellListJournal(source) {
    const journalData = {
      _id: utils.namedIDStub(source.label, { prefix: source.acronym.replaceAll(" ", "").replaceAll(".", "") }),
      name: source.label,
      sort: source.id,
      ownership: {
        default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
      },
      flags: {
        ddbimporter: {
          type: this.spellListJournalFlagName,
          sourceId: source.id,
          sourceCode: source.acronym,
          sourceName: source.label,
        },
      },
      folder: this.journalFolder._id,
    };
    logger.debug(`Creating Spell Journal: ${source.label}`, { journalData, source });
    const journal = await JournalEntry.create(
      journalData,
      {
        pack: this.journalCompendium.metadata.id,
        displaySheet: false,
        keepId: true,
      },
    );
    return journal;
  }

  async #getSpellListJournal(source) {
    const journalHit = this.journalCompendium.index.find((j) =>
      j.flags?.ddbimporter?.type === this.spellListJournalFlagName
      && j.flags?.ddbimporter?.sourceName === source.acronym,
    );
    if (journalHit) {
      return this.journalCompendium.getDocument(journalHit._id);
    }
    const journal = await this.#createSpellListJournal(source);
    return journal;
  }

  async #getJournalClassPage(journal, className, source) {
    const classIdentifier = DDBHelper.classIdentifierName(className);
    const page = journal.pages.find((p) => p.system.identifier === classIdentifier);
    if (page) return page;

    const pageData = foundry.utils.deepClone(BASE_CLASS_PAGE);
    pageData.system.identifier = classIdentifier;
    pageData.name = `${className} ${this.spellListJournalNameBit}`;
    pageData._id = utils.namedIDStub(className, { prefix: source.acronym.replaceAll(" ", "").replaceAll(".", "") });
    // console.warn(`Page Data`, {
    //   journal,
    //   pageData,
    //   className,
    //   source,
    // });
    logger.debug(`Creating Spell Journal Page ${pageData.name}`);
    await journal.createEmbeddedDocuments("JournalEntryPage", [pageData], { keepId: true });
    const newPage = journal.pages.find((p) => p.system.identifier === classIdentifier);
    return newPage;
  }

  async #generateJournalClassPage(journal, className = null, source = null) {
    if (!className && !source) return;
    if (!journal) {
      logger.error(`Journal not found for ${source.label}`);
    }

    if (this.uuidLists[source.acronym][className].length === 0) return;

    const spells = [];

    for (const spell of this.uuidLists[source.acronym][className]) {
      const sourceMatch = this.spellCompendium.index.find((s) => s.flags?.ddbimporter?.definitionId === spell.id);
      if (!sourceMatch) {
        logger.warn(`Spell not found in spell compendium: ${spell.name} (${spell.definition.id})`, { spell, this: this });
        continue;
      }
      spells.push(sourceMatch.uuid);
    }

    if (spells.length === 0) return;
    const page = await this.#getJournalClassPage(journal, className, source);
    const newSpells = new Set([...page.system.spells, ...spells]);
    const update = {
      _id: page._id,
      system: {
        spells: Array.from(newSpells),
      },
    };

    logger.debug(`Updating Journal Page`, { update, page, spells, newSpells });
    await journal.updateEmbeddedDocuments("JournalEntryPage", [update]);

  }

  #sourceHasSpells(source) {
    for (const className of SpellListFactory.CLASS_NAMES) {
      if (this.uuidLists[source.acronym][className].length > 0) return true;
    }
    return false;
  }

  async buildSpellLists() {
    await this.init();

    if (!this.sources) return;

    for (const source of this.sources) {
      if (!this.#sourceHasSpells(source)) continue;
      const journal = await this.#getSpellListJournal(source);
      for (const className of SpellListFactory.CLASS_NAMES) {
        await this.#generateJournalClassPage(journal, className, source);
      }
    }
  }

  async registerSpellLists() {
    await this.init();

    const spellListJournals = this.journalCompendium.index.filter((j) =>
      j.flags?.ddbimporter?.type === this.spellListJournalFlagName,
    );

    const pages = [];

    for (const journal of spellListJournals) {
      const journalEntry = await this.journalCompendium.getDocument(journal._id);
      const spellListPages = journalEntry.pages.filter((p) => p.type === "spells");
      pages.push(...spellListPages.map((p) => p.uuid));
    }

    for (const page of pages) {
      dnd5e.registry.spellLists.register(page);
    }
  }

}
