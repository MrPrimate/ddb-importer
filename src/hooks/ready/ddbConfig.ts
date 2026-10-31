import { logger, FileHelper, DDBProxy, fetchJson, utils } from "../../lib/_module";
import addDDBConfig from "./addDDBConfig";

// Loaded from data/fallback-config.json at ready; used when the remote config
// fetch fails. Null until fetchFallbackData resolves, or if that fetch failed.
let fallbackDDBConfig: IDDBConfig | null = null;

async function loadDataJson<T>(fileName: string): Promise<T> {
  const url = await FileHelper.getFileUrl("[data] modules/ddb-importer/data", fileName);
  const data = await foundry.utils.fetchJsonWithTimeout(url);
  return data as T;
}

async function fetchFallbackData(): Promise<{ config: IDDBConfig; rules: IDDBRuleData } | null> {
  try {
    const [config, rules] = await Promise.all([
      loadDataJson<IDDBConfig>("fallback-config.json"),
      loadDataJson<IDDBRuleData>("fallback-rules.json"),
    ]);
    return { config, rules };
  } catch (err) {
    logger.error("Failed to load fallback DDB config/rules JSON assets. The module data folder may be missing or corrupt.", err);
    return null;
  }
}

/**
 * A config is usable when it carries the source list; the muncher, source pickers and parsers all
 * read CONFIG.DDB.sources without a guard.
 */
function isUsableConfig(config: unknown): config is IDDBConfig {
  return Array.isArray((config as IDDBConfig | null | undefined)?.sources);
}

export function hasDDBConfig(): boolean {
  return isUsableConfig(foundry.utils.getProperty(CONFIG, "DDB"));
}

/**
 * Load the committed fallback config into fallbackDDBConfig, retrying the fetch when an earlier
 * attempt failed. Returns whether a usable fallback is held.
 */
async function loadFallbackConfig(): Promise<boolean> {
  if (fallbackDDBConfig) return true;
  const fallback = await fetchFallbackData();
  if (!fallback || !isUsableConfig(fallback.config)) return false;
  fallbackDDBConfig = fallback.config;
  foundry.utils.setProperty(fallbackDDBConfig, "RULE_DATA", fallback.rules);
  return true;
}

function applyFallbackConfig() {
  // a live config already in place beats the committed snapshot
  if (hasDDBConfig()) return;
  if (fallbackDDBConfig) {
    foundry.utils.setProperty(CONFIG, "DDB", fallbackDDBConfig);
    logger.warn("Failed to load DDB config, using fallback.");
  } else {
    logger.error("Failed to load DDB config and no fallback config is available.");
  }
}

async function directConfig() {
  $.getJSON("https://www.dndbeyond.com/api/config/json")
    .then((config) => {
      if (isUsableConfig(config)) {
        foundry.utils.setProperty(CONFIG, "DDB", config);
        logger.info("Loaded DDB live config");
      }
      return config;
    })
    .catch((err) => {
      logger.warn("Failed to load DDB config, caught error using fallback.", err);
      return err;
    })
    .always(() => {
      if (!CONFIG.DDB?.sources) {
        applyFallbackConfig();
      } else {
        logger.info("A DDB config was loaded");
      }
      logger.debug("DDB_CONFIG", CONFIG.DDB);
    });
}

async function proxyConfig() {
  const parsingApi = DDBProxy.getProxy();
  const debugJson = utils.getSetting<boolean>("debug-json");

  const url = `${parsingApi}/proxy/api/config/json`;
  let data: { success?: boolean; message?: string; data?: unknown };
  try {
    data = await fetchJson(url, {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    logger.error("Unable to reach the DDB Importer proxy for the DDB config", err);
    applyFallbackConfig();
    return null;
  }
  if (debugJson) {
    FileHelper.download(JSON.stringify(data), `config-raw.json`, "application/json");
  }
  if (!data?.success || !isUsableConfig(data.data)) {
    logger.error(`API Failure loading DDB config: ${data?.message ?? "no usable config returned"}`);
    applyFallbackConfig();
    logger.debug("DDB_CONFIG", CONFIG.DDB);
    return null;
  }
  logger.info(`Retrieved DDB CONFIG DATA via proxy`);
  foundry.utils.setProperty(CONFIG, "DDB", data.data);
  logger.debug("DDB_CONFIG", CONFIG.DDB);
  return data.data;
}

export async function loadDDBConfig() {
  if (hasDDBConfig()) return;
  if (await loadFallbackConfig()) {
    foundry.utils.setProperty(CONFIG, "DDB", fallbackDDBConfig);
  }
  if (foundry.utils.getProperty(CONFIG, "DEBUG.DDBI.DIRECT_CONFIG")) {
    if ((/electron/i).test(navigator.userAgent)) {
      logger.info("Electron detected using DDB Config stub");
    } else {
      logger.info("Loaded default DDB config, checking for live config access.");
      directConfig().then(() => {
        if (hasDDBConfig()) addDDBConfig();
      });
    }
  } else {
    proxyConfig().then(() => {
      if (hasDDBConfig()) addDDBConfig();
    });
  }
}

/**
 * Make sure CONFIG.DDB holds a usable config before something reads it. The ready hook normally
 * loads it, but that load can be missed (an earlier ready step threw) or come back empty (the
 * fallback JSON and the proxy both unreachable). Waits for the proxy here rather than racing it.
 * Returns whether a usable config is in place.
 */
export async function ensureDDBConfig(): Promise<boolean> {
  if (hasDDBConfig()) return true;
  logger.warn("DDB config missing when needed, loading it now.");
  await loadFallbackConfig();
  await proxyConfig();
  if (!hasDDBConfig()) return false;
  await addDDBConfig();
  return true;
}
