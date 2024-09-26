import DDBHelper from "../../lib/DDBHelper.js";
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

  DDBHelper._tweakSourceData(source);

  this.npc.system.details.source = source;
};
