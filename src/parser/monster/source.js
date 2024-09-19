import DDBHelper from "../../lib/DDBHelper.js";
import DDBMonster from "../DDBMonster.js";

DDBMonster.prototype._generateSource = function _generateSource() {
  const sourceObject = CONFIG.DDB.sources.find((cnf) => cnf.id == this.source.sourceId);
  const book = (sourceObject)
    ? sourceObject.name
    : "Homebrew";

  this.npc.system.details.source = DDBHelper._tweakSourceData({
    book,
    page: this.source.sourcePageNumber,
    custom: "",
    license: "",
  });
};
