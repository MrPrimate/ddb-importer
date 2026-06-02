import { describe, it, expect, beforeEach } from "vitest";
import { getNativeSessionCache, clearNativeSessionCache } from "../../../src/muncher/adventure/native/NativeSessionCache";

describe("NativeSessionCache", () => {
  beforeEach(() => {
    clearNativeSessionCache();
  });

  it("lazily creates the cache when CONFIG.DDBI.NATIVE is absent", () => {
    expect((CONFIG.DDBI as any).NATIVE).toBeUndefined();
    const cache = getNativeSessionCache();
    expect(cache.journalBundles).toBeInstanceOf(Map);
    expect(cache.rulebookSources).toBeInstanceOf(Set);
    expect(cache.importedSpellIds).toBeInstanceOf(Set);
    expect(cache.importedItemIds).toBeInstanceOf(Set);
    expect(cache.importedMonsterIds).toBeInstanceOf(Set);
  });

  it("returns a stable singleton (mutations persist across calls)", () => {
    const a = getNativeSessionCache();
    a.importedSpellIds.add("123");
    a.journalBundles.set("cos", { journals: [], lookup: {} });
    const b = getNativeSessionCache();
    expect(b).toBe(a);
    expect(b.importedSpellIds.has("123")).toBe(true);
    expect(b.journalBundles.get("cos")).toEqual({ journals: [], lookup: {} });
  });

  it("clearNativeSessionCache resets the store", () => {
    const a = getNativeSessionCache();
    a.importedMonsterIds.add("999");
    clearNativeSessionCache();
    expect((CONFIG.DDBI as any).NATIVE).toBeUndefined();
    const b = getNativeSessionCache();
    expect(b).not.toBe(a);
    expect(b.importedMonsterIds.has("999")).toBe(false);
  });
});
