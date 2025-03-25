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

  static getAdjustedSourceBook(sourceBook) {
    if (["free-rules"].includes(sourceBook)) {
      return "PHB 2024";
    } else if (sourceBook === "BR") {
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
    }
    if (game.settings.get("ddb-importer", "no-source-book-pages"))
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
      // is basic rules (e.g. SRD)
      const basicRules = definition.sources.some((source) => source.sourceType === 2 && source.sourceId === 1);
      const hasPage = definition.sources.some((source) => source.pageNumber !== null);
      const sources = hasPage
        ? definition.sources.filter((source) => source.pageNumber !== null)
        : basicRules
          ? definition.sources.filter((source) => source.sourceType === 2 && source.sourceId === 1)
          : definition.sources.some((source) => source.sourceType === 1)
            ? definition.sources.filter((source) => source.sourceType === 1)
            : definition.sources;
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
    for (const source of ddbRaw.filter((s) => s.isReleased && !SETTINGS.NO_SOURCE_MATCH_IDS.includes(s.id))) {
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

  static getDisplaySourceCategories() {
    return DDBSources.getAvailableCategories()
      .filter((c) => !DDBSources.AlwaysHiddenCategoryIds.includes(c.id));
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

}
