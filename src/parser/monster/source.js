import DDBMonster from "../DDBMonster.js";

DDBMonster.prototype._generateSource = function _generateSource() {
  const sourceObject = CONFIG.DDB.sources.find((cnf) => cnf.id == this.source.sourceId);
  const sourceBook = (sourceObject)
    ? sourceObject.name
    : "Homebrew";
  this.npc.system.details.source = {
    book: sourceBook,
    page: this.source.sourcePageNumber,
    custom: "",
    license: "",
  };
};
