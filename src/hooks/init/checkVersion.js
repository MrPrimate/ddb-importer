import utils from "../../utils.js";

const getLatestVersion = async (manifestUrl) => {
  return new Promise((resolve, reject) => {
    fetch(manifestUrl, {
      method: "GET",
      mode: "no-cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    })
      .then((response) => response.json())
      .then((json) => resolve(json.version))
      .catch((error) => reject(error));
  });
};

export default async () => {
  // check version number only for GMs
  if (!game.user.isGM) return;

  const moduleInfo = game.modules.get("ddb-importer").data;
  const installedVersion = moduleInfo.version;
  try {
    const latestVersion = await getLatestVersion(moduleInfo.manifest);
    if (utils.versionCompare(latestVersion, installedVersion) === 1) {
      let text = $(
        "<h2>Please Update</h2><p>A new <b>ddb-importer</b> version is available. Please update to <b>v" +
          latestVersion +
          "</b> if you are experiencing issues and before reporting a bug.</p>"
      );
      window.ddbimporter.notification.show(text, null);
    }
  } catch (error) {
    window.ddbimporter.notification.show("Could not retrieve latest ddb-importer version");
  }
};
