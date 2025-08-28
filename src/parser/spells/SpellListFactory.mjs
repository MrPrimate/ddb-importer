import { DICTIONARY, SETTINGS } from "../../config/_module.mjs";
import { CompendiumHelper, DDBSources, logger, utils } from "../../lib/_module.mjs";
import { DDBDataUtils } from "../lib/_module.mjs";

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

  uuidsBySourceAndSpellListName = {};

  available = false;


  #buildSources() {
    const ddbSources = foundry.utils.getProperty(CONFIG, "DDB.sources");
    if (!ddbSources) return;

    const sources = ddbSources
      .filter((s) => s.isReleased)
      .map((s) => {
        return {
          id: s.id,
          acronym: DDBSources.getAdjustedSourceBook(s.name),
          label: s.description,
        };
      });

    sources.push({
      id: 9999999,
      acronym: "Homebrew",
      label: "Homebrew",
    });

    this.sources = sources;
    this.filteredSources = sources.filter((s) =>
      game.settings.get(SETTINGS.MODULE_ID, "use-basic-rules")
      || !DICTIONARY.sourceCategories.basicRules.includes(s.id),
    );

  }

  constructor() {
    this.journalCompendium = CompendiumHelper.getCompendiumType("journals");
    this.spellCompendium = CompendiumHelper.getCompendiumType("spells");
    this.#buildSources();

    for (const source of this.sources) {
      this.uuidsBySourceAndSpellListName[source.acronym] = {};
    }

    if (this.journalCompendium && this.spellCompendium) {
      this.available = true;
    } else {
      logger.error("Spell List Factory not available, check your compendiums exist.");
    }
  }

  async _getIndexes() {
    await this.spellCompendium.getIndex({
      fields: ["name", "flags.ddbimporter.definitionId", "flags.ddbimporter.isLegacy"],
    });
    await this.journalCompendium.getIndex({
      fields: ["name", "flags.ddbimporter"],
    });

  }

  async init() {
    if (!this.available) return;

    await this._getIndexes();

    this.journalFolder = await CompendiumHelper.createFolder({
      pack: this.journalCompendium,
      name: `${this.spellListJournalNameBit}s`,
      flagTag: "spell-lists",
      entityType: "JournalEntry",
    });
  }

  addSpellListOutline(spellListName, sourceAcronym) {
    this.uuidsBySourceAndSpellListName[sourceAcronym][spellListName] = [];
  }

  async _createSpellListJournal(source) {
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

  async _getSpellListJournal(source) {
    const journalHit = this.journalCompendium.index.find((j) =>
      j.flags?.ddbimporter?.type === this.spellListJournalFlagName
      && j.flags?.ddbimporter?.sourceName === source.acronym,
    );
    if (journalHit) {
      return this.journalCompendium.getDocument(journalHit._id);
    }
    const journal = await this._createSpellListJournal(source);
    return journal;
  }

  async _getJournalSpellListPage(journal, spellListName, source) {
    const spellListIdentifier = DDBDataUtils.classIdentifierName(spellListName);
    const page = journal.pages.find((p) => p.system.identifier === spellListIdentifier);
    if (page) return page;

    const pageData = foundry.utils.deepClone(BASE_CLASS_PAGE);
    pageData.system.identifier = spellListIdentifier;
    pageData.name = `${spellListName} ${this.spellListJournalNameBit}`;
    pageData._id = utils.namedIDStub(spellListName, { prefix: source.acronym.replaceAll(" ", "").replaceAll(".", "") });
    // console.warn(`Page Data`, {
    //   journal,
    //   pageData,
    //   className,
    //   source,
    // });
    logger.debug(`Creating Spell Journal Page ${pageData.name}`);
    await journal.createEmbeddedDocuments("JournalEntryPage", [pageData], { keepId: true });
    const newPage = journal.pages.find((p) => p.system.identifier === spellListIdentifier);
    return newPage;
  }

  async _generateJournalSpellListPage(journal, spellListName = null, source = null) {
    if (!spellListName && !source) return;
    if (!journal) {
      logger.error(`Journal not found for ${source.label}`);
    }

    if (this.uuidsBySourceAndSpellListName[source.acronym][spellListName].length === 0) return;
    const spells = this.uuidsBySourceAndSpellListName[source.acronym][spellListName];

    if (spells.length === 0) return;
    const page = await this._getJournalSpellListPage(journal, spellListName, source);
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

  _sourceHasSpells(source, spellListName) {
    const spellNumber = this.uuidsBySourceAndSpellListName[source.acronym][spellListName].length;
    if (spellNumber > 0) return true;
    logger.debug(`Found ${spellNumber} Spells found for source "${source.label}" and class "${spellListName}"`);
    return false;
  }

  async buildSpellList(source, spellListName) {
    if (!this.available) return;
    if (!this.sources) return;
    if (!this._sourceHasSpells(source, spellListName)) {
      logger.debug(`No Spells found for source "${source.label}"`);
      return;
    }
    const journal = await this._getSpellListJournal(source);
    await this._generateJournalSpellListPage(journal, spellListName, source);
  }

  async registerSpellLists() {
    if (!this.available) return;
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
