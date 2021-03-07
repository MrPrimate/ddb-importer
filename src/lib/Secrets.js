export function getCobalt() {
  let cobalt = game.settings.get("ddb-importer", "cobalt-cookie");
  return cobalt;
}

export async function setCobalt(value) {
  await game.settings.set("ddb-importer", "cobalt-cookie", value);
}
