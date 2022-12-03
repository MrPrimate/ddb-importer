import { DDBMuncher } from "../muncher/ddb.js";
import SETTINGS from "../settings.js";
import DDBProxy from "./DDBProxy.js";

const PatreonHelper = {

  getPatreonTier: async () => {
    if (DDBProxy.isCustom()) return { success: true, message: "custom proxy", data: "CUSTOM" };
    const key = game.settings.get(SETTINGS.MODULE_ID, "beta-key");
    const parsingApi = DDBProxy.getProxy();
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
            DDBMuncher.munchNote(`API Failure: ${data.message}`);
            reject(data.message);
          }
          let currentEmail = game.settings.get(SETTINGS.MODULE_ID, "patreon-user");
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
    if (DDBProxy.isCustom()) return { success: true, message: "custom proxy", data: true };
    const parsingApi = DDBProxy.getProxy();
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
    const custom = tier === "CUSTOM" || DDBProxy.isCustom();

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
    game.settings.set(SETTINGS.MODULE_ID, "patreon-tier", tier);
  },

};

export default PatreonHelper;
