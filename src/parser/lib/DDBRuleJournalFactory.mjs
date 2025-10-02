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
  "PHB 2024": [
    18, // cleave
    19, // graze
    20, // nick
    21, // push
    22, // sap
    23, // slow
    24, // topple
    25, // vex
  ],
  "GHPG": [ // grim hollow
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
  "TGC": [ // gunslinger
    37, // automatic
    36, // explode
    32, // scatter
  ],
};

const WEAPON_PROPERTIES = {
  "PHB 2024": [
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
  "DMG 2024": [
    14, // burst
    15, // reload
  ],
  "GHPG": [ // grim hollow
    43, // armor piercing
    45, // black powder
    46, // cumbersome
    54, // damage
    51, // double
    39, // hafted
    47, // magazine
    41, // momentum
    48, // repeater
  ],
  "TGC": [ // gunslinger
    32, // scatter
    33, // firearm
    34, // recoil
    35, // sighted
  ],
  "AV": [
    38, // repeating
  ],
  "HGtMH1": [ // Heliana’s Guide to Monster Hunting: Part 1
    31, // loud
    30, // attached
    15, // reload
  ],
  "CR": [ // critical role
    15, // reload
    16, // misfire
    17, // explosive
  ],
  "EGtW": [ // critical role
    15, // reload
    16, // misfire
    17, // explosive
  ],
  "TCSR": [ // critical role
    15, // reload
    16, // misfire
    17, // explosive
  ],
};

// const PHYSICAL_WEAPON_PROPERTIES = [
//   43, // armor piercing
// ];

export default class DDBRuleJournalFactory {

  journalCompendium = null;

  journalNameBit = "";

  journalFlagName = "";

  flagTag = "";

  sources = null;

  journalFolder = null;

  available = false;

  static getSources() {
    const ddbSources = foundry.utils.getProperty(CONFIG, "DDB.sources");
    if (!ddbSources) return [];

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
    return sources;
  }

  #buildSources() {
    const sources = DDBRuleJournalFactory.getSources();

    if (sources.length === 0) return;

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
    const page = journal.pages.find((p) => DDBDataUtils.classIdentifierName(p.name) === ruleIdentifier);
    if (page) return page;

    const pageData = foundry.utils.deepClone(BASE_RULE_PAGE);
    pageData.system.type = this.type;
    pageData.name = rulePageName;
    pageData._id = utils.namedIDStub(rulePageName, { prefix: source.acronym.replaceAll(" ", "").replaceAll(".", "") });

    logger.debug(`Creating Rule Journal Page ${pageData.name}`);
    await journal.createEmbeddedDocuments("JournalEntryPage", [pageData], { keepId: true });
    const newPage = journal.pages.find((p) => DDBDataUtils.classIdentifierName(p.name) === ruleIdentifier);
    return newPage;
  }

  async _generateJournalRulePage(journal, { ruleName, source, ruleContent = "" } = {}) {
    if (!ruleName && !source) return;
    if (!journal) {
      logger.error(`Journal not found for ${source.label}`);
    }

    const page = await this._getJournalRulePage(journal, ruleName, source);
    const update = {
      _id: page._id,
      text: {
        content: ruleContent,
      },
    };

    logger.debug(`Updating Journal Page`, { update, page });
    await journal.updateEmbeddedDocuments("JournalEntryPage", [update]);

  }

  async buildRule(source, name, content) {
    if (!this.available) return;
    if (!this.sources) return;
    logger.debug(`Building Rule Journal for ${name} from source ${source.label}`);
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
      const sourceId = foundry.utils.getProperty(journalEntry, "flags.ddbimporter.sourceId");
      const allowedSourceIds = game.settings.get(SETTINGS.MODULE_ID, "allowed-weapon-property-sources");
      if (!allowedSourceIds.includes(sourceId)) continue;
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
        case "weapon-properties": {
          for (const page of rulePages) {
            const propertyId = page.name.toLowerCase().replaceAll(" ", "").replaceAll("-", "");
            const isPHBProperty = foundry.utils.getProperty(journalEntry, "flags.ddbimporter.sourceCode") === "PHB 2024";
            if (!CONFIG.DND5E.itemProperties[propertyId] && !isPHBProperty) {
              CONFIG.DND5E.itemProperties[propertyId] = {
                label: page.name,
                reference: page.uuid,
              };
              CONFIG.DND5E.validProperties["weapon"].add(propertyId);
            } else if (CONFIG.DND5E.itemProperties[propertyId]
                && !CONFIG.DND5E.itemProperties[propertyId].reference
            ) {
              CONFIG.DND5E.itemProperties[propertyId].reference = page.uuid;
            }
          }
          break;
        }
        // no default
      }
    }

  }

  static async createWeaponPropertyJournals() {
    const factory = new DDBRuleJournalFactory({
      journalName: "Weapon Properties",
      flagName: "DDB Weapon Properties",
      flagTag: "weapon-properties",
    });

    await factory.init();

    if (game.user.isGM) {
      const allowedSourceIds = game.settings.get(SETTINGS.MODULE_ID, "allowed-weapon-property-sources");
      const allowedSources = factory.sources.filter((s) => allowedSourceIds.includes(s.id));

      for (const source of allowedSources) {
        logger.debug(`Processing Weapon Properties for source ${source.label}`);
        const ruleIds = WEAPON_PROPERTIES[source.acronym] ?? [];

        const sourceRules = CONFIG.DDB.weaponProperties.filter((rule) => ruleIds.includes(rule.id));
        logger.debug(`Found ${sourceRules.length} rules for source ${source.label}`, { ruleIds, sourceRules });
        if (sourceRules.length === 0) continue;

        for (const rule of sourceRules) {
          await factory.buildRule(source, rule.name, rule.description);
        }
      }
    }

    await factory.registerRules();

  }


  static async createWeaponMasteryJournals() {
    const factory = new DDBRuleJournalFactory({
      journalName: "Weapon Masteries",
      flagName: "DDB Weapon Masteries",
      flagTag: "weapon-masteries",
    });

    await factory.init();

    if (game.user.isGM) {
      const allowedSourceIds = game.settings.get(SETTINGS.MODULE_ID, "allowed-weapon-property-sources");
      const allowedSources = factory.sources.filter((s) => allowedSourceIds.includes(s.id));

      for (const source of allowedSources) {
        logger.debug(`Processing Weapon Masteries for source ${source.label}`);
        const ruleIds = WEAPON_MASTERY[source.acronym] ?? [];

        const sourceRules = CONFIG.DDB.weaponProperties.filter((rule) => ruleIds.includes(rule.id));
        logger.debug(`Found ${sourceRules.length} rules for source ${source.label}`, { ruleIds, sourceRules });
        if (sourceRules.length === 0) continue;

        for (const rule of sourceRules) {
          await factory.buildRule(source, rule.name, rule.description);
        }
      }
    }

    await factory.registerRules();

  }

  static async registerWeaponIds() {
    const addExtraBaseWeapons = game.settings.get(SETTINGS.MODULE_ID, "add-extra-base-weapons");
    if (!addExtraBaseWeapons) return;
    const allowedSourceIds = game.settings.get(SETTINGS.MODULE_ID, "allowed-weapon-property-sources");
    const sources = DDBRuleJournalFactory.getSources();
    const allowedSources = sources.filter((s) => allowedSourceIds.includes(s.id));

    const itemCompendium = CompendiumHelper.getCompendiumType("items");
    await itemCompendium.getIndex({ fields: ["name", "type", "flags.ddbimporter", "system.source.book"] });
    for (const weapon of CONFIG.DDB.weapons) {
      logger.verbose(`Processing DDB weapon: ${weapon.name}`);
      const handledCase = DICTIONARY.actor.proficiencies
        .find((prof) =>
          prof.type === "Weapon" && weapon.name.toLowerCase() === prof.name.toLowerCase(),
        );
      if (handledCase && handledCase?.foundryValue !== "") continue;
      const dnd5eNameArray = weapon.name.trim().toLowerCase().split(",");
      const dnd5eName = dnd5eNameArray.length === 2
        ? `${dnd5eNameArray[1].trim()}${dnd5eNameArray[0].trim()}`.replaceAll(" ", "")
        : dnd5eNameArray[0].replaceAll(" ", "");
      if (CONFIG.DND5E.weaponIds[dnd5eName]) continue;
      const itemHit = itemCompendium.index.find((i) =>
        i.type === "weapon"
        && (i.name.toLowerCase() === weapon.name.toLowerCase()),
      );
      if (!itemHit) {
        logger.info(`No item found in compendium for weapon ${weapon.name}`);
        continue;
      }
      const itemSource = itemHit.system?.source?.book;
      // console.warn({
      //   itemHit,
      //   allowedSources,
      //   dnd5eName,
      //   itemSource,
      // });
      if (!itemSource) continue;
      if (!allowedSources.some((s) => s.acronym === itemSource)) {
        logger.debug(`Not adding weapon ${weapon.name} as source ${itemSource} not allowed`);
        continue;
      }
      logger.debug(`Adding weapon ${weapon.name} from ${itemSource} as ${dnd5eName} with UUID ${itemHit.uuid}`);
      CONFIG.DND5E.weaponIds[dnd5eName] = itemHit.uuid;
    }
  }

  static addGrimHollowAdvancedWeapons() {
    const allowedSourceIds = game.settings.get(SETTINGS.MODULE_ID, "allowed-weapon-property-sources");
    if (!allowedSourceIds.includes(207)) return;
    logger.debug("Adding Grim Hollow Advanced Weapons");
    CONFIG.DND5E.weaponProficiencies["adv"] = "Advanced (Grim Hollow)";
    CONFIG.DND5E.weaponProficienciesMap["advancedM"] = "adv";
    CONFIG.DND5E.weaponProficienciesMap["advancedR"] = "adv";
    CONFIG.DND5E.weaponTypeMap["advancedM"] = "melee";
    CONFIG.DND5E.weaponTypeMap["advancedR"] = "ranged";
    CONFIG.DND5E.weaponTypes["advancedM"] = "Advanced Melee (Grim Hollow)";
    CONFIG.DND5E.weaponTypes["advancedR"] = "Advanced Ranged (Grim Hollow)";
  }

  static async registerAllWithWorld() {
    DDBRuleJournalFactory.addGrimHollowAdvancedWeapons();
    await DDBRuleJournalFactory.createWeaponMasteryJournals();
    await DDBRuleJournalFactory.createWeaponPropertyJournals();
    await DDBRuleJournalFactory.registerWeaponIds();
  }

}
