import { describe, it, expect, vi, beforeEach } from "vitest";

const { fetchUpdatedMonsterInfo, chooseMonstersToReplace } = vi.hoisted(() => ({
  fetchUpdatedMonsterInfo: vi.fn(),
  chooseMonstersToReplace: vi.fn(),
}));
vi.mock("../../../src/apps/MonsterReplacer", () => ({
  default: class {
    static fetchUpdatedMonsterInfo = fetchUpdatedMonsterInfo;
    chooseMonstersToReplace = chooseMonstersToReplace;
  },
}));

import { extendMonsterSwapMap } from "../../../src/muncher/adventure/native/NativeMonsterImporter";

// The journal chooser runs before scenes exist; monsters that only appear as scene tokens are
// offered when the tokens are about to be placed.
describe("extendMonsterSwapMap", () => {
  beforeEach(() => {
    fetchUpdatedMonsterInfo.mockReset();
    chooseMonstersToReplace.mockReset();
  });

  it("offers only token monsters the journal chooser did not, and adds the chosen swaps", async () => {
    fetchUpdatedMonsterInfo.mockResolvedValue([
      { id2014: 3, id2024: 3003, name2024: "Goblin Warrior" },
      { id2014: 4, id2024: 4004, name2024: "Orc" },
    ]);
    chooseMonstersToReplace.mockResolvedValue([3]);
    const swap = new Map([[1, { id2014: 1, id2024: 1001, name2024: "Bandit" }]]);
    const offered = new Set([1, 2]);

    await extendMonsterSwapMap(swap, [1, 2, 3, 4], offered, "Test Adventure");

    expect(fetchUpdatedMonsterInfo).toHaveBeenCalledWith([3, 4]);
    expect([...swap.keys()].sort()).toEqual([1, 3]);
    expect(swap.get(3)).toEqual({ id2014: 3, id2024: 3003, name2024: "Goblin Warrior" });
    expect([...offered].sort()).toEqual([1, 2, 3, 4]);
  });

  it("does not prompt when every token monster was already offered", async () => {
    await extendMonsterSwapMap(new Map(), [1, 2], new Set([1, 2]), "Test Adventure");
    expect(fetchUpdatedMonsterInfo).not.toHaveBeenCalled();
    expect(chooseMonstersToReplace).not.toHaveBeenCalled();
  });
});
