import DDBMonster from "./DDBMonster.js";

DDBMonster.prototype._generateSource = function _generateSource() {
  const fullSource = game.settings.get("ddb-importer", "use-full-source");
  const sourceObject = CONFIG.DDB.sources.find((cnf) => cnf.id == this.source.sourceId);
  const sourceBook = (sourceObject)
    ? (fullSource) ? sourceObject.description : sourceObject.name
    : "Homebrew";
  const page = (this.source.sourcePageNumber) ? ` pg ${this.source.sourcePageNumber}` : "";
  this.npc.system.details.source = `${sourceBook}${page}`;
};
