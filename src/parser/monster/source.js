import { DICTIONARY } from "../../config/_module.mjs";
import { DDBSources } from "../../lib/_module.mjs";
import DDBMonster from "../DDBMonster.js";

DDBMonster.prototype._generateSource = function _generateSource() {

  let ddbSource = CONFIG.DDB.sources.find((cnf) => cnf.id == this.source.sourceId);
  const ddbSources = (this.source.sources ?? []).filter((s) => s.sourceType === 1);
  if (this.source.sources && ddbSources.length > 1) {
    const highestSource = ddbSources.reduce((prev, current) => {
      return prev.sourceId > current.sourceId ? prev : current;
    });
    ddbSource = CONFIG.DDB.sources.find((cnf) => cnf.id == highestSource.sourceId);
  }

  const source = {
    book: ddbSource ? ddbSource.name : "Homebrew",
    page: this.source.sourcePageNumber ?? "",
    custom: "",
    license: "",
    id: ddbSource ? ddbSource.id : 9999999,
    sourceCategoryId: ddbSource ? ddbSource.sourceCategoryId : 9999999,
  };

  DDBSources.tweakSourceData(source);

  this.npc.system.source = source;
  foundry.utils.setProperty(this.npc, "flags.ddbimporter.sourceId", source.id);
  foundry.utils.setProperty(this.npc, "flags.ddbimporter.sourceCategory", source.sourceCategoryId);

  this.legacy = CONFIG.DDB.sources.some((ds) =>
    DICTIONARY.sourceCategories.legacy.includes(ds.sourceCategoryId),
  );
  this.is2014 = Number.isInteger(source.id) && source.id < 145;
  this.is2024 = !this.is2014;

  this.npc.system.source.rules = this.is2014 ? "2014" : "2024";
};
