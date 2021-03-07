export function getCobalt() {
  let cobalt;
  const localCookie = game.settings.get("ddb-importer", "cobalt-cookie-local");

  if (localCookie) {
    cobalt = localStorage.getItem('ddb-cobalt-cookie');
  } else {
    cobalt = game.settings.get("ddb-importer", "cobalt-cookie");
  }

  return cobalt;
}

export async function setCobalt(value) {
  const localCookie = game.settings.get("ddb-importer", "cobalt-cookie-local");

  if (localCookie) {
    localStorage.setItem('ddb-cobalt-cookie', value);
  } else {
    await game.settings.set("ddb-importer", "cobalt-cookie", value);
  }

}

export async function moveCobaltToLocal() {
  localStorage.setItem('ddb-cobalt-cookie', game.settings.get("ddb-importer", "cobalt-cookie"));
  await game.settings.set("ddb-importer", "cobalt-cookie", "");
  game.settings.set("ddb-importer", "cobalt-cookie-local", true);
}
