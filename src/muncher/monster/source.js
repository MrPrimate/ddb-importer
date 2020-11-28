export function getSource(monster, DDB_CONFIG) {
  const sourceObject = DDB_CONFIG.sources.find((cnf) => cnf.id == monster.sourceId);
  const sourceBook = (sourceObject) ? sourceObject.description : "Homebrew";
  const page = (monster.sourcePageNumber) ? ` pg ${monster.sourcePageNumber}` : "";
  const source = `${sourceBook}${page}`;
  return source;
}
