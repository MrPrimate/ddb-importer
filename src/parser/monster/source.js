import { DDBSources } from "../../lib/_module.mjs";
import DDBMonster from "../DDBMonster.js";

DDBMonster.prototype._generateSource = function _generateSource() {
  const ddbSource = CONFIG.DDB.sources.find((cnf) => cnf.id == this.source.sourceId);

  const source = {
    book: ddbSource ? ddbSource.name : "Homebrew",
    page: this.source.sourcePageNumber ?? "",
    custom: "",
    license: "",
    id: ddbSource ? ddbSource.id : 9999999,
  };

  DDBSources.tweakSourceData(source);

  this.npc.system.details.source = source;
};
