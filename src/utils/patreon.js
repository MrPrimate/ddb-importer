import { munchNote } from "../muncher/ddb.js";

const PatreonHelper = {

  getPatreonTier: async () => {
    const customProxy = game.settings.get("ddb-importer", "custom-proxy");
    if (customProxy) return { success: true, message: "custom proxy", data: "CUSTOM" };
    const key = game.settings.get("ddb-importer", "beta-key");
    const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
    const body = { betaKey: key };

    return new Promise((resolve, reject) => {
      fetch(`${parsingApi}/patreon/tier`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then((data) => {
          if (!data.success) {
            munchNote(`API Failure: ${data.message}`);
            reject(data.message);
          }
          let currentEmail = game.settings.get("ddb-importer", "patreon-user");
          if (data.email !== currentEmail) {
            game.settings.set("ddb-importer", "patreon-user", data.email).then(() => {
              resolve(data.data);
            });
          } else {
            resolve(data.data);
          }
        })
        .catch((error) => reject(error));
    });
  },

  getPatreonValidity: async (betaKey) => {
    const customProxy = game.settings.get("ddb-importer", "custom-proxy");
    if (customProxy) return { success: true, message: "custom proxy", data: true };
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
  },

  getPatreonTiers: (tier) => {
    const godTier = tier === "GOD";
    const undyingTier = tier === "UNDYING";
    const coffeeTier = tier === "COFFEE";
    const customProxy = game.settings.get("ddb-importer", "custom-proxy");
    const custom = tier === "CUSTOM" || customProxy;

    const tiers = {
      god: godTier,
      undying: undyingTier,
      custom: custom,
      coffee: coffeeTier,
      source: godTier || undyingTier || coffeeTier || custom,
      experimentalMid: godTier || undyingTier,
      homebrew: godTier || undyingTier || coffeeTier || custom,
      all: godTier || undyingTier || coffeeTier || custom,
      supporter: godTier || undyingTier || coffeeTier,
      not: !godTier && !undyingTier && !coffeeTier && !custom,
    };

    return tiers;
  },

  checkPatreon: async () => {
    const tier = await PatreonHelper.getPatreonTier();
    const tiers = PatreonHelper.getPatreonTiers(tier);
    return tiers;
  },

  setPatreonTier: async () => {
    const tier = await PatreonHelper.getPatreonTier();
    game.settings.set("ddb-importer", "patreon-tier", tier);
  },

};

export default PatreonHelper;
