export function parseSocketUrl(proxyUrl: string, nsp: string): { url: string; path: string | undefined } {
  try {
    const { origin, pathname } = new URL(proxyUrl);
    const prefix = pathname.replace(/\/$/, "");
    if (prefix) {
      return { url: origin + nsp, path: prefix + "/socket.io" };
    }
  } catch { /* ignore - not a valid URL */ }
  return { url: proxyUrl + nsp, path: undefined };
}
