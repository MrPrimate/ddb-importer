import { describe, expect, it } from "vitest";
import {
  looseSceneNameKey,
  matchScenesByName,
  resolveFolderRef,
  sceneFolderRelativePath,
  scenesInFolder,
} from "../../src/apps/lib/sceneFieldCopy";

function folder(id: string, name: string, parent: any = null) {
  return { id, name, folder: parent };
}

const oldRoot = folder("old", "Old Adventure");
const oldCh1 = folder("old-ch1", "Chapter 1", oldRoot);
const oldCh2 = folder("old-ch2", "Chapter 2", oldRoot);
const newRoot = folder("new", "New Adventure");
const newCh1 = folder("new-ch1", "Chapter 1", newRoot);
const newCh2 = folder("new-ch2", "Chapter 2", newRoot);

function scene(id: string, name: string, parent: any) {
  return { id, name, folder: parent };
}

describe("resolveFolderRef", () => {
  const adventures = { id: "adv", name: "Adventures", type: "Scene", folder: null };
  const nestedGambit = { id: "nested", name: "Red Wizards Gambit", type: "Scene", folder: adventures };
  const topGambit = { id: "top", name: "Red Wizards Gambit", type: "Scene", folder: null };
  const actorGambit = { id: "actors", name: "Red Wizards Gambit", type: "Actor", folder: null };
  const folders = [adventures, nestedGambit, actorGambit, topGambit];

  it("prefers the least nested scene folder for a bare name", () => {
    expect(resolveFolderRef("Red Wizards Gambit", folders)).toBe("top");
  });

  it("picks a nested folder from its path, ignoring spacing and case", () => {
    expect(resolveFolderRef("Adventures/Red Wizards Gambit", folders)).toBe("nested");
    expect(resolveFolderRef(" adventures / red wizards gambit ", folders)).toBe("nested");
  });

  it("finds a nested folder by name when it is the only one", () => {
    expect(resolveFolderRef("Red Wizards Gambit", [adventures, nestedGambit])).toBe("nested");
  });

  it("accepts ids and folder names containing a slash", () => {
    const slashed = { id: "slash", name: "Part 1/2", type: "Scene", folder: null };
    expect(resolveFolderRef("nested", folders)).toBe("nested");
    expect(resolveFolderRef("Part 1/2", [slashed])).toBe("slash");
  });

  it("returns null when nothing matches", () => {
    expect(resolveFolderRef("Missing", folders)).toBeNull();
  });
});

describe("sceneFolderRelativePath", () => {
  it("returns an empty path for scenes directly in the root", () => {
    expect(sceneFolderRelativePath(scene("a", "A", oldRoot), "old", false)).toBe("");
  });

  it("returns the nested path below the root when subfolders are included", () => {
    expect(sceneFolderRelativePath(scene("a", "A", oldCh1), "old", true)).toBe("Chapter 1");
  });

  it("excludes nested scenes when subfolders are not included", () => {
    expect(sceneFolderRelativePath(scene("a", "A", oldCh1), "old", false)).toBeNull();
  });

  it("excludes scenes outside the root", () => {
    expect(sceneFolderRelativePath(scene("a", "A", newCh1), "old", true)).toBeNull();
  });
});

describe("matchScenesByName", () => {
  const scenes = [
    scene("o1", "Cave Entrance", oldCh1),
    scene("o2", "Map", oldCh1),
    scene("o3", "Map", oldCh2),
    scene("o4", "  goblin   den ", oldRoot),
    scene("o5", "Missing Scene", oldRoot),
    scene("n1", "Cave Entrance", newCh2),
    scene("n2", "Map", newCh1),
    scene("n3", "Map", newCh2),
    scene("n4", "Goblin Den", newRoot),
  ];

  it("prefers the same relative folder, falls back to a unique name, and reports the rest", () => {
    const sources = scenesInFolder("old", true, scenes);
    const targets = scenesInFolder("new", true, scenes);
    const { matches, unmatched } = matchScenesByName(sources, targets);

    expect(matches).toEqual([
      // moved to another chapter, but the only target with that name
      { sourceId: "o1", targetId: "n1", matchedBy: "name" },
      // same-named maps stay paired with their own chapter
      { sourceId: "o2", targetId: "n2", matchedBy: "name" },
      { sourceId: "o3", targetId: "n3", matchedBy: "name" },
      // whitespace and case are ignored
      { sourceId: "o4", targetId: "n4", matchedBy: "name" },
    ]);
    expect(unmatched.map((u) => u.id)).toEqual(["o5"]);
  });

  it("leaves a name ambiguous when several targets share it", () => {
    const sources = [{ id: "s", name: "Map", relPath: "Elsewhere" }];
    const targets = [
      { id: "t1", name: "Map", relPath: "Chapter 1" },
      { id: "t2", name: "Map", relPath: "Chapter 2" },
    ];
    const { matches, unmatched } = matchScenesByName(sources, targets);
    expect(matches).toEqual([]);
    expect(unmatched.map((u) => u.id)).toEqual(["s"]);
  });

  it("never maps a scene onto itself or claims a target twice", () => {
    const sources = [
      { id: "a", name: "Map", relPath: "" },
      { id: "b", name: "Map", relPath: "" },
    ];
    const targets = [
      { id: "a", name: "Map", relPath: "" },
      { id: "t", name: "Map", relPath: "" },
    ];
    const { matches } = matchScenesByName(sources, targets);
    const targetIds = matches.map((m) => m.targetId);
    expect(new Set(targetIds).size).toBe(targetIds.length);
    expect(matches.every((m) => m.sourceId !== m.targetId)).toBe(true);
  });

  it("matches adventure scene names to DDB Maps names", () => {
    const sources = [{ id: "s", name: "Immilmar Plazas (Player Version)", relPath: "" }];
    const targets = [
      { id: "t", name: "Map: Immilmar Plaza", relPath: "" },
      { id: "other", name: "Map: Immilmar Docks", relPath: "" },
    ];
    expect(matchScenesByName(sources, targets).matches).toEqual([
      { sourceId: "s", targetId: "t", matchedBy: "loose" },
    ]);
  });

  it("pairs player and DM variants with their own counterparts", () => {
    const sources = [
      { id: "player", name: "Immilmar Plazas (Player Version)", relPath: "" },
      { id: "dm", name: "Immilmar Plazas", relPath: "" },
    ];
    const targets = [
      { id: "t-dm", name: "Map: Immilmar Plaza", relPath: "" },
      { id: "t-player", name: "Map: Immilmar Plaza (Player Version)", relPath: "" },
    ];
    expect(matchScenesByName(sources, targets).matches).toEqual([
      { sourceId: "player", targetId: "t-player", matchedBy: "loose" },
      { sourceId: "dm", targetId: "t-dm", matchedBy: "loose" },
    ]);
  });

  it("gives a lone loose target to the variant with the same suffix", () => {
    const sources = [
      { id: "player", name: "Immilmar Plazas (Player Version)", relPath: "" },
      { id: "dm", name: "Immilmar Plazas", relPath: "" },
    ];
    const targets = [{ id: "t", name: "Map: Immilmar Plaza", relPath: "" }];
    const { matches, unmatched } = matchScenesByName(sources, targets);
    expect(matches).toEqual([{ sourceId: "dm", targetId: "t", matchedBy: "loose" }]);
    expect(unmatched.map((u) => u.id)).toEqual(["player"]);
  });

  it("prefers an exact name over a loose one", () => {
    const sources = [{ id: "s", name: "Immilmar Plaza", relPath: "" }];
    const targets = [
      { id: "loose", name: "Map: Immilmar Plazas", relPath: "" },
      { id: "exact", name: "Immilmar Plaza", relPath: "" },
    ];
    expect(matchScenesByName(sources, targets).matches).toEqual([
      { sourceId: "s", targetId: "exact", matchedBy: "name" },
    ]);
  });
});

describe("looseSceneNameKey", () => {
  it.each([
    ["Immilmar Plazas (Player Version)", "immilmar plaza"],
    ["Map: Immilmar Plaza", "immilmar plaza"],
    ["Map 2.1: The Wizard's Towers", "wizard tower"],
    ["Chapter 3: Hidden Galleries (Unlabeled Version)", "hidden gallery"],
    ["Mountain Pass", "mountain pass"],
    ["(Map)", "map"],
  ])("%s -> %s", (name, key) => {
    expect(looseSceneNameKey(name)).toBe(key);
  });
});
