import { setMockSettings } from "../_setup/foundryMocks";
import PatreonHelper from "../../src/lib/PatreonHelper";

// The mock game.settings.get returns the truthy string "OFF" for unset keys, so
// "custom-proxy" has to be pinned to false or getPatreonTier short-circuits to
// the CUSTOM tier for every case below.
function useTier(tier: string): void {
  setMockSettings({ "custom-proxy": false, "patreon-tier": tier, "beta-key": "a-key" });
}

function fakeLocalStorage(): Map<string, string> {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => (store.has(key) ? store.get(key) : null),
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  };
  return store;
}

beforeEach(() => {
  (CONFIG as any).DDBI.PATREON = { tier: null, tierLocal: null, tiers: null, tiersLocal: null };
  (CONFIG as any).DDBI.DEV = { enabled: false };
});

describe("PatreonHelper.getAccessMatrix", () => {
  it("grants experimentalMid to GOD", () => {
    useTier("GOD");
    const tiers = PatreonHelper.getAccessMatrix();
    expect(tiers.experimentalMid).toBe(true);
    expect(tiers.not).toBe(false);
  });

  it("grants experimentalMid to UNDYING", () => {
    useTier("UNDYING");
    expect(PatreonHelper.getAccessMatrix().experimentalMid).toBe(true);
  });

  it("withholds experimentalMid from COFFEE", () => {
    useTier("COFFEE");
    const tiers = PatreonHelper.getAccessMatrix();
    expect(tiers.experimentalMid).toBe(false);
    expect(tiers.all).toBe(true);
  });

  it("withholds everything from an empty tier", () => {
    useTier("");
    const tiers = PatreonHelper.getAccessMatrix();
    expect(tiers.experimentalMid).toBe(false);
    expect(tiers.not).toBe(true);
  });

  it("treats a null cached tier as no access rather than throwing", () => {
    setMockSettings({ "custom-proxy": false, "patreon-tier": null });
    const tiers = PatreonHelper.getAccessMatrix();
    expect(tiers.experimentalMid).toBe(false);
    expect(tiers.not).toBe(true);
  });
});

describe("PatreonHelper.clearPatreonStatus", () => {
  it("clears the world key, user, tier and the in-memory matrix", async () => {
    useTier("GOD");
    (CONFIG as any).DDBI.PATREON.tier = "GOD";
    (CONFIG as any).DDBI.PATREON.tiers = PatreonHelper.getAccessMatrix();
    const setSpy = vi.spyOn(game.settings, "set").mockResolvedValue(undefined as any);

    await PatreonHelper.clearPatreonStatus();

    expect(setSpy).toHaveBeenCalledWith("ddb-importer", "beta-key", "");
    expect(setSpy).toHaveBeenCalledWith("ddb-importer", "patreon-user", "");
    expect(setSpy).toHaveBeenCalledWith("ddb-importer", "patreon-tier", "");
    expect((CONFIG as any).DDBI.PATREON.tier).toBeNull();
    expect((CONFIG as any).DDBI.PATREON.tiers).toBeNull();
    setSpy.mockRestore();
  });

  it("clears the local storage key, user and tier", async () => {
    setMockSettings({ "custom-proxy": false });
    const store = fakeLocalStorage();
    store.set("ddb-patreon-key", "a-key");
    store.set("ddb-patreon-user", "someone@example.com");
    store.set("ddb-patreon-tier", "GOD");
    (CONFIG as any).DDBI.PATREON.tierLocal = "GOD";
    (CONFIG as any).DDBI.PATREON.tiersLocal = PatreonHelper.calculateAccessMatrix("GOD");

    await PatreonHelper.clearPatreonStatus(true);

    expect(store.has("ddb-patreon-key")).toBe(false);
    expect(store.get("ddb-patreon-user")).toBe("");
    expect(store.has("ddb-patreon-tier")).toBe(false);
    expect((CONFIG as any).DDBI.PATREON.tierLocal).toBeNull();
    expect((CONFIG as any).DDBI.PATREON.tiersLocal).toBeNull();
  });

  it("leaves the cleared local tier reporting no access", async () => {
    setMockSettings({ "custom-proxy": false });
    fakeLocalStorage().set("ddb-patreon-tier", "UNDYING");
    expect(PatreonHelper.getAccessMatrix(true).experimentalMid).toBe(true);

    await PatreonHelper.clearPatreonStatus(true);

    expect(PatreonHelper.getAccessMatrix(true).experimentalMid).toBe(false);
  });
});
