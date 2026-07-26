import { describe, it, expect } from "vitest";
import { adjustParentRows } from "../../../src/muncher/adventure/native/ContentRowProcessor";
import { buildJournals } from "../../../src/muncher/adventure/native/NativeJournalBuilder";
import NativeIdFactory from "../../../src/muncher/adventure/native/NativeIdFactory";

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

describe("adjustParentRows", () => {
  it("promotes the first orphan of a group to the chapter, later orphans attach to it", () => {
    const rows = [
      makeRow({ id: 1, cobaltId: 100, title: "Chapter 1" }),
      makeRow({ id: 2, parentId: 2606, title: "Chapter 2: A Guide to the Realms" }),
      makeRow({ id: 3, parentId: 2606, title: "Some Section" }),
    ];
    adjustParentRows(rows);

    expect(rows[1].cobaltId).toBe(2606);
    expect(rows[1].parentId).toBeNull();
    expect(rows[2].cobaltId).toBeNull();
    expect(rows[2].parentId).toBe(2606);
  });

  it("leaves a well-formed book untouched", () => {
    const rows = [
      makeRow({ id: 1, cobaltId: 100, title: "Chapter 1" }),
      makeRow({ id: 2, parentId: 100, title: "Section 1" }),
      makeRow({ id: 3, title: "Standalone" }),
    ];
    const before = structuredClone(rows);
    adjustParentRows(rows);
    expect(rows).toEqual(before);
  });

  it("trims a trailing # from the promoted row's slug", () => {
    const rows = [
      makeRow({ id: 1, parentId: 2606, slug: "a-guide-to-the-realms#", title: "Chapter 2" }),
    ];
    adjustParentRows(rows);
    expect(rows[0].slug).toBe("a-guide-to-the-realms");
  });

  it("ignores rows with null or 0 parentId", () => {
    const rows = [
      makeRow({ id: 1, parentId: null, title: "Standalone" }),
      makeRow({ id: 2, parentId: 0 as any, title: "Zero parent" }),
    ];
    const before = structuredClone(rows);
    adjustParentRows(rows);
    expect(rows).toEqual(before);
  });

  it("reparents journal-hint children under the hinted chapter with the hint level", () => {
    const rows = [
      makeRow({ id: 1, cobaltId: 300, title: "Chapter 3: Classes" }),
      makeRow({ id: 2, cobaltId: 310, title: "Barbarian" }),
      makeRow({ id: 3, cobaltId: 320, title: "Wizard" }),
    ];
    adjustParentRows(rows, [
      { parentName: "Chapter 3: Classes", childNames: ["Barbarian", "Wizard"], levelHint: 2 },
    ]);

    for (const row of [rows[1], rows[2]]) {
      expect(row.cobaltId).toBeNull();
      expect(row.parentId).toBe(300);
      expect(row.level).toBe(2);
    }
    expect(rows[0].cobaltId).toBe(300);
  });

  it("moves children of a hint-reparented row to the same chapter at level 3", () => {
    const rows = [
      makeRow({ id: 1, cobaltId: 300, title: "Chapter 3: Classes" }),
      makeRow({ id: 2, cobaltId: 310, title: "Barbarian" }),
      makeRow({ id: 3, parentId: 310, title: "Path of the Berserker" }),
    ];
    adjustParentRows(rows, [
      { parentName: "Chapter 3: Classes", childNames: ["Barbarian"], levelHint: 2 },
    ]);

    expect(rows[2].parentId).toBe(300);
    expect(rows[2].cobaltId).toBeNull();
    expect(rows[2].level).toBe(3);
  });

  it("hint match without a matching parent sets the level but suppresses promotion", () => {
    const rows = [
      makeRow({ id: 1, parentId: 999, title: "Barbarian" }),
    ];
    adjustParentRows(rows, [
      { parentName: "Chapter 3: Classes", childNames: ["Barbarian"], levelHint: 2 },
    ]);

    // no "Chapter 3: Classes" row exists: ids untouched, no orphan promotion
    expect(rows[0].cobaltId).toBeNull();
    expect(rows[0].parentId).toBe(999);
    expect(rows[0].level).toBe(2);
  });

  it("adjusted rows survive buildJournals with no dropped pages", () => {
    const rows = [
      makeRow({ id: 2, parentId: 2606, title: "Chapter 2: A Guide to the Realms" }),
      makeRow({ id: 3, parentId: 2606, title: "Some Section" }),
    ];
    adjustParentRows(rows);
    const journals = buildJournals(rows, "folder123", "frhof", new NativeIdFactory());

    expect(journals).toHaveLength(1);
    expect(journals[0].name).toBe("Chapter 2: A Guide to the Realms");
    // chapter's own page + the attached section page
    expect(journals[0].pages).toHaveLength(2);
    expect(journals[0].pages?.[1].name).toBe("Some Section");
  });
});
