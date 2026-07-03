import logger from "./Logger";

/**
 * Error thrown when a fetch returns a non-2xx HTTP status. Carries the status
 * and any response body text so callers can log or surface useful detail.
 */
export class FetchError extends Error {
  status: number;

  url: string;

  body: string;

  constructor(url: string, status: number, statusText: string, body = "") {
    super(`Request to ${url} failed with HTTP ${status} ${statusText}`);
    this.name = "FetchError";
    this.url = url;
    this.status = status;
    this.body = body;
  }
}

/**
 * Fetch a URL and parse the response as JSON, throwing a FetchError on any
 * non-2xx HTTP status instead of attempting to parse an error page.
 */
export async function fetchJson<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    let body = "";
    try {
      body = await response.text();
    } catch (_err) {
      // response body unreadable, throw with what we have
    }
    logger.error(`Request to ${url} failed with HTTP ${response.status} ${response.statusText}`, { body });
    throw new FetchError(url, response.status, response.statusText, body);
  }
  return response.json() as Promise<T>;
}

/**
 * POST a JSON body to a URL and parse the JSON response, with the same
 * non-2xx handling as fetchJson.
 */
export async function postJson<T = any>(url: string, body: unknown, options: RequestInit = {}): Promise<T> {
  return fetchJson<T>(url, {
    method: "POST",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    ...options,
  });
}
