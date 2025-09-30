import { DICTIONARY, SETTINGS } from "../../config/_module.mjs";
import { CompendiumHelper, DDBSources, logger, utils } from "../../lib/_module.mjs";
import { DDBDataUtils } from "./_module.mjs";

const BASE_RULE_PAGE = {
  sort: 1,
  name: "",
  type: "rule",
  system: {
    type: "rule",
    description: {
      value: "",
    },
    identifier: "",
  },
  title: {
    show: true,
    level: 2,
  },
  image: {},
  text: {
    content: "",
    format: 1,
  },
  src: null,
  ownership: {
    default: -1,
  },
  flags: {
    ddbimporter: {},
  },
};

const WEAPON_MASTERY = {
  "phb-2024": [
    18, // cleave
    19, // graze
    20, // nick
    21, // push
    22, // sap
    23, // slow
    24, // topple
    25, // vex
  ],
  "ghpg": [ // grim hollow
    50, // brutal
    55, // defending
    53, // disarming
    40, // entangling
    49, // returning
    32, // scattering
    52, // set
    44, // strong draw
    42, // swift
  ],
  "tgc": [ // gunslinger
    37, // automatic
    36, // explode
    32, // scatter
  ],
};

const WEAPON_PROPERTIES = {
  "phb-2024": [
    1, // ammunition
    2, // finesse
    3, // heavy
    4, // light
    5, // loading
    7, // range
    8, // reach
    9, // special
    10, // thrown
    11, // two-handed
    12, // versatile
  ],
  "ghpg": [ // grim hollow
    43, // armor piercing
    45, // black powder
    46, // cumbersome
    54, // damage
    51, // double
    39, // hafted
    47, // magazone
    41, // momentum
    48, // repeater
  ],
  "tgc": [ // gunslinger
    33, // firearm
    34, // recoil
  ],
  "av": [
    38, // repeating
  ],
};

export default class DDBRuleJournalFactory {

  journalCompendium = null;

  journalNameBit = "";

  journalFlagName = "";

  flagTag = "";

  sources = null;

  journalFolder = null;

  uuidsBySource = {};

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

  constructor({ journalName, flagName, flagTag } = {}) {
    this.journalNameBit = journalName;
    this.journalFlagName = flagName;
    this.flagTag = flagTag;
    this.journalCompendium = CompendiumHelper.getCompendiumType("journals");
    this.#buildSources();

    for (const source of this.sources) {
      this.uuidsBySource[source.acronym] = {};
    }

    if (this.journalCompendium) {
      this.available = true;
    } else {
      logger.error("DDB Rule Journal Factory not available, check your compendiums exist.");
    }
  }

  async _getIndexes() {
    await this.journalCompendium.getIndex({
      fields: ["name", "flags.ddbimporter"],
    });

  }

  async init() {
    if (!this.available) return;

    await this._getIndexes();

    this.journalFolder = await CompendiumHelper.createFolder({
      pack: this.journalCompendium,
      name: this.journalNameBit,
      flagTag: this.flagTag,
      entityType: "JournalEntry",
    });
  }

  _addRuleOutline(ruleName, sourceAcronym) {
    this.uuidsBySource[sourceAcronym][ruleName] = [];
  }

  async _createRuleJournal(source) {
    const journalData = {
      _id: utils.namedIDStub(source.label, { prefix: source.acronym.replaceAll(" ", "").replaceAll(".", "") }),
      name: source.label,
      sort: source.id,
      ownership: {
        default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
      },
      flags: {
        ddbimporter: {
          type: this.journalFlagName,
          sourceId: source.id,
          sourceCode: source.acronym,
          sourceName: source.label,
        },
      },
      folder: this.journalFolder._id,
    };
    logger.debug(`Creating Rule Journal: ${source.label}`, { journalData, source });
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

  async _getRuleJournal(source) {
    const journalHit = this.journalCompendium.index.find((j) =>
      j.flags?.ddbimporter?.type === this.journalFlagName
      && j.flags?.ddbimporter?.sourceCode === source.acronym,
    );
    if (journalHit) {
      return this.journalCompendium.getDocument(journalHit._id);
    }
    logger.debug(`Creating Rule Journal for ${source.acronym}`);
    const journal = await this._createRuleJournal(source);
    return journal;
  }

  async _getJournalRulePage(journal, rulePageName, source) {
    const ruleIdentifier = DDBDataUtils.classIdentifierName(rulePageName);
    const page = journal.pages.find((p) => p.system.identifier === ruleIdentifier);
    if (page) return page;

    const pageData = foundry.utils.deepClone(BASE_RULE_PAGE);
    pageData.system.type = this.type;
    pageData.system.identifier = ruleIdentifier;
    pageData.name = rulePageName;
    pageData._id = utils.namedIDStub(rulePageName, { prefix: source.acronym.replaceAll(" ", "").replaceAll(".", "") });
    // console.warn(`Page Data`, {
    //   journal,
    //   pageData,
    //   className,
    //   source,
    // });
    logger.debug(`Creating Rule Journal Page ${pageData.name}`);
    await journal.createEmbeddedDocuments("JournalEntryPage", [pageData], { keepId: true });
    const newPage = journal.pages.find((p) => p.system.identifier === ruleIdentifier);
    return newPage;
  }

  async _generateJournalRulePage(journal, { ruleName, source, ruleContent = "" } = {}) {
    if (!ruleName && !source) return;
    if (!journal) {
      logger.error(`Journal not found for ${source.label}`);
    }

    if (this.uuidsBySource[source.acronym][ruleName].length === 0) return;
    const rules = this.uuidsBySource[source.acronym][ruleName];

    if (rules.length === 0) return;
    const page = await this._getJournalRulePage(journal, ruleName, source);
    const update = {
      _id: page._id,
      system: {
        text: {
          content: ruleContent,
        },
      },
    };

    logger.debug(`Updating Journal Page`, { update, page, rules });
    await journal.updateEmbeddedDocuments("JournalEntryPage", [update]);

  }

  _sourceHasRule(source, ruleName) {
    const ruleNumber = this.uuidsBySource[source.acronym][ruleName].length;
    if (ruleNumber > 0) return true;
    logger.verbose(`Found ${ruleNumber} Rules found for source "${source.label}" and rule "${ruleName}"`);
    return false;
  }

  async buildRule(source, name, content) {
    if (!this.available) return;
    if (!this.sources) return;
    if (!this._sourceHasRule(source, name)) {
      logger.verbose(`No Rules found for source "${source.label}"`);
      return;
    }
    const journal = await this._getRuleJournal(source);
    await this._generateJournalRulePage(journal, { ruleName: name, source, ruleContent: content });
  }

  async registerRules() {
    if (!this.available) return;
    await this.init();

    const ruleJournals = this.journalCompendium.index.filter((j) =>
      j.flags?.ddbimporter?.type === this.journalFlagName,
    );

    for (const journal of ruleJournals) {
      const journalEntry = await this.journalCompendium.getDocument(journal._id);
      const rulePages = journalEntry.pages.filter((p) => p.type === "rule");
      switch (this.flagTag) {
        case "weapon-masteries": {
          for (const page of rulePages) {
            const masteryId = page.name.toLowerCase().replaceAll(" ", "").replaceAll("-", "");
            if (CONFIG.DND5E.weaponMasteries[masteryId]) continue;
            CONFIG.DND5E.weaponMasteries[masteryId] = {
              label: page.name,
              reference: page.uuid,
            };
          }
          break;
        }
        // no default
      }
    }

  }


  static async createWeaponMasteryJournals() {
    const factory = new DDBRuleJournalFactory({
      journalName: "Weapon Masteries",
      flagName: "DDB Weapon Masteries",
      flagTag: "weapon-masteries",
    });

    await factory.init();

    const allowedSourceIds = game.settings.get(SETTINGS.MODULE_ID, "allowed-weapon-property-sources");

    const allowedSources = factory.sources.filter((s) => allowedSourceIds.includes(s.id));

    for (const source of allowedSources) {
      const ruleIds = WEAPON_MASTERY[source] ?? [];

      const sourceRules = CONFIG.DDB.weaponProperties.filter((rule) => ruleIds.includes(rule.id));
      if (sourceRules.length === 0) continue;

      for (const rule of sourceRules) {
        factory._addRuleOutline(rule.name, source.acronym);
        await factory.buildRule(source, rule.name, rule.description);
      }
    }

    await factory.registerRules();

  }

}
