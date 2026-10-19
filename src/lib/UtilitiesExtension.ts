import logger from "./Logger";
import utils from "./Utils";
import { checkCobalt, getCobalt, setCobalt } from "./Secrets";

/**
 * Bridge to the DDBI Utilities browser extension, which can hand over the D&D Beyond
 * `CobaltSession` cookie from the browser the user is logged in with, and send requests from
 * D&D Beyond pages (such as a monster's biography) to this module.
 *
 * The extension injects a content script into Foundry sites the user has connected in its popup.
 * That script and this module talk with `window.postMessage` on this window only. The cookie is
 * sent only when this module asks for it; a login change on D&D Beyond is announced without it.
 *
 * Messages, all `{ source, type, ... }`:
 * - page -> extension: `ddbi-hello`, `ddbi-cobalt-request` (`requestId`),
 *   `ddbi-request-ack` and `ddbi-request-result` (`requestId`, `success`, `message`, optional `data`)
 * - extension -> page: `ddbi-ready` (`version`), `ddbi-cobalt` (`requestId`, `cobalt`),
 *   `ddbi-cobalt-changed`, `ddbi-request` (`requestId`, `request`, `payload`)
 */

const PAGE_SOURCE = "ddb-importer";
const EXTENSION_SOURCE = "ddbi-utilities-extension";
const REQUEST_TIMEOUT_MS = 5000;

type TCobaltExtensionPolicy = "ask" | "always" | "never";
type TExtensionRequestHandler = (payload: Record<string, unknown>) => Promise<{ success: boolean; message: string; data?: unknown }>;

const requestHandlers = new Map<string, TExtensionRequestHandler>();

const state = {
  listening: false,
  available: false,
  version: null as string | null,
  nextRequestId: 1,
  pending: new Map<number, (cobalt: string | null) => void>(),
  gmSyncRunning: false,
};

function post(type: string, data: Record<string, unknown> = {}) {
  window.postMessage({ source: PAGE_SOURCE, type, ...data }, window.location.origin);
}

function onMessage(event: MessageEvent) {
  if (event.source !== window || event.origin !== window.location.origin) return;
  const data = event.data as Record<string, unknown> | null;
  if (!data || typeof data !== "object" || data.source !== EXTENSION_SOURCE) return;

  switch (data.type) {
    case "ddbi-ready": {
      const firstContact = !state.available;
      state.available = true;
      state.version = typeof data.version === "string" ? data.version : null;
      if (firstContact) {
        logger.debug(`DDBI Utilities Extension ${state.version ?? ""} detected`);
        if (game.user.isGM) void syncGMCobalt();
      }
      break;
    }
    case "ddbi-cobalt": {
      const resolve = state.pending.get(Number(data.requestId));
      if (!resolve) return;
      state.pending.delete(Number(data.requestId));
      resolve(typeof data.cobalt === "string" && data.cobalt !== "" ? data.cobalt : null);
      break;
    }
    case "ddbi-cobalt-changed": {
      if (game.user.isGM) void syncGMCobalt();
      break;
    }
    case "ddbi-request": {
      void handleRequest(data);
      break;
    }
    // no default
  }
}

/**
 * Runs a request sent from a D&D Beyond page through the extension. The receipt is acknowledged
 * at once, so the extension knows this tab is handling it, and the outcome is posted when done.
 */
async function handleRequest(data: Record<string, unknown>) {
  const requestId = data.requestId;
  const handler = typeof data.request === "string" ? requestHandlers.get(data.request) : undefined;
  if (!handler) return;
  post("ddbi-request-ack", { requestId });
  let result: { success: boolean; message: string; data?: unknown };
  try {
    const payload = data.payload && typeof data.payload === "object" ? data.payload as Record<string, unknown> : {};
    result = await handler(payload);
  } catch (error) {
    logger.error(`DDBI Utilities Extension request "${data.request}" failed`, error);
    result = { success: false, message: error instanceof Error ? error.message : String(error) };
  }
  post("ddbi-request-result", { requestId, ...result });
}

/**
 * Registers the handler for a request type the extension can send from D&D Beyond pages.
 * @param request the request name, e.g. "ddb-import"
 * @param handler resolves with the outcome shown back on the D&D Beyond page
 */
export function registerExtensionRequestHandler(request: string, handler: TExtensionRequestHandler) {
  requestHandlers.set(request, handler);
}

/** Starts listening for the extension and announces the module to it. */
export function startCobaltExtensionBridge() {
  if (state.listening) return;
  state.listening = true;
  window.addEventListener("message", onMessage);
  post("ddbi-hello");
}

/** Whether the extension has answered on this page. */
export function isCobaltExtensionAvailable(): boolean {
  return state.available;
}

/**
 * Asks the extension for the cookie of the D&D Beyond login in this browser.
 * @returns the cookie, or null when the extension is missing, the user is logged out of D&D
 * Beyond, or there is no answer in time
 */
export function requestExtensionCobalt(): Promise<string | null> {
  if (!state.available) return Promise.resolve(null);
  const requestId = state.nextRequestId++;
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      state.pending.delete(requestId);
      resolve(null);
    }, REQUEST_TIMEOUT_MS);
    state.pending.set(requestId, (cobalt) => {
      clearTimeout(timeout);
      resolve(cobalt);
    });
    post("ddbi-cobalt-request", { requestId });
  });
}

function getPolicy(): TCobaltExtensionPolicy {
  const policy = utils.getSetting<string>("cobalt-extension");
  return policy === "always" || policy === "never" ? policy : "ask";
}

/**
 * Whether the user agrees to use the browser's D&D Beyond login. The first answer is stored in
 * the client setting; a refusal is respected except when the user asked for it explicitly.
 * @param explicit the user pressed a button asking for the extension's login
 */
async function confirmUse(explicit: boolean): Promise<boolean> {
  const policy = getPolicy();
  if (policy === "always") return true;
  if (policy === "never" && !explicit) return false;

  const accepted = await foundry.applications.api.DialogV2.confirm({
    window: { title: "Use your D&D Beyond login?" },
    content: `<p>The DDBI Utilities Extension can share the D&D Beyond login from this browser with DDB Importer, so you do not have to paste a Cobalt cookie.</p>
<p>Use it now and in future? You can change this in DDB Importer's module settings.</p>`,
    rejectClose: false,
  });
  await utils.setSetting("cobalt-extension", accepted ? "always" : "never");
  return Boolean(accepted);
}

/**
 * Keeps the GM's Cobalt cookie in step with the browser's D&D Beyond login: runs when the
 * extension is found and whenever it reports a login change.
 */
async function syncGMCobalt() {
  if (state.gmSyncRunning || getPolicy() === "never") return;
  state.gmSyncRunning = true;
  try {
    const cobalt = await requestExtensionCobalt();
    if (!cobalt || cobalt === getCobalt()) return;
    const check = await checkCobalt("", cobalt);
    if (!check.success) {
      logger.debug("Ignoring the extension's D&D Beyond cookie, D&D Beyond rejected it", check);
      return;
    }
    if (!(await confirmUse(false))) return;
    await setCobalt(cobalt);
    ui.notifications.info("DDB Importer is now using the D&D Beyond login from this browser.");
  } catch (error) {
    logger.error("Unable to update the Cobalt cookie from the DDBI Utilities Extension", error);
  } finally {
    state.gmSyncRunning = false;
  }
}

/**
 * Saves the browser's D&D Beyond login as this character's local Cobalt cookie (the
 * player-side path). Shows a notification for every outcome.
 * @param actorId the character the cookie is for
 * @param explicit the user pressed a button asking for it
 * @returns whether a working cookie was saved
 */
export async function useExtensionCobaltForCharacter(actorId: string, explicit: boolean): Promise<boolean> {
  if (!state.available) {
    if (explicit) ui.notifications.warn("The DDBI Utilities Extension was not found. Install it and connect this Foundry site in its toolbar popup.");
    return false;
  }
  if (getPolicy() === "never" && !explicit) return false;

  const cobalt = await requestExtensionCobalt();
  if (!cobalt) {
    if (explicit) ui.notifications.warn("No D&D Beyond login found in this browser. Log in at dndbeyond.com and try again.");
    return false;
  }
  const check = await checkCobalt(actorId, cobalt);
  if (!check.success) {
    ui.notifications.error(`D&D Beyond did not accept the login from this browser: ${check.message}`);
    return false;
  }
  if (!(await confirmUse(explicit))) return false;
  await setCobalt(cobalt, actorId);
  ui.notifications.info("Saved the D&D Beyond login from this browser for this character.");
  return true;
}
