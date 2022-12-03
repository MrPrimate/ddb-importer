export function getSource(monster) {
  const fullSource = game.settings.get("ddb-importer", "use-full-source");
  const sourceObject = CONFIG.DDB.sources.find((cnf) => cnf.id == monster.sourceId);
  const sourceBook = (sourceObject)
    ? (fullSource) ? sourceObject.description : sourceObject.name
    : "Homebrew";
  const page = (monster.sourcePageNumber) ? ` pg ${monster.sourcePageNumber}` : "";
  const source = `${sourceBook}${page}`;
  return source;
}
