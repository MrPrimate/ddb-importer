import { setMockSettings } from "../_setup/foundryMocks";
import DDBStickers from "../../src/muncher/DDBStickers";

function mockFetchJson(payload: unknown, ok = true, status = 200): void {
  vi.stubGlobal("fetch", vi.fn(async () => ({
    ok,
    status,
    statusText: "",
    headers: { get: () => "application/json" },
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  })));
}

beforeEach(() => {
  (CONFIG as any).DDBI.DEV = { enabled: false };
  setMockSettings({
    "custom-proxy": false,
    "beta-key": "a-key",
    "ddb-maps-campaign-id": "12345",
    "cobalt-cookie": "",
    "cobalt-cookie-local": false,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DDBStickers.fetchAll", () => {

  it("returns the payload on success", async () => {
    mockFetchJson({ success: true, message: "ok", data: { stickers: [] } });

    await expect(DDBStickers.fetchAll()).resolves.toEqual({ stickers: [] });
  });

  it("returns null rather than throwing when no campaign is selected", async () => {
    setMockSettings({ "ddb-maps-campaign-id": "" });
    mockFetchJson({ success: true, message: "ok", data: { stickers: [] } });

    await expect(DDBStickers.fetchAll()).resolves.toBeNull();
  });
});

describe("DDBStickers.downloadImage", () => {

  it("returns null rather than throwing when no key is supplied", async () => {
    mockFetchJson({ success: true, message: "ok" });

    await expect(DDBStickers.downloadImage({ key: "" })).resolves.toBeNull();
  });
});
