import { logger, utils, DDBProxy } from "./_module.mjs";
import { SETTINGS } from "../config/_module.mjs";
import DDBKeyChangeDialog from "../apps/DDBKeyChangeDialog.js";

async function setLocalStorage(key, value) {
  // remove item if null or undefined
  if (value === null || value === undefined) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, value);
  }
}


const PatreonHelper = {

  isValidKey: async(local = false, setKey = true, overrideKey = null) => {
    let validKey = false;

    const key = overrideKey ?? PatreonHelper.getPatreonKey(local);
    // console.warn("Checking key validity", { key, local, overrideKey });
    if (key === "") {
      validKey = true;
    } else {
      const check = await PatreonHelper.getPatreonValidity(key);
      if (check.success && check.data) {
        validKey = true;
      } else {
        validKey = false;
        if (setKey) {
          new DDBKeyChangeDialog({
            callMuncher: !local,
            local,
          }).render(true);
        }
      }
    }
    return validKey;
  },

  getPatreonKey: (local = false) => {
    if (local) {
      return localStorage.getItem("ddb-patreon-key");
    } else {
      return game.settings.get(SETTINGS.MODULE_ID, "beta-key");
    }
  },

  setPatreonKey: async (key, local = false) => {
    if (local) {
      setLocalStorage("ddb-patreon-key", key);
    } else {
      await game.settings.set(SETTINGS.MODULE_ID, "beta-key", key);
    }
  },

  getPatreonUser: (local = false) => {
    if (local) {
      return localStorage.getItem("ddb-patreon-user");
    } else {
      return game.settings.get(SETTINGS.MODULE_ID, "patreon-user");
    }
  },

  setPatreonUser: async (user, local = false) => {
    if (local) {
      setLocalStorage("ddb-patreon-user", user);
    } else {
      await game.settings.set(SETTINGS.MODULE_ID, "patreon-user", user);
    }
  },

  getPatreonTier: (local = false) => {
    if (DDBProxy.isCustom(true)) return "CUSTOM";
    if (local) {
      return localStorage.getItem("ddb-patreon-tier");
    } else {
      return game.settings.get(SETTINGS.MODULE_ID, "patreon-tier");
    }
  },

  setPatreonTier: async (local = false) => {
    const tier = await PatreonHelper.fetchPatreonTier(local);
    if (local) {
      setLocalStorage("ddb-patreon-tier", tier.data);
    } else {
      await game.settings.set(SETTINGS.MODULE_ID, "patreon-tier", tier.data);
    }
  },

  fetchPatreonTier: async (local = false, overrideKey = null) => {
    if (DDBProxy.isCustom(true)) return { success: true, message: "custom proxy", data: "CUSTOM" };
    const key = overrideKey ?? PatreonHelper.getPatreonKey(local);
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
            utils.munchNote(`API Failure: ${data.message}`);
            reject(data.message);
          }
          let currentEmail = PatreonHelper.getPatreonUser(local);
          logger.debug("Fetched Patreon tier information", {
            user: data.email,
            tier: data.data,
            data,
          });
          if (data.email !== currentEmail) {
            PatreonHelper.setPatreonUser(data.email, local).then(() => {
              resolve(data);
            });
          } else {
            resolve(data);
          }
        })
        .catch((error) => reject(error));
    });
  },

  getPatreonValidity: async (betaKey) => {
    if (DDBProxy.isCustom(true)) return { success: true, message: "custom proxy", data: true };
    const parsingApi = DDBProxy.getProxy();
    const body = { betaKey: betaKey };

    // console.warn("Validating key", { betaKey, parsingApi });

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

  calculateAccessMatrix: (tier) => {
    const godTier = tier === "GOD";
    const undyingTier = tier === "UNDYING";
    const coffeeTier = tier === "COFFEE";
    const custom = tier === "CUSTOM" || DDBProxy.isCustom();
    const devCustom = DDBProxy.isCustom(true);

    const tiers = {
      god: godTier,
      undying: undyingTier,
      custom: custom,
      coffee: coffeeTier,
      source: godTier || undyingTier || coffeeTier || custom,
      experimentalMid: godTier || undyingTier,
      homebrew: godTier || undyingTier || coffeeTier || custom,
      all: godTier || undyingTier || coffeeTier || custom,
      supporter: custom && devCustom ? false : (godTier || undyingTier || coffeeTier),
      not: !godTier && !undyingTier && !coffeeTier && !custom,
    };

    return tiers;
  },

  checkPatreon: async (local = false, overrideKey = null) => {
    const tier = await PatreonHelper.fetchPatreonTier(local, overrideKey);
    const matrix = PatreonHelper.calculateAccessMatrix(tier.data);
    return matrix;
  },

  linkToPatreon: async (callback) => {

    const proxy = DDBProxy.getProxy();
    const patreonId = "oXQUxnRAbV6mq2DXlsXY2uDYQpU-Ea2ds0G_5hIdi0Bou33ZRJgvV8Ub3zsEQcHp";
    const patreonAuthUrl = `${proxy}/patreon/auth`;
    const patreonScopes = encodeURI("identity identity[email]");

    const socketOptions = {
      transports: ['websocket', 'polling', 'flashsocket'],
      // reconnection: false,
      // reconnectionAttempts: 10,
    };
    const socket = io(`${proxy}/`, socketOptions);

    socket.on("connect", () => {
      logger.debug("DDB Muncher socketID", socket.id);
      const serverDetails = {
        id: socket.id,
        world: game.world.title,
        userId: game.userId,
      };
      socket.emit("register", serverDetails);

    });

    socket.on('registered', (data) => {
      logger.info(`Foundry instance registered with DDB Muncher Proxy`);
      logger.debug(data);
      utils.renderPopup("web", `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${patreonId}&redirect_uri=${patreonAuthUrl}&state=${data.userHash}&scope=${patreonScopes}`);
    });

    socket.on('auth', async (data) => {
      logger.debug(`Response from auth socket!`, data);

      CONFIG.DDBI.POPUPS["web"].close();

      socket.disconnect();

      if (callback) {
        return callback(data);
      } else {
        return true;
      }
    });

    socket.on('error', (data) => {
      logger.error(`Error Response from socket!`, data);
      socket.disconnect();
    });
  },

};

export default PatreonHelper;
