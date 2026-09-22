import { DICTIONARY, SETTINGS } from "../../config/_module";
import { CompendiumHelper, DDBSources, logger, utils } from "../../lib/_module";
import { DDBDataUtils } from "../lib/_module";

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

  journalCompendium = null;

  spellListJournalNameBit = "Spell List";

  spellListJournalFlagName = "DDB Spell List";

  sources = null;

  filteredSources = [];

  spellCompendium = null;

  journalFolder = null;

  uuidsBySourceAndSpellListName = {};

  available = false;

  type = "class";

  /** Basic Rules (2014) and Free Rules (2024) source ids mapped to their Player's Handbook. */
  static BASIC_RULES_FALLBACK: Record<number, number> = { 1: 2, 148: 145 };

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

  constructor({ type = "class" } = {}) {
    this.type = type;
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
      fields: ["name", "flags.ddbimporter.originalName", "flags.ddbimporter.definitionId", "flags.ddbimporter.isLegacy", "flags.ddbimporter.is2014", "flags.ddbimporter.is2024"],
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

  async generateSpellUuidsForSourceAndSpellList(sourceAcronym, spellListName, spellNames, trueFlags = ["is2024"]) {
    this._addSpellListOutline(spellListName, sourceAcronym);

    for (const spellName of spellNames) {
      const spell = this.spellCompendium.index.find((s) =>
        (s.name.toLowerCase() === spellName.toLowerCase()
          || s.flags?.ddbimporter?.originalName.toLowerCase() === spellName.toLowerCase())
        && trueFlags.every((flag) => s.flags?.ddbimporter?.[flag] === true),
      );
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

  _addSpellListOutline(spellListName, sourceAcronym) {
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
      && j.flags?.ddbimporter?.sourceCode === source.acronym,
    );
    if (journalHit) {
      return this.journalCompendium.getDocument(journalHit._id);
    }
    logger.debug(`Creating Spell List Journal for ${source.acronym}`);
    const journal = await this._createSpellListJournal(source);
    return journal;
  }

  async _getJournalSpellListPage(journal, spellListName, source) {
    const spellListIdentifier = DDBDataUtils.classIdentifierName(spellListName);
    const page = journal.pages.find((p) => p.system.identifier === spellListIdentifier);
    if (page) return page;

    const pageData = foundry.utils.deepClone(BASE_CLASS_PAGE);
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
    await journal.createEmbeddedDocuments("JournalEntryPage", [pageData], { keepId: true });
    const newPage = journal.pages.find((p) => p.system.identifier === spellListIdentifier);
    return newPage;
  }

  async _generateJournalSpellListPage(journal, spellListName = null, source = null) {
    if (!spellListName && !source) return;
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
    await journal.updateEmbeddedDocuments("JournalEntryPage", [update]);

  }

  _sourceHasSpells(source, spellListName) {
    const spellNumber = this.uuidsBySourceAndSpellListName[source.acronym][spellListName].length;
    if (spellNumber > 0) return true;
    logger.verbose(`Found ${spellNumber} Spells found for source "${source.label}" and class "${spellListName}"`);
    return false;
  }

  async buildSpellList(source, spellListName) {
    if (!this.available) return;
    if (!this.sources) return;
    if (!this._sourceHasSpells(source, spellListName)) {
      logger.verbose(`No Spells found for source "${source.label}"`);
      return;
    }
    const journal = await this._getSpellListJournal(source);
    await this._generateJournalSpellListPage(journal, spellListName, source);
  }

  #findSpellByDefinitionId(definitionId: number) {
    return this.spellCompendium?.index.find((s) =>
      foundry.utils.getProperty(s, "flags.ddbimporter.definitionId") === definitionId,
    );
  }

  /**
   * Adds compendium spells, matched by DDB definition id, to a named list, one page per source
   * book. Existing pages are extended rather than replaced, so this can top up a list the spell
   * munch built (DDB's class spell endpoint stops at the class's highest slot level, which
   * leaves the Warlock list without its Mystic Arcanum levels).
   * @returns the definition ids that resolved to a compendium uuid; the rest are not munched yet
   */
  async addSpellsByDefinitionId(spellListName: string, spells: { id: number; sourceId?: number | null }[]): Promise<number[]> {
    if (!this.available || !this.sources || !this.spellCompendium) return [];
    await this.init();

    const homebrew = this.sources.find((s) => s.id === 9999999);
    const touchedSources = new Set<any>();
    // a definition listed twice (two granting features) must reach the page once
    const resolved = new Set<number>();

    for (const spell of spells) {
      if (resolved.has(spell.id)) continue;
      // basic rules books get no journal unless the setting asks for them, their spells sit on
      // the matching Player's Handbook page instead
      const sourceId = spell.sourceId && !this.filteredSources.some((s) => s.id === spell.sourceId)
        ? SpellListFactory.BASIC_RULES_FALLBACK[spell.sourceId] ?? spell.sourceId
        : spell.sourceId;
      const source = this.filteredSources.find((s) => s.id === sourceId) ?? homebrew;
      if (!source) continue;
      const match = this.#findSpellByDefinitionId(spell.id);
      if (!match) {
        logger.debug(`Spell definition ${spell.id} not found in spell compendium for spell list ${spellListName}`);
        continue;
      }
      if (!touchedSources.has(source)) {
        this._addSpellListOutline(spellListName, source.acronym);
        touchedSources.add(source);
      }
      this.uuidsBySourceAndSpellListName[source.acronym][spellListName].push(match.uuid);
      resolved.add(spell.id);
    }

    if (resolved.size === 0) return [];

    for (const source of touchedSources) {
      await this.buildSpellList(source, spellListName);
    }
    await this.registerSpellLists();
    return [...resolved];
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
