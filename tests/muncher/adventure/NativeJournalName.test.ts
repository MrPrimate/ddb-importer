// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { deriveTitle, processRow, UNKNOWN_JOURNAL_NAME } from "../../../src/muncher/adventure/native/ContentRowProcessor";
import { buildJournals } from "../../../src/muncher/adventure/native/NativeJournalBuilder";
import NativeIdFactory from "../../../src/muncher/adventure/native/NativeIdFactory";

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

function makeRow(overrides: Partial<ProcessedRow>): ProcessedRow {
  return {
    id: 1,
    cobaltId: null,
    parentId: null,
    slug: null,
    title: "Row",
    contentChunkId: null,
    content: "<p>content</p>",
    sourceHtml: "<p>content</p>",
    level: 1,
    ...overrides,
  };
}

describe("deriveTitle", () => {
  it("keeps a non-blank title untouched", () => {
    expect(deriveTitle(parse("<h1>Heading</h1>"), "Given")).toBe("Given");
  });

  it("prefers h1, then h2, then h3 when the title is missing", () => {
    expect(deriveTitle(parse("<h2>Second</h2><h1>First</h1>"), null)).toBe("First");
    expect(deriveTitle(parse("<h3>Third</h3><h2>Second</h2>"), "")).toBe("Second");
    expect(deriveTitle(parse("<p>intro</p><h3>Third</h3>"), "   ")).toBe("Third");
  });

  it("collapses whitespace inside the heading text", () => {
    expect(deriveTitle(parse("<h1>Introduction:\n   Red Wizards’ Gambit </h1>"), null)).toBe("Introduction: Red Wizards’ Gambit");
  });

  it("falls back to a placeholder when no heading exists", () => {
    expect(deriveTitle(parse("<p>no headings</p>"), null)).toBe(UNKNOWN_JOURNAL_NAME);
    expect(deriveTitle(parse("<h1>   </h1>"), undefined)).toBe(UNKNOWN_JOURNAL_NAME);
  });
});

describe("processRow with a missing Title", () => {
  it("borrows the leading h1 as the row title", () => {
    const row: ContentRow = {
      id: 1,
      cobaltId: 2976,
      parentId: null,
      slug: "introduction-red-wizards-gambit",
      title: null,
      html: "<h1 id=\"introduction-red-wizards-gambit\">Introduction: Red Wizards’ Gambit</h1><p>Welcome.</p>",
    };
    const processed = processRow(row, {});
    expect(processed.title).toBe("Introduction: Red Wizards’ Gambit");
  });

  it("uses the placeholder when there is no heading either", () => {
    const row: ContentRow = { id: 1, cobaltId: null, parentId: null, slug: null, title: "", html: "<p>Welcome.</p>" };
    expect(processRow(row, {}).title).toBe(UNKNOWN_JOURNAL_NAME);
  });
});

describe("buildJournals with blank titles", () => {
  it("names the journal and its first page from the page heading", () => {
    const rows = [
      makeRow({ id: 1, cobaltId: 2976, title: "", sourceHtml: "<h1>Introduction</h1><p>Welcome.</p>", content: "<p>Welcome.</p>" }),
      makeRow({ id: 2, parentId: 2976, title: "", sourceHtml: "<h2>Schedule</h2><p>Dates.</p>", content: "<p>Dates.</p>" }),
    ];
    const journals = buildJournals(rows, "folder", "rwg", new NativeIdFactory());
    expect(journals).toHaveLength(1);
    expect(journals[0].name).toBe("Introduction");
    expect(journals[0].pages?.[0].name).toBe("Introduction");
    expect(journals[0].pages?.[1].name).toBe("Schedule");
    expect(journals[0].pages?.[1]?.title?.show).toBe(true);
  });

  it("uses the placeholder when neither title nor heading exists", () => {
    const rows = [makeRow({ id: 1, title: "", sourceHtml: "<p>text</p>", content: "<p>text</p>" })];
    const journals = buildJournals(rows, "folder", "rwg", new NativeIdFactory());
    expect(journals[0].name).toBe(UNKNOWN_JOURNAL_NAME);
    expect(journals[0].pages?.[0].name).toBe(UNKNOWN_JOURNAL_NAME);
  });
});
