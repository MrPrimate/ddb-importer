import { DICTIONARY } from "../../config/_module";
import { CompendiumHelper, DDBSources, logger, utils } from "../../lib/_module";
import { DDBDataUtils } from "../lib/_module";

const BASE_CLASS_PAGE: I5eSpellsJournalPageData = {
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

  journalCompendium: CompendiumCollection.Any | null = null;
  spellListJournalNameBit = "Spell List";
  spellListJournalFlagName = "DDB Spell List";
  sources: ISpellListSource[] | null = null;
  filteredSources: ISpellListSource[] = [];
  spellCompendium: CompendiumCollection.Any | null = null;
  journalFolder: ({ _id: string; name: string } & Folder) | null = null;
  uuidsBySourceAndSpellListName: Record<string, Record<string, string[]>> = {};
  available = false;
  type = "class";
  ALL_SPELL_LISTS: string[] = [];

  #buildSources() {
    const ddbSources = foundry.utils.getProperty(CONFIG, "DDB.sources") as IDDBConfigSource[] | undefined;
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
      utils.getSetting<boolean>("use-basic-rules")
      || !DICTIONARY.sourceCategories.basicRules.includes(s.id),
    );

  }

  constructor({ type = "class" } = {}) {
    this.type = type;
    this.journalCompendium = CompendiumHelper.getCompendiumType("journals") ?? null;
    this.spellCompendium = CompendiumHelper.getCompendiumType("spells") ?? null;
    this.#buildSources();

    for (const source of this.sources ?? []) {
      this.uuidsBySourceAndSpellListName[source.acronym] = {};
    }

    if (this.journalCompendium && this.spellCompendium) {
      this.available = true;
    } else {
      logger.error("Spell List Factory not available, check your compendiums exist.");
    }
  }

  async _getIndexes() {
    if (!this.spellCompendium || !this.journalCompendium) return;
    await this.spellCompendium.getIndex({
      fields: ["name", "flags.ddbimporter.originalName", "flags.ddbimporter.definitionId", "flags.ddbimporter.isLegacy", "flags.ddbimporter.is2014", "flags.ddbimporter.is2024"],
    });
    await this.journalCompendium.getIndex({
      fields: ["name", "flags.ddbimporter"],
    });

  }

  async init() {
    if (!this.available) return;
    if (!this.journalCompendium) return;

    await this._getIndexes();

    this.journalFolder = await CompendiumHelper.createFolder({
      pack: this.journalCompendium,
      name: `${this.spellListJournalNameBit}s`,
      flagTag: "spell-lists",
      entityType: "JournalEntry",
    });
  }

  async generateSpellUuidsForSourceAndSpellList(sourceAcronym: string, spellListName: string, spellNames: string[], trueFlags: string[] = ["is2024"]) {
    this._addSpellListOutline(spellListName, sourceAcronym);
    if (!this.spellCompendium) {
      logger.warn("Spell compendium not found, unable to generate spell list uuids");
      return;
    }

    for (const spellName of spellNames) {
      const spell = this.spellCompendium.index.find((s) => {
        const originalName = foundry.utils.getProperty(s, "flags.ddbimporter.originalName") as string | undefined;
        return ((foundry.utils.getProperty(s, "name") as string).toLowerCase() === spellName.toLowerCase()
          || originalName?.toLowerCase() === spellName.toLowerCase())
          && trueFlags.every((flag) => foundry.utils.getProperty(s, `flags.ddbimporter.${flag}`) === true);
      });
      if (!spell) {
        logger.warn(`Unable to find Spell "${spellName}" for spell list ${spellListName} in source ${sourceAcronym}`, {
          spellName,
          spellListName,
          sourceAcronym,
          trueFlags,
        });
        continue;
      }
      this.uuidsBySourceAndSpellListName[sourceAcronym][spellListName].push(spell.uuid);
    }
  }

  _addSpellListOutline(spellListName: string, sourceAcronym: string) {
    this.uuidsBySourceAndSpellListName[sourceAcronym][spellListName] = [];
  }

  async _createSpellListJournal(source: ISpellListSource) {
    if (!this.journalCompendium) {
      logger.error("Journal compendium not found, unable to create spell list journal");
      return undefined;
    }
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
      folder: this.journalFolder?._id,
    };
    logger.debug(`Creating Spell Journal: ${source.label}`, { journalData, source });
    const journal = await JournalEntry.create(
      journalData as unknown as JournalEntry.CreateInput,
      {
        pack: this.journalCompendium.metadata.id,
        displaySheet: false,
        keepId: true,
      } as Parameters<typeof JournalEntry.create>[1],
    );
    return journal as JournalEntry.Implementation | undefined;
  }

  async _getSpellListJournal(source: ISpellListSource): Promise<JournalEntry.Implementation | undefined> {
    if (!this.journalCompendium) {
      logger.error("Journal compendium not found, unable to get spell list journal");
      return undefined;
    }
    const journalHit = this.journalCompendium.index.find((j) =>
      foundry.utils.getProperty(j, "flags.ddbimporter.type") === this.spellListJournalFlagName
      && foundry.utils.getProperty(j, "flags.ddbimporter.sourceCode") === source.acronym,
    );
    if (journalHit) {
      return await this.journalCompendium.getDocument(journalHit._id) as JournalEntry.Implementation;
    }
    logger.debug(`Creating Spell List Journal for ${source.acronym}`);
    const journal = await this._createSpellListJournal(source);
    return journal;
  }

  async _getJournalSpellListPage(journal: JournalEntry.Implementation, spellListName: string, source: ISpellListSource) {
    const spellListIdentifier = DDBDataUtils.classIdentifierName(spellListName);
    const page = journal.pages.find((p: JournalEntryPage.Implementation) => foundry.utils.getProperty(p, "system.identifier") === spellListIdentifier);
    if (page) return page;

    const pageData = foundry.utils.deepClone(BASE_CLASS_PAGE) as typeof BASE_CLASS_PAGE & { _id?: string };
    pageData.system.type = this.type;
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
    await journal.createEmbeddedDocuments("JournalEntryPage", [pageData as unknown as JournalEntryPage.CreateInput], { keepId: true });
    const newPage = journal.pages.find((p: JournalEntryPage.Implementation) => foundry.utils.getProperty(p, "system.identifier") === spellListIdentifier);
    return newPage;
  }

  async _generateJournalSpellListPage(journal: JournalEntry.Implementation | undefined, spellListName: string | null = null, source: ISpellListSource | null = null) {
    // both the spell list name and source are required to generate a page
    if (!spellListName || !source) return;
    if (!journal) {
      logger.error(`Journal not found for ${source.label}`);
      return;
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
    await journal.updateEmbeddedDocuments("JournalEntryPage", [update] as unknown as Parameters<typeof journal.updateEmbeddedDocuments>[1]);

  }

  _sourceHasSpells(source: ISpellListSource, spellListName: string) {
    const spellNumber = this.uuidsBySourceAndSpellListName[source.acronym][spellListName].length;
    if (spellNumber > 0) return true;
    logger.verbose(`Found ${spellNumber} Spells found for source "${source.label}" and class "${spellListName}"`);
    return false;
  }

  async buildSpellList(source: ISpellListSource, spellListName: string) {
    if (!this.available) return;
    if (!this.sources) return;
    if (!this._sourceHasSpells(source, spellListName)) {
      logger.verbose(`No Spells found for source "${source.label}"`);
      return;
    }
    const journal = await this._getSpellListJournal(source);
    await this._generateJournalSpellListPage(journal, spellListName, source);
  }

  async registerSpellLists() {
    if (!this.available) return;
    await this.init();
    if (!this.journalCompendium) return;

    const spellListJournals = this.journalCompendium.index.filter((j) =>
      foundry.utils.getProperty(j, "flags.ddbimporter.type") === this.spellListJournalFlagName,
    );

    const pages = [];

    for (const journal of spellListJournals) {
      const journalEntry = await this.journalCompendium.getDocument(journal._id) as JournalEntry.Implementation;
      const spellListPages = journalEntry.pages.filter((p: JournalEntryPage.Implementation) => p.type === "spells");
      pages.push(...spellListPages.map((p: JournalEntryPage.Implementation) => p.uuid));
    }

    for (const page of pages) {
      dnd5e.registry.spellLists.register(page);
    }
  }

}
