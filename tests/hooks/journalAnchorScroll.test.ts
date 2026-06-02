import { describe, it, expect } from "vitest";
import { getPendingImages, waitForImage } from "../../src/hooks/renderJournalSheet/journalAnchorScroll";

// Minimal fakes - vitest runs in the node env (no jsdom / DOM).
function fakeImg(complete: boolean, naturalHeight = 100): any {
  return { complete, naturalHeight };
}
function fakeRoot(imgs: any[]): any {
  return { querySelectorAll: (sel: string) => (sel === "img" ? imgs : []) };
}

function fakeEventImg(): any {
  const listeners: Record<string, Array<() => void>> = {};
  return {
    addEventListener(type: string, cb: () => void) {
      (listeners[type] ??= []).push(cb);
    },
    removeEventListener(type: string, cb: () => void) {
      listeners[type] = (listeners[type] ?? []).filter((x) => x !== cb);
    },
    dispatch(type: string) {
      (listeners[type] ?? []).slice().forEach((cb) => cb());
    },
    listenerCount(type: string) {
      return (listeners[type] ?? []).length;
    },
  };
}

describe("getPendingImages", () => {
  it("returns [] for a null/undefined root", () => {
    expect(getPendingImages(null)).toEqual([]);
    expect(getPendingImages(undefined)).toEqual([]);
  });

  it("returns [] when every image is complete with layout", () => {
    const root = fakeRoot([fakeImg(true, 50), fakeImg(true, 120)]);
    expect(getPendingImages(root)).toEqual([]);
  });

  it("returns images that are not complete", () => {
    const pending = fakeImg(false, 0);
    const root = fakeRoot([fakeImg(true, 50), pending]);
    expect(getPendingImages(root)).toEqual([pending]);
  });

  it("returns images that are complete but have no natural height yet", () => {
    const noLayout = fakeImg(true, 0);
    const root = fakeRoot([noLayout, fakeImg(true, 80)]);
    expect(getPendingImages(root)).toEqual([noLayout]);
  });
});

describe("waitForImage", () => {
  it("resolves on the load event and removes its listeners", async () => {
    const img = fakeEventImg();
    const p = waitForImage(img);
    img.dispatch("load");
    await p;
    expect(img.listenerCount("load")).toBe(0);
    expect(img.listenerCount("error")).toBe(0);
  });

  it("resolves on the error event (broken/404 image)", async () => {
    const img = fakeEventImg();
    const p = waitForImage(img);
    img.dispatch("error");
    await expect(p).resolves.toBeUndefined();
  });
});
