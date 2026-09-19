import { DICTIONARY } from "../../config/_module";
import { DDBSources } from "../../lib/_module";
import DDBMonster from "../DDBMonster";

/**
 * The book and ruleset of a DDB monster, from its source ids alone. Used while parsing, and by
 * lookups that need to file another monster's art under the book and rules its own munch would.
 */
export function resolveMonsterSource(monsterSource: Pick<IDDBMonsterSourceData, "sourceId" | "sources" | "sourcePageNumber">) {
  let ddbSource = CONFIG.DDB.sources.find((cnf) => cnf.id == monsterSource.sourceId);
  const ddbSources = (monsterSource.sources ?? []).filter((s) => s.sourceType === 1);
  if (monsterSource.sources && ddbSources.length > 1) {
    const highestSource = ddbSources.reduce((prev, current) => {
      return prev.sourceId > current.sourceId ? prev : current;
    });
    ddbSource = CONFIG.DDB.sources.find((cnf) => cnf.id == highestSource.sourceId);
  }

  const source = {
    book: ddbSource ? ddbSource.name : "Homebrew",
    page: monsterSource.sourcePageNumber ?? "",
    custom: "",
    license: "",
    id: ddbSource ? ddbSource.id : 9999999,
    sourceCategoryId: ddbSource ? ddbSource.sourceCategoryId : 9999999,
  };

  DDBSources.tweakSourceData(source);

  const force2014 = DICTIONARY.source.is2014.includes(source.id);
  const force2024 = DICTIONARY.source.is2024.includes(source.id);
  const is2014 = force2014
    ? true
    : force2024
      ? false
      : Number.isInteger(source.id) && source.id < 145;

  return { source, is2014 };
}

DDBMonster.prototype._generateSource = function _generateSource(this: DDBMonster) {

  const { source, is2014 } = resolveMonsterSource(this.source);

  this.npc.system.source = source;
  foundry.utils.setProperty(this.npc, "flags.ddbimporter.sourceId", source.id);
  foundry.utils.setProperty(this.npc, "flags.ddbimporter.sourceCategory", source.sourceCategoryId);

  this.legacy = CONFIG.DDB.sources.some((ds) =>
    DICTIONARY.sourceCategories.legacy.includes(ds.sourceCategoryId),
  );
  this.is2014 = is2014;
  this.is2024 = !this.is2014;

  this.npc.system.source.rules = this.is2014 ? "2014" : "2024";

  this.use2024Spells = this.use2024Spells ?? this.is2024;
  const spells2014 = DICTIONARY.source.spellDescriptions2014.includes(source.id);
  const spells2024 = DICTIONARY.source.spellDescriptions2024.includes(source.id);
  const localSpellProcessing = spells2014
    ? false
    : spells2024
      ? true
      : this.is2024;
  this.useCastActivity = this.useCastActivity ?? localSpellProcessing;
};
