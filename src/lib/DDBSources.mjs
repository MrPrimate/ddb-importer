import { DICTIONARY, SETTINGS } from "../config/_module.mjs";

export default class DDBSources {

  static getBookName(bookId) {
    const book = CONFIG.DDB.sources.find((source) => source.name.toLowerCase() == bookId.toLowerCase());
    if (book) {
      return book.description;
    } else {
      return "";
    }
  }

  static is2014Source(source) {
    const force2024 = DICTIONARY.source.is2024.includes(source.sourceId);
    if (force2024) return false;
    // if game is set to modern rules force items that have a 2024 source to be 2024
    if (game.settings.get("dnd5e", "rulesVersion") === 'modern') {
      if (force2024) return false;
    }
    const force2014 = DICTIONARY.source.is2014.includes(source.sourceId);
    if (force2014) return true;
    if (force2024) return false;
    return Number.isInteger(source.sourceId) && source.sourceId < 145;
  }

  static is2024Source(source) {
    const force2014 = DICTIONARY.source.is2014.includes(source.sourceId);
    if (force2014) return false;
    // if game is set to modern rules force items that have a 2024 source to be 2024
    if (game.settings.get("dnd5e", "rulesVersion") === 'modern') {
      if (force2014) return false;
    }
    const force2024 = DICTIONARY.source.is2024.includes(source.sourceId);
    if (force2024) return true;
    return Number.isInteger(source.sourceId) && source.sourceId >= 145;
  }

  static getAdjustedSourceBook(sourceBook) {
    const useBasicRules = game.settings.get(SETTINGS.MODULE_ID, "use-basic-rules");
    if (!useBasicRules && ["free-rules", "br-2024", "BR-2024"].includes(sourceBook)) {
      return "PHB 2024";
    } else if (!useBasicRules && sourceBook === "BR") {
      return "SRD 5.1";
    } else {
      return sourceBook.replace("-", " ");
    }
  }

  static getDDBSourceBook(sourceBook) {
    if (["SRD 5.1"].includes(sourceBook)) {
      return "BR";
    } else {
      return sourceBook.replace(" ", "-");
    }
  }

  static tweakSourceData(source) {
    source.book = DDBSources.getAdjustedSourceBook(source.book);
    if (source.book === "BR") {
      source.license = "CC-BY-4.0";
    } else if (source.book === "br-2024") {
      source.book = "BR-2024";
    }
    if (game.settings.get(SETTINGS.MODULE_ID, "no-source-book-pages"))
      source.page = "";
  }

  /**
   * Given a definition, returns an array of sourcebook objects.
   * The sourcebook object is an object with the following properties:
   * - book: the name of the sourcebook
   * - page: the page number of the sourcebook
   * - license: the license of the sourcebook
   * - custom: the custom name of the sourcebook
   * - id: the id of the sourcebook
   * If the definition has a sources array, it will return an array of sourcebook objects.
   * If the definition has a sourceId, it will return an array with one sourcebook object.
   * If the definition has a sourceIds array, it will return an array with one sourcebook object for each sourceId.
   * If the definition has no source information, it will return an empty array.
   * @param {obj} definition item definition
   * @returns {Array} an array of sourcebook objects
   */
  // eslint-disable-next-line complexity
  static getSourceData(definition) {
    const results = [];
    if (definition.sources?.length > 0) {
      const typeOneSources = definition.sources.filter((source) => source.sourceType === 1);
      const typeTwoSources = definition.sources.filter((source) => source.sourceType === 2);
      // is basic rules (e.g. SRD)
      const basicRules2014 = typeTwoSources.filter((source) => source.sourceId === 1);
      // should be type 2 but aren't for core weapons
      const basicRules2024 = definition.sources.filter((source) => source.sourceId === 148);
      const coreRules = definition.sources.filter((source) => source.sourceId === 198);
      const hasPage = definition.sources.some((source) => source.pageNumber !== null);
      const usePages = game.settings.get(SETTINGS.MODULE_ID, "no-source-book-pages") === false;
      const useBasicRules = game.settings.get(SETTINGS.MODULE_ID, "use-basic-rules");

      let sources = definition.sources;
      if (usePages && hasPage) {
        sources = definition.sources.filter((source) => source.pageNumber !== null);
      }

      if (useBasicRules && coreRules.length > 0) {
        sources = coreRules;
      } else if (useBasicRules
        && game.settings.get("dnd5e", "rulesVersion") === 'modern' && basicRules2024.length > 0
      ) {
        sources = basicRules2024;
      } else if (useBasicRules && basicRules2014.length > 0) {
        sources = basicRules2014;
      } else if (typeOneSources.length > 0) {
        sources = typeOneSources;
      }

      for (const ds of sources) {
        const ddbSource = CONFIG.DDB.sources.find((ddb) => ddb.id === ds.sourceId);

        const source = {
          book: ddbSource ? ddbSource.name : "Homebrew",
          page: ds.pageNumber ?? "",
          license: "",
          custom: "",
          id: ddbSource ? ddbSource.id : 9999999,
          categoryId: ddbSource ? ddbSource.sourceCategoryId : 9999999,
        };
        DDBSources.tweakSourceData(source);
        results.push(source);
      }
    } else if (definition.sourceIds) {
      for (const sourceId of definition.sourceIds) {
        const ddbSource = CONFIG.DDB.sources.find((ddb) => ddb.id === sourceId);
        const source = {
          book: ddbSource ? ddbSource.name : "Homebrew",
          page: definition.sourcePageNumber ?? "",
          license: "",
          custom: "",
          id: ddbSource ? ddbSource.id : 9999999,
          categoryId: ddbSource ? ddbSource.sourceCategoryId : 9999999,
        };

        DDBSources.tweakSourceData(source);
        results.push(source);
      }
    } else if (definition.sourceId) {
      const ddbSource = CONFIG.DDB.sources.find((ddb) => ddb.id === definition.sourceId);
      const source = {
        book: ddbSource ? ddbSource.name : "Homebrew",
        page: definition.sourcePageNumber ?? "",
        license: "",
        custom: "",
        id: ddbSource ? ddbSource.id : 9999999,
        categoryId: ddbSource ? ddbSource.sourceCategoryId : 9999999,
      };
      DDBSources.tweakSourceData(source);
      results.push(source);
    } else if (definition.isHomebrew) {
      const source = {
        book: "Homebrew",
        page: "",
        license: "",
        custom: "",
        id: 9999999,
        categoryId: 9999999,
      };
      results.push(source);
    }
    return results;
  }

  /**
   * Parses the source data of a definition into a single source object
   * @param {obj} definition definition to parse
   * @returns {obj} a source object with the following properties: name, page, license, and custom
   */
  static parseSource(definition) {
    const sources = DDBSources.getSourceData(definition);
    const latestSource = sources.length > 0
      ? sources.reduce((prev, current) => {
        return prev.id > current.id ? prev : current;
      })
      : null;

    if (!latestSource) return {
      book: "",
      page: "",
      license: "",
      custom: "",
    };
    delete latestSource.id;
    return latestSource;
  }

  static addSourcesHook() {
    if (!game.settings.get(SETTINGS.MODULE_ID, "register-source-books")) return;

    const ddbRaw = foundry.utils.getProperty(CONFIG, "DDB.sources");
    if (!ddbRaw) return;

    const sources = {};
    const validSources = ddbRaw.filter((s) => s.isReleased
      && (game.settings.get(SETTINGS.MODULE_ID, "use-basic-rules")
        || !DICTIONARY.sourceCategories.basicRules.includes(s.id)),
    ).map((s) => {
      if (s.name === "br-2024") s.name = "BR-2024";
      return s;
    });
    for (const source of validSources) {
      sources[source.name.replace("-", " ")] = source.description;
    }
    sources["Homebrew"] = "Homebrew";
    Object.assign(CONFIG.DND5E.sourceBooks, sources);
    CONFIG.DDB.sources.push({
      "id": 9999999,
      "name": "Homebrew",
      "description": "Homebrew",
      "sourceCategoryId": 9999999,
      "isReleased": true,
      "avatarURL": "",
      "sourceURL": "my-collection",
    });
    CONFIG.DDB.sourceCategories.push({
      id: 9999999,
      name: "Homebrew",
      description: "Homebrew",
    });
  }

  static getSelectedSourceIds() {
    return game.settings.get(SETTINGS.MODULE_ID, "munching-policy-muncher-sources")
      .map((id) => parseInt(id));
  }

  static getExcludedCategoryIds() {
    return game.settings.get(SETTINGS.MODULE_ID, "munching-policy-muncher-excluded-source-categories")
      .map((id) => parseInt(id));
  }

  static getSelectedMonsterTypeIds() {
    const chosenMonsterTypeIds = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-muncher-monster-types").map((id) => parseInt(id));
    return chosenMonsterTypeIds;
  }

  // eslint-disable-next-line class-methods-use-this
  static AlwaysExcludedCategoryIds = DICTIONARY.sourceCategories.excluded;

  // eslint-disable-next-line class-methods-use-this
  static AlwaysHiddenCategoryIds = DICTIONARY.sourceCategories.hidden;


  static getAllExcludedCategoryIds() {
    return Array.from(new Set([
      ...DDBSources.AlwaysHiddenCategoryIds,
      ...DDBSources.AlwaysExcludedCategoryIds,
      ...DDBSources.getExcludedCategoryIds(),
    ]));
  }

  static getCategoriesWithBooks() {
    const sourceCategories = new Set(CONFIG.DDB.sources.map((s) => s.sourceCategoryId));
    return CONFIG.DDB.sourceCategories
      .filter((cat) => sourceCategories.has(cat.id));
  }

  static getAvailableCategories() {
    const cats = DDBSources.getCategoriesWithBooks()
      .filter((cat) => !DDBSources.AlwaysExcludedCategoryIds.includes(cat.id));
    return cats;
  }

  static getAvailableCategoryIds() {
    return DDBSources.getAvailableCategories()
      .map((source) => source.id);
  }

  static getDisplaySourceCategories(includeHomebrew = false) {
    return DDBSources.getAvailableCategories()
      .filter((c) => !DDBSources.AlwaysHiddenCategoryIds.includes(c.id)
      || (includeHomebrew && c.id === 9999999));
  }

  static getAllowedSources() {
    const excludedIds = DDBSources.getAllExcludedCategoryIds();
    const availableSources = CONFIG.DDB.sources
      .filter((source) => source.isReleased
        && !excludedIds.includes(source.sourceCategoryId),
      );
    return availableSources;
  }

  static getAllowedSourceIds() {
    return DDBSources.getAllowedSources()
      .map((source) => source.id);
  }

  // sources to use in ui
  static getDisplaySources() {
    const excludedIds = [...DDBSources.AlwaysExcludedCategoryIds, ...DDBSources.AlwaysHiddenCategoryIds];
    const availableSources = CONFIG.DDB.sources
      .filter((source) => source.isReleased && !excludedIds.includes(source.sourceCategoryId));
    return availableSources;
  }

  static isSourceInAllowedCategory(source) {
    const sourceCategory = CONFIG.DDB.sources.find((s) => s.id == source.sourceId);
    if (!sourceCategory) return false;
    return !DDBSources.getAllExcludedCategoryIds().includes(sourceCategory.sourceCategoryId);
  }

  static async updateSelectedSources(ids) {
    await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-muncher-sources", ids.map((id) => parseInt(id)));
  }

  static async updateExcludedCategories(ids) {
    await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-muncher-excluded-source-categories", ids.map((id) => parseInt(id)));
  }

  static async updateSelectedMonsterTypes(ids) {
    await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-muncher-monster-types", ids.map((id) => parseInt(id)));
  }

  static async updateAllowedWeaponPropertySources() {
    const allowedSourceIds = new Set(game.settings.get(SETTINGS.MODULE_ID, "allowed-weapon-property-sources").map((id) => parseInt(id)));

    const selectedAllowedSourceIds = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-muncher-sources").map((id) => parseInt(id));
    selectedAllowedSourceIds.forEach((id) => allowedSourceIds.add(id));

    const sourcesNotExcluded = CONFIG.DDB.sources
      .filter((s) => !DDBSources.getAllExcludedCategoryIds().includes(s.sourceCategoryId));

    sourcesNotExcluded.forEach((s) => allowedSourceIds.add(s.id));

    await game.settings.set(SETTINGS.MODULE_ID, "allowed-weapon-property-sources", Array.from(allowedSourceIds).map((id) => parseInt(id)));
  }

}
