import { describe, it, expect, vi } from "vitest";
import DDBMapMetaData, { resolveMapBookCode } from "../../../src/muncher/adventure/DDBMapMetaData";
import { buildJournalPageLookup } from "../../../src/muncher/adventure/native/NativeSceneNoteResolver";
import { repointNotesOnLiveScene, resolveMapStub } from "../../../src/muncher/adventure/native/NativeSceneApplier";

// Mirrors DDBMapBrowser._bookIdForCode: bookCode -> numeric CONFIG.DDB source id.
function bookIdForCode(bookCode: string): number | null {
  const src = ((globalThis as any).CONFIG.DDB?.sources ?? []).find(
    (s: any) => typeof s?.name === "string" && s.name.toLowerCase() === bookCode.toLowerCase(),
  );
  const id = src ? Number(src.id) : Number.NaN;
  return Number.isFinite(id) ? id : null;
}

describe("resolveMapBookCode", () => {
  it("reads the bookCode out of an official imageKey", () => {
    expect(resolveMapBookCode({ imageKey: "official/maps/cos/barovia.webp" } as any)).toBe("cos");
  });

  it("is case-insensitive on the imageKey path", () => {
    expect(resolveMapBookCode({ imageKey: "official/maps/LMoP/cragmaw.webp" } as any)).toBe("lmop");
  });

  it("falls back to sourceId -> CONFIG.DDB.sources when imageKey lacks the path", () => {
    // CoS is id 6 in the fallback config; resolves back to its lowercase name.
    expect(resolveMapBookCode({ imageKey: "thumbnails/x.webp", sourceId: 6 } as any)).toBe("cos");
  });

  it("returns null for an unresolvable map (homebrew / map pack)", () => {
    expect(resolveMapBookCode({ imageKey: "custom/x.webp", sourceId: 9999999 } as any)).toBeNull();
  });
});

describe("bookIdForCode (DDBMapBrowser mapping)", () => {
  it("maps a known bookCode to its numeric DDB source id", () => {
    expect(bookIdForCode("cos")).toBe(6);
  });

  it("is case-insensitive", () => {
    expect(bookIdForCode("CoS")).toBe(6);
  });

  it("returns null for an unknown bookCode", () => {
    expect(bookIdForCode("not-a-real-book")).toBeNull();
  });
});

describe("repointNotesOnLiveScene", () => {
  // A native journal with one page resolvable by slug (HTML-free path: the
  // lookup builds pageBySlug from page.flags.ddb.slug without needing a DOM).
  const journals = [
    {
      _id: "JNL1",
      pages: [
        { _id: "PG1", flags: { ddb: { slug: "chapter-2-the-lands-of-barovia" } }, text: { content: "" } },
      ],
    },
  ];

  function fakeNote(flags: any, text = "") {
    return { flags, text, update: vi.fn(async (_update: any) => undefined) };
  }

  function fakeScene(name: string, notes: any[]): Scene {
    return { name, notes: { contents: notes } } as unknown as Scene;
  }

  it("re-points a meta-note (flags.ddb.slug) at the matching native journal page", async () => {
    const lookup = buildJournalPageLookup(journals);
    const note = fakeNote({ ddb: { slug: "chapter-2-the-lands-of-barovia" } }, "Barovia");
    const scene = fakeScene("Barovia", [note]);

    const repointed = await repointNotesOnLiveScene(scene, lookup);

    expect(repointed).toBe(1);
    expect(note.update).toHaveBeenCalledOnce();
    expect(note.update.mock.calls[0][0]).toMatchObject({ entryId: "JNL1", pageId: "PG1" });
  });

  it("leaves an unresolvable note untouched (DDB-link fallback preserved)", async () => {
    const lookup = buildJournalPageLookup(journals);
    const note = fakeNote({ ddb: { slug: "no-such-page" } }, "Mystery");
    const scene = fakeScene("Mystery", [note]);

    const repointed = await repointNotesOnLiveScene(scene, lookup);

    expect(repointed).toBe(0);
    expect(note.update).not.toHaveBeenCalled();
  });

  it("is a no-op for a scene with no notes", async () => {
    const lookup = buildJournalPageLookup(journals);
    const scene = fakeScene("Empty", []);
    expect(await repointNotesOnLiveScene(scene, lookup)).toBe(0);
  });
});

describe("resolveMapStub", () => {
  // Curse of Strahd shape: the enhancement feed names the scene the way the
  // meta-data does, the figcaption carries the book's map numbering.
  function builtScene(docName: string, caption: string): any {
    return {
      doc: { _id: "SCN1", name: docName, flags: { ddb: { parentId: 357, contentChunkId: "Map82-1", ddbId: 53 } } },
      detection: { name: caption, imagePath: "assets/map-08.02-abbey-player.jpg", source: "figure" },
      row: {},
    };
  }

  function withMatchInfo(result: any, run: (calls: any[]) => Promise<void>) {
    const original = DDBMapMetaData.fetchMatchInfo;
    const calls: any[] = [];
    DDBMapMetaData.fetchMatchInfo = (async (map: any) => {
      calls.push(map);
      return result;
    }) as any;
    return run(calls).finally(() => {
      DDBMapMetaData.fetchMatchInfo = original;
    });
  }

  it("asks the proxy with the display name first", async () => {
    const match = { matches: [{ bookCode: "cos", filepath: "x.json", matchedBy: "parentId+name" }], reason: "parentId+name" };
    await withMatchInfo(match, async (calls) => {
      const scene = builtScene("Abbey of Saint Markovia (Ground)", "Map 8.2: Abbey of Saint Markovia - Ground Floor (Player Version)");
      const stub = await resolveMapStub(scene, "cos", 6);
      expect(stub.name).toBe("Abbey of Saint Markovia (Ground)");
      expect(stub.id).toBe("SCN1");
      expect(stub.parentId).toBe(357);
      expect(calls).toHaveLength(1);
    });
  });

  it("falls back to the parsed caption under its own cache key when the display name misses", async () => {
    await withMatchInfo({ matches: [], reason: "no-match" }, async () => {
      const scene = builtScene("Some Enhancement Name", "Map 3.2: Church (Player Version)");
      const stub = await resolveMapStub(scene, "cos", 6);
      expect(stub.name).toBe("Map 3.2: Church");
      expect(stub.id).toBe("SCN1-caption");
    });
  });

  it("skips the pre-flight lookup when there is no separate display name", async () => {
    await withMatchInfo(null, async (calls) => {
      const scene = builtScene("Map 3.2: Church (Player Version)", "Map 3.2: Church (Player Version)");
      const stub = await resolveMapStub(scene, "cos", 6);
      expect(stub.name).toBe("Map 3.2: Church");
      expect(stub.id).toBe("SCN1");
      expect(calls).toHaveLength(0);
    });
  });
});
