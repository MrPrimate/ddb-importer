export const BAD_DIRS = ["[data]", "[data] ", "", null];

export function download(content, fileName, contentType) {
  var a = document.createElement("a");
  var file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

/**
 * Display information when Munching
 * @param {*} note
 * @param {*} nameField
 */
export function munchNote(note, nameField = false, monsterNote = false) {
  if (nameField) {
    $('#munching-task-name').text(note);
    $('#ddb-importer-monsters').css("height", "auto");
  } else if (monsterNote) {
    $('#munching-task-monster').text(note);
    $('#ddb-importer-monsters').css("height", "auto");
  } else {
    $('#munching-task-notes').text(note);
    $('#ddb-importer-monsters').css("height", "auto");
  }
}

export function getCampaignId() {
  const campaignId = game.settings.get("ddb-importer", "campaign-id").split('/').pop();

  if (campaignId && campaignId !== "" && !Number.isInteger(parseInt(campaignId))) {
    munchNote(`Campaign Id is invalid! ${campaignId}`, true);
    throw new Error(`Campaign Id is invalid! ${campaignId}`);
  } else if (campaignId.includes("join")) {
    munchNote(`Campaign URL is a join campaign link, please change it! ${campaignId}`, true);
    throw new Error(`Campaign URL is a join campaign link, please change it! ${campaignId}`);
  }
  return campaignId;
}

async function getPatreonTier() {
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const body = { betaKey: betaKey };

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/patreon/tier`, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body), // body data type must match "Content-Type" header
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) {
          munchNote(`API Failure: ${data.message}`);
          reject(data.message);
        }
        resolve(data.data);
      })
      .catch((error) => reject(error));
  });
}

export async function getPatreonValidity(betaKey) {
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const body = { betaKey: betaKey };

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/patreon/valid`, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body), // body data type must match "Content-Type" header
    })
      .then((response) => response.json())
      .then((data) => {
        resolve(data);
      })
      .catch((error) => reject(error));
  });
}

export function getPatreonTiers(tier) {
  const godTier = tier === "GOD";
  const undyingTier = tier === "UNDYING";
  const coffeeTier = tier === "COFFEE";

  const tiers = {
    god: godTier,
    undying: undyingTier,
    coffee: coffeeTier,
    source: godTier || undyingTier,
    homebrew: godTier || undyingTier,
    supporter: godTier || undyingTier || coffeeTier,
    not: !godTier && !undyingTier && !coffeeTier,
  };

  return tiers;
}

export async function setPatreonTier() {
  const tier = await getPatreonTier();
  game.settings.set("ddb-importer", "patreon-tier", tier);
}
