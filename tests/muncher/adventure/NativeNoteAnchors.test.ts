import { describe, it, expect } from "vitest";
import { injectHeadingAnchors } from "../../../src/muncher/adventure/native/NativeHeadingAnchors";
import { guessSlugLink, resolveNote, type JournalPageLookup } from "../../../src/muncher/adventure/native/NativeNoteResolution";

// Minimal fake heading/Document so injectHeadingAnchors can run without jsdom
// (vitest runs in the node environment, no DOMParser available).
function fakeHeading(text: string, opts: { bold?: string; id?: string } = {}) {
  return {
    id: opts.id ?? "",
    textContent: text,
    querySelector: (_sel: string) => (opts.bold ? { textContent: opts.bold } : null),
    getAttribute(key: string) {
      return key === "id" ? (this.id || null) : null;
    },
    setAttribute(key: string, value: string) {
      if (key === "id") this.id = value;
    },
  };
}

function fakeDoc(headings: any[]): any {
  return { querySelectorAll: (_sel: string) => headings };
}

describe("injectHeadingAnchors", () => {
  it("stamps an id matching the DDB slugLink formula (text.replace(/[^\\w\\d]+/g, ''))", () => {
    const h = fakeHeading("Death at Sunset's Lair");
    injectHeadingAnchors(fakeDoc([h]));
    expect(h.id).toBe("DeathatSunsetsLair");
  });

  it("prefers bold/strong text over the full heading text", () => {
    const h = fakeHeading("L1. Guarded Tunnel - flavour text", { bold: "L1 Guarded Tunnel" });
    injectHeadingAnchors(fakeDoc([h]));
    expect(h.id).toBe("L1GuardedTunnel");
  });

  it("leaves headings that already carry an id untouched", () => {
    const h = fakeHeading("Some Heading", { id: "DDBSuppliedId" });
    injectHeadingAnchors(fakeDoc([h]));
    expect(h.id).toBe("DDBSuppliedId");
  });

  it("skips headings with no usable text", () => {
    const h = fakeHeading("   ");
    injectHeadingAnchors(fakeDoc([h]));
    expect(h.id).toBe("");
  });
});

describe("resolveNote", () => {
  const lookup: JournalPageLookup = {
    pageByChunk: new Map([["chunk-abc", { entryId: "J1", pageId: "Pchunk" }]]),
    anchorByChunk: new Map([["chunk-abc", "GuardedTunnel"]]),
    pageByElementId: new Map([["GuardedTunnel", { entryId: "J1", pageId: "Pelement" }]]),
    pageBySlug: new Map([
      ["chapter-1-death", { entryId: "J1", pageId: "Pslug" }],
      // LMoP: chapter page + section page share a prefix; the section slug keeps its `#`.
      ["phandalin", { entryId: "J2", pageId: "Pphandalin" }],
      ["phandalin#redbrandhideout", { entryId: "J2", pageId: "Predbrand" }],
    ]),
  };

  it("resolves by contentChunkId first, with the chunk's heading anchor", () => {
    const flags = { ddb: { contentChunkId: "chunk-abc", slugLink: "GuardedTunnel", slug: "chapter-1-death" } };
    expect(resolveNote(flags, lookup)).toEqual({ entryId: "J1", pageId: "Pchunk", anchor: "GuardedTunnel" });
  });

  it("falls back to slugLink (element id), anchor = slugLink", () => {
    const flags = { ddb: { slugLink: "GuardedTunnel", slug: "chapter-1-death" } };
    expect(resolveNote(flags, lookup)).toEqual({ entryId: "J1", pageId: "Pelement", anchor: "GuardedTunnel" });
  });

  it("falls back to normalised slug, no anchor (page top)", () => {
    const flags = { ddb: { slug: "chapter-1--death" } };
    expect(resolveNote(flags, lookup)).toEqual({ entryId: "J1", pageId: "Pslug", anchor: null });
  });

  it("matches a section slug verbatim (the `#section` is part of the page slug)", () => {
    // LMoP Redbrand Hideout: note slug == section page slug, must NOT collapse to the chapter.
    const flags = {
      ddb: { slug: "phandalin#RedbrandHideout", slugLink: null, contentChunkId: "not-in-any-body" },
    };
    expect(resolveNote(flags, lookup)).toEqual({ entryId: "J2", pageId: "Predbrand", anchor: null });
  });

  it("falls back to the base slug for a genuine <page>#<sub-anchor> note, using the suffix as anchor", () => {
    // No "chapter-1-death#Intro" page exists, so resolve the bare "chapter-1-death" page.
    const flags = { ddb: { slug: "chapter-1-death#Intro" } };
    expect(resolveNote(flags, lookup)).toEqual({ entryId: "J1", pageId: "Pslug", anchor: "Intro" });
  });

  it("chunk match with no mapped anchor returns null anchor", () => {
    const noAnchor: JournalPageLookup = { ...lookup, anchorByChunk: new Map() };
    const flags = { ddb: { contentChunkId: "chunk-abc" } };
    expect(resolveNote(flags, noAnchor)).toEqual({ entryId: "J1", pageId: "Pchunk", anchor: null });
  });

  it("reads flags from ddbimporter.metaDataNote when ddb is absent", () => {
    const flags = { ddbimporter: { metaDataNote: { contentChunkId: "chunk-abc" } } };
    expect(resolveNote(flags, lookup)).toEqual({ entryId: "J1", pageId: "Pchunk", anchor: "GuardedTunnel" });
  });

  it("returns null when nothing matches", () => {
    expect(resolveNote({ ddb: { slug: "no-such-page" } }, lookup)).toBeNull();
    expect(resolveNote({}, lookup)).toBeNull();
  });

  it("guesses slugLink from the note name when the flags omit it", () => {
    // "01. Guarded Tunnel" -> "1GuardedTunnel"... but the element id in the
    // fixture is "GuardedTunnel"; use a name that matches it.
    const flags = { ddb: { slugLink: null, slug: "chapter-1-death" } };
    expect(resolveNote(flags, lookup, "Guarded Tunnel")).toEqual({ entryId: "J1", pageId: "Pelement", anchor: "GuardedTunnel" });
  });
});

describe("guessSlugLink", () => {
  it("strips a zero-padded numeric prefix and slugifies", () => {
    expect(guessSlugLink("01. Secret Den")).toBe("1SecretDen");
  });

  it("keeps multi-digit numbers intact", () => {
    expect(guessSlugLink("10. Foo Bar")).toBe("10FooBar");
    expect(guessSlugLink("02. Bar")).toBe("2Bar");
  });

  it("trims surrounding whitespace", () => {
    expect(guessSlugLink("  General Features  ")).toBe("GeneralFeatures");
  });

  it("returns null for empty / missing names", () => {
    expect(guessSlugLink("")).toBeNull();
    expect(guessSlugLink("   ")).toBeNull();
    expect(guessSlugLink(null)).toBeNull();
    expect(guessSlugLink(undefined)).toBeNull();
  });
});
