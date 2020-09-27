import utils from "./utils.js";

export default async () => {
  let hasShownPopup =
    utils.versionCompare(
      game.modules.get("ddb-importer").data.version,
      game.settings.get("ddb-importer", "popup-version")
    ) !== 1;
  if (hasShownPopup) {
    return true;
  }

  // display the popup for this release
  let result = await window.ddbimporter.hint.show(
    `<h1>DDB Importer v${game.modules.get("ddb-importer").data.version}</h1>
    <h2>Character Import</h2>
    <p>Please note that the <b>character import is now working differently</b> by using a more user-friendly workflow, you can find the updated instructions found in the <b>character import window</b> accessible by the [B] button on an player's character sheet.</p>
    <p>We <b>don't know if that workflow is reliably working</b> or if D&amp;D Beyond is <b>flagging us as a bot</b> in the future, rendering this possibility unusable. By this release, we are using the new mechanism the first time at scale (there are roughly 3.000 character imports <b>per day</b>),
    so we will either see a reaction rather quickly or none at all. <b>Let 's find out!</b></p>
    <p>Expect the new feature to be a bit bumpy. Please report any errors regarding this feature here: <a href="https://discord.gg/2CDbRCP">on the #dndbeyond-v3-feedback channel</a>.</p>
    <hr />
       `,
    {
      element: null,
      align: "CENTER",
      hide: {
        selector: '#sidebar-tabs a[data-tab="compendium"]',
        event: "click",
      },
      buttons: ["Dismiss until updated", "Close"],
      width: window.innerWidth / 2,
    }
  );

  if (result !== "Close") {
    // set the version number for the popup to be shown to this version
    game.settings.set("ddb-importer", "popup-version", game.modules.get("ddb-importer").data.version);
  }
  return result;
};
