import utils from "./Utils";
import DDBSources from "./DDBSources";
import DDBCampaigns from "./DDBCampaigns";

/**
 * Relates proxy cache entries to the muncher settings that produce them.
 *
 * Each cached request was keyed on the parameters the muncher derived from its settings at the
 * time (source categories, book filter, homebrew flags, campaign, rules version...). This module
 * re-derives those parameters from the CURRENT settings so the Cache Management tab can show which
 * entries the next munch would hit, explain why the others would not, and rewrite the settings to
 * match a chosen entry. Only the settings-derived parameters are compared: per-run inputs such as
 * a search term or the class being fetched are deliberately ignored.
 */

function numberList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.map(Number).filter((id) => Number.isFinite(id)).sort((a, b) => a - b);
}

function sameList(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/** Campaign ids are "" in some bodies and null in others; both mean "no campaign". */
function campaignOf(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

function categoryName(id: number): string {
  return (CONFIG.DDB?.sourceCategories ?? []).find((category) => category.id === id)?.name ?? `category ${id}`;
}

function bookCode(id: number): string {
  return (CONFIG.DDB?.sources ?? []).find((source) => source.id === id)?.name ?? `book ${id}`;
}

function listNames(names: string[], limit = 6): string {
  if (names.length <= limit) return names.join(", ");
  return `${names.slice(0, limit).join(", ")} and ${names.length - limit} more`;
}

/** The categories a monster/vehicle request included, from the excluded list it carried. */
function includedCategoriesFromExcluded(excluded: number[]): number[] {
  const hidden = new Set([...DDBSources.AlwaysHiddenCategoryIds, ...DDBSources.AlwaysExcludedCategoryIds, ...excluded]);
  return (CONFIG.DDB?.sourceCategories ?? [])
    .map((category) => category.id)
    .filter((id) => !hidden.has(id))
    .sort((a, b) => a - b);
}

function categoryIdsOfSources(sourceIds: number[]): number[] {
  const ids = new Set<number>();
  for (const sourceId of sourceIds) {
    const category = DDBSources.getSourceCategoryForSourceId(sourceId);
    if (category) ids.add(category.id);
  }
  return Array.from(ids).sort((a, b) => a - b);
}

/**
 * The two rules inputs a mule request carries. `systemRules` is the dnd5e world setting, which no
 * muncher setting can change; the muncher's own class rules version only reaches the request as
 * `include2014Adjusted`, and only in a modern world (see DDBMuleHandler._fetchMuleData).
 */
function currentMuleRules(): { worldRules: string; importRules: string; include2014Adjusted: boolean } {
  const isModern = utils.getSetting<string>("rulesVersion", "dnd5e") === "modern";
  const chosen = utils.getSetting<string>("munching-policy-character-class-rules-version") ?? "";
  const is2024Import = chosen === "2024" || (chosen === "" && isModern);
  return {
    worldRules: isModern ? "2024" : "2014",
    importRules: is2024Import ? "2024" : "2014",
    include2014Adjusted: isModern && is2024Import,
  };
}

/** The import rules version a mule request implies, or null when the request cannot tell (legacy world). */
function importRulesOf(params: Record<string, unknown>): string | null {
  if (String(params.systemRules ?? "2014") !== "2024") return null;
  return params.include2014Adjusted ? "2024" : "2014";
}

function currentMonsterSignature(): Record<string, unknown> {
  const sources = DDBSources.getBookFilter().effective;
  return {
    sources,
    homebrew: sources.length > 0 ? false : utils.getSetting<boolean>("munching-policy-monster-homebrew"),
    homebrewOnly: sources.length > 0 ? false : utils.getSetting<boolean>("munching-policy-monster-homebrew-only"),
    exactMatch: utils.getSetting<boolean>("munching-policy-monster-exact-match"),
    excludedCategories: DDBSources.getAllExcludedCategoryIds(),
    monsterTypes: DDBSources.getSelectedMonsterTypeIds(),
    excludeLegacy: false,
    endpoint: CONFIG.DDBI?.monsterURL ?? undefined,
  };
}

function currentVehicleSignature(): Record<string, unknown> {
  return {
    sources: DDBSources.getBookFilter().effective,
    exactMatch: utils.getSetting<boolean>("munching-policy-monster-exact-match"),
    excludedCategories: DDBSources.getAllExcludedCategoryIds(),
    excludeLegacy: false,
    endpoint: CONFIG.DDBI?.vehicleURL ?? undefined,
  };
}

type TDifference = string | null;

function compareBoolean(label: string, entry: unknown, current: unknown): TDifference {
  return !!entry === !!current ? null : `${label}: ${entry ? "on" : "off"} (now ${current ? "on" : "off"})`;
}

function compareIdList(label: string, entry: unknown, current: unknown, describe: (id: number) => string): TDifference {
  const a = numberList(entry);
  const b = numberList(current);
  if (sameList(a, b)) return null;
  const only = (from: number[], other: number[]) => from.filter((id) => !other.includes(id)).map(describe);
  const extra = only(a, b);
  const missing = only(b, a);
  const parts: string[] = [];
  if (extra.length) parts.push(`entry has ${listNames(extra, 4)}`);
  if (missing.length) parts.push(`settings have ${listNames(missing, 4)}`);
  return `${label}: ${parts.join("; ")}`;
}

function compareCategories(entry: unknown, current: unknown): TDifference {
  return compareIdList("categories", includedCategoriesFromExcluded(numberList(entry)), includedCategoriesFromExcluded(numberList(current)), categoryName);
}

function compareEndpoint(entry: unknown, current: unknown): TDifference {
  return (entry ?? undefined) === (current ?? undefined) ? null : `endpoint: ${entry ?? "default"} (now ${current ?? "default"})`;
}

function compareCampaign(entry: unknown): TDifference {
  const current = DDBCampaigns.getCampaignId();
  const cached = campaignOf(entry);
  return cached === current ? null : `campaign: ${cached || "none"} (now ${current || "none"})`;
}

function evaluateMonsters(params: Record<string, unknown>): TDifference[] {
  const current = currentMonsterSignature();
  return [
    compareCategories(params.excludedCategories, current.excludedCategories),
    compareIdList("books", params.sources, current.sources, bookCode),
    compareBoolean("homebrew", params.homebrew, current.homebrew),
    compareBoolean("homebrew only", params.homebrewOnly, current.homebrewOnly),
    compareBoolean("exact match", params.exactMatch, current.exactMatch),
    compareIdList("monster types", params.monsterTypes, current.monsterTypes, (id) => `type ${id}`),
    compareBoolean("exclude legacy", params.excludeLegacy, current.excludeLegacy),
    compareEndpoint(params.endpoint, current.endpoint),
  ];
}

function evaluateVehicles(params: Record<string, unknown>): TDifference[] {
  const current = currentVehicleSignature();
  return [
    compareCategories(params.excludedCategories, current.excludedCategories),
    compareIdList("books", params.sources, current.sources, bookCode),
    compareBoolean("exact match", params.exactMatch, current.exactMatch),
    compareBoolean("exclude legacy", params.excludeLegacy, current.excludeLegacy),
    compareEndpoint(params.endpoint, current.endpoint),
  ];
}

/** Older class entries only recorded the books left after filtering by available subclasses. */
function matchesMuleRun(params: Record<string, unknown>, run: number[], selection?: IProxyCacheSourceSelection): boolean {
  const sources = numberList(selection?.runSources ?? params.sources);
  if (params.element === "class" && !selection?.runSources) {
    return sources.length > 0 && sources.every((id) => run.includes(id));
  }
  return sameList(run, sources);
}

function evaluateMuleStream(params: Record<string, unknown>, selection?: IProxyCacheSourceSelection): TDifference[] {
  const differences: TDifference[] = [];
  const rules = String(params.systemRules ?? "2014");
  const current = currentMuleRules();
  if (rules !== current.worldRules) {
    differences.push(`system rules: ${rules} (the world is now ${current.worldRules})`);
  } else {
    const importRules = importRulesOf(params);
    if (importRules !== null && importRules !== current.importRules) {
      differences.push(`import rules: ${importRules} (now ${current.importRules})`);
    }
  }
  differences.push(compareBoolean(
    "optional class features",
    params.includeOptionalClassFeatures,
    utils.getSetting<boolean>("munching-policy-character-optional-class-features"),
  ));
  differences.push(compareIdList("option sources", params.optionSources, Array.from(DDBSources.getChosenSourceIdSet()), bookCode));

  if (params.includeHomebrew) {
    // homebrew runs are issued only when the homebrew settings ask for them
    differences.push(compareBoolean("fetch homebrew", true, utils.getSetting<boolean>("munching-policy-character-fetch-homebrew")));
    differences.push(compareBoolean("only homebrew", params.onlyHomebrew, utils.getSetting<boolean>("munching-policy-character-only-homebrew")));
  } else {
    // Class runs further narrow each category to the books containing subclasses for that class.
    const sources = numberList(params.sources);
    const runs = DDBSources.getChosenCategoriesAndBooks().map((run) => numberList(run.sourceIds));
    if (!runs.some((run) => matchesMuleRun(params, run, selection))) {
      const categories = categoryIdsOfSources(sources).map(categoryName);
      differences.push(`books: ${listNames(sources.map(bookCode), 4)}${categories.length ? ` (${listNames(categories, 3)})` : ""} is not one of the runs the current selection makes`);
    }
  }
  return differences;
}

async function applyCategoriesAndBooks(includedCategories: number[], books: number[]): Promise<void> {
  await DDBSources.updateIncludedCategories(includedCategories);
  if (books.length > 0) {
    await utils.setSetting("munching-policy-use-source-filter", true);
    await DDBSources.updateSelectedSources(books);
  } else {
    await utils.setSetting("munching-policy-use-source-filter", false);
  }
}

async function adoptMonsters(params: Record<string, unknown>): Promise<void> {
  await applyCategoriesAndBooks(includedCategoriesFromExcluded(numberList(params.excludedCategories)), numberList(params.sources));
  await DDBSources.updateSelectedMonsterTypes(numberList(params.monsterTypes));
  await utils.setSetting("munching-policy-monster-homebrew", !!params.homebrew);
  await utils.setSetting("munching-policy-monster-homebrew-only", !!params.homebrewOnly);
  await utils.setSetting("munching-policy-monster-exact-match", !!params.exactMatch);
}

async function adoptVehicles(params: Record<string, unknown>): Promise<void> {
  await applyCategoriesAndBooks(includedCategoriesFromExcluded(numberList(params.excludedCategories)), numberList(params.sources));
  await utils.setSetting("munching-policy-monster-exact-match", !!params.exactMatch);
}

const DDBProxyCacheSettings = {

  /** Mule downloads report matching settings without offering to change them. */
  isMuleDomain(domain: TProxyCacheDomain): boolean {
    return ["mule-stream", "mule-list", "subclasses"].includes(domain);
  },

  /** Capture the selection before streaming or parsing can yield to further settings edits. */
  captureMuleSelection(params: Record<string, unknown>): IProxyCacheSourceSelection | undefined {
    if (!sameList(numberList(params.optionSources), numberList(Array.from(DDBSources.getChosenSourceIdSet())))) return undefined;
    const run = params.includeHomebrew ? undefined : DDBSources.getChosenCategoriesAndBooks()
      .find((candidate) => matchesMuleRun(params, numberList(candidate.sourceIds)));
    // Direct API calls may supply a source list unrelated to the current muncher selection.
    if (!params.includeHomebrew && !run) return undefined;
    return {
      categories: [...DDBSources.getIncludedCategoryIds()],
      books: [...DDBSources.getBookFilter().effective],
      ...(run ? { runSources: [...run.sourceIds] } : {}),
    };
  },

  /**
   * Second-line description of the sources a request covered, or null when the domain has none
   * worth showing. Category names come from CONFIG.DDB, so a stale id degrades to its number.
   */
  describeSources(domain: TProxyCacheDomain, params: Record<string, unknown>): string | null {
    switch (domain) {
      case "monsters":
      case "vehicles": {
        const parts: string[] = [];
        const categories = includedCategoriesFromExcluded(numberList(params.excludedCategories)).map(categoryName);
        parts.push(categories.length ? `Categories: ${listNames(categories)}` : "No categories");
        const books = numberList(params.sources);
        if (books.length) parts.push(`Books: ${listNames(books.map(bookCode))}`);
        if (params.homebrewOnly) parts.push("homebrew only");
        else if (params.homebrew) parts.push("with homebrew");
        const types = numberList(params.monsterTypes);
        if (types.length) parts.push(`${types.length} monster type${types.length === 1 ? "" : "s"}`);
        return parts.join(" · ");
      }
      case "mule-stream": {
        const parts: string[] = [];
        const sources = numberList(params.sources);
        const categories = categoryIdsOfSources(sources).map(categoryName);
        if (params.includeHomebrew) parts.push(params.onlyHomebrew ? "Homebrew only" : "With homebrew");
        else if (categories.length) parts.push(`Categories: ${listNames(categories)} (${sources.length} book${sources.length === 1 ? "" : "s"})`);
        else if (sources.length) parts.push(`Books: ${listNames(sources.map(bookCode))}`);
        if (params.includeOptionalClassFeatures) parts.push("optional class features");
        return parts.length ? parts.join(" · ") : null;
      }
      case "mule-list": {
        const books = numberList(params.sources);
        return books.length ? `Books: ${listNames(books.map(bookCode))}` : null;
      }
      default:
        return null;
    }
  },

  /** Would the current settings produce this entry's request (ignoring per-run inputs)? */
  evaluate(domain: TProxyCacheDomain, params: Record<string, unknown>, sourceSelection?: IProxyCacheSourceSelection): IProxyCacheSettingsMatch {
    let differences: TDifference[];
    const adoptable = !DDBProxyCacheSettings.isMuleDomain(domain);
    switch (domain) {
      case "monsters":
        differences = evaluateMonsters(params);
        break;
      case "vehicles":
        differences = evaluateVehicles(params);
        break;
      case "spells":
      case "items":
      case "mule-list":
        differences = [compareCampaign(params.campaignId)];
        break;
      case "mule-stream":
        differences = evaluateMuleStream(params, sourceSelection);
        break;
      default:
        // subclass lists are keyed on the mule character's campaign, and by-id monster records
        // on nothing a setting controls
        return { supported: false, matches: false, adoptable: false, differences: [] };
    }
    const found = differences.filter((difference): difference is string => difference !== null);
    const matches = found.length === 0;
    return { supported: true, matches, adoptable: !matches && adoptable, differences: found };
  },

  /**
   * The search term a request was made with, when its domain sends one to the proxy. Spell and
   * item searches filter locally after the download, so only monster and vehicle entries carry one.
   */
  searchTermOf(domain: TProxyCacheDomain, params: Record<string, unknown>): string | null {
    if (domain !== "monsters" && domain !== "vehicles") return null;
    return typeof params.search === "string" ? params.search.trim() : "";
  },

  /** Rewrite the settings so the next munch of this domain produces this entry's request. */
  async adopt(domain: TProxyCacheDomain, params: Record<string, unknown>): Promise<boolean> {
    switch (domain) {
      case "monsters":
        await adoptMonsters(params);
        return true;
      case "vehicles":
        await adoptVehicles(params);
        return true;
      case "spells":
      case "items":
        await utils.setSetting("campaign-id", campaignOf(params.campaignId));
        return true;
      default:
        return false;
    }
  },

};

export default DDBProxyCacheSettings;
