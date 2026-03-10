import { logger, utils, DDBProxy } from "./_module";
import { SETTINGS } from "../config/_module";
import DDBKeyChangeDialog from "../apps/DDBKeyChangeDialog";

interface IPatreonTierResponse  {
  "success": boolean;
  "message": string;
  "data": string;
}

interface IPatreonValidityResponse {
  "success": boolean;
  "message": string;
  "data": boolean;
}

export interface IPatreonLinkResponse {
  key: string;
  tier: string;
  email: string;
}

async function setLocalStorage(key: string, value: string | null): Promise<void> {
  // remove item if null or undefined
  if (value === null || value === undefined) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, value);
  }
}


const PatreonHelper = {

  isValidKey: async(local = false, setKey = true, overrideKey = null) => {
    // eslint-disable-next-line no-useless-assignment
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

  getPatreonKey: (local = false): string => {
    if (local) {
      return localStorage.getItem("ddb-patreon-key");
    } else {
      return utils.getSetting<string>("beta-key");
    }
  },

  setPatreonKey: async (key: string, local = false) => {
    if (local) {
      setLocalStorage("ddb-patreon-key", key);
    } else {
      await game.settings.set(SETTINGS.MODULE_ID, "beta-key", key);
    }
  },

  getPatreonUser: (local = false): string => {
    if (local) {
      return localStorage.getItem("ddb-patreon-user");
    } else {
      return utils.getSetting<string>("patreon-user");
    }
  },

  setPatreonUser: async (user: string, local = false) => {
    if (local) {
      setLocalStorage("ddb-patreon-user", user);
    } else {
      await game.settings.set(SETTINGS.MODULE_ID, "patreon-user", user);
    }
  },

  getPatreonTier: (local = false): string => {
    if (DDBProxy.isCustom(true)) return "CUSTOM";
    if (local) {
      return localStorage.getItem("ddb-patreon-tier");
    } else {
      return utils.getSetting<string>("patreon-tier");
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

  fetchPatreonTier: async (local = false, overrideKey = null): Promise<IPatreonTierResponse> => {
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
          const currentEmail = PatreonHelper.getPatreonUser(local);
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

  getPatreonValidity: async (betaKey: string): Promise<IPatreonValidityResponse> => {
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
        .then((data: IPatreonValidityResponse) => {
          resolve(data);
        })
        .catch((error) => reject(error));
    });
  },

  calculateAccessMatrix: (tier: string): IPatreonAccessMatrix => {
    const godTier = tier === "GOD";
    const undyingTier = tier === "UNDYING";
    const coffeeTier = tier === "COFFEE";
    const custom = tier === "CUSTOM" || DDBProxy.isCustom();
    const devCustom = DDBProxy.isCustom(true);

    const tiers: IPatreonAccessMatrix = {
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

  checkPatreon: async (local = false, overrideKey = null): Promise<IPatreonAccessMatrix> => {
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
      transports: ["websocket", "polling", "flashsocket"],
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

    socket.on("registered", (data) => {
      logger.info(`Foundry instance registered with DDB Muncher Proxy`);
      logger.debug(data);
      utils.renderPopup("web", `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${patreonId}&redirect_uri=${patreonAuthUrl}&state=${data.userHash}&scope=${patreonScopes}`);
    });

    socket.on("auth", async (data: IPatreonLinkResponse) => {
      logger.debug(`Response from auth socket!`, data);

      CONFIG.DDBI.POPUPS["web"].close();

      socket.disconnect();

      if (callback) {
        return callback(data);
      } else {
        return true;
      }
    });

    socket.on("error", (data) => {
      logger.error(`Error Response from socket!`, data);
      socket.disconnect();
    });
  },

};

export default PatreonHelper;
