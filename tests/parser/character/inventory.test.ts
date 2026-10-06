// @vitest-environment jsdom
/**
 * A character holding both of DDB's copies of a state or mode item keeps one: the secondary copy
 * only when it is attuned and the preferred one is not. The Galvanized Claw prefers its
 * Untransformed copy (the Transformed state is then assumed not to be active), the Hoopaks their
 * melee copy over "(Ranged)".
 */
// the lib barrel first, so the parser modules inventory.ts pulls in resolve in their usual order
import "../../../src/lib/_module";
import { droppedStateCopyIds } from "../../../src/parser/character/inventory";

const item = (id: number, name: string, isAttuned = false) => ({ id, isAttuned, definition: { name } }) as any;
const TRANSFORMED = "Galvanized Claw (Transformed)";
const UNTRANSFORMED = "Galvanized Claw (Untransformed)";

describe("droppedStateCopyIds", () => {
  it("keeps a lone copy whatever its attunement", () => {
    expect([...droppedStateCopyIds([item(1, TRANSFORMED)])]).toEqual([]);
    expect([...droppedStateCopyIds([item(2, UNTRANSFORMED, true), item(3, "Longsword")])]).toEqual([]);
  });

  it("drops the copy that is not attuned", () => {
    expect([...droppedStateCopyIds([item(1, TRANSFORMED, true), item(2, UNTRANSFORMED)])]).toEqual([2]);
    expect([...droppedStateCopyIds([item(1, TRANSFORMED), item(2, UNTRANSFORMED, true)])]).toEqual([1]);
  });

  it("drops the Transformed copy when neither or both are attuned", () => {
    expect([...droppedStateCopyIds([item(1, TRANSFORMED), item(2, UNTRANSFORMED)])]).toEqual([1]);
    expect([...droppedStateCopyIds([item(1, TRANSFORMED, true), item(2, UNTRANSFORMED, true)])]).toEqual([1]);
  });

  it("keeps one of a trick weapon's three copies: the first attuned, else the Untransformed one", () => {
    const base = item(1, "Shard of Moonlight");
    const longsword = item(2, "Shard of Moonlight (Longsword)");
    const greatsword = item(3, "Shard of Moonlight (Greatsword)", true);
    expect([...droppedStateCopyIds([base, longsword, greatsword])].sort()).toEqual([1, 2]);
    expect([...droppedStateCopyIds([base, item(2, "Shard of Moonlight (Longsword)")])]).toEqual([1]);
    // DDB's curly apostrophes match the straight ones in the table
    // with neither attuned the base copy wins over the Transformed one
    expect([...droppedStateCopyIds([item(4, "Orphan’s Cradle"), item(5, "Orphan’s Cradle (Transformed)")])]).toEqual([5]);
  });

  it("keeps one Meat Hookshot, preferring the Sickle and Blunderbuss over the Battleaxe", () => {
    const held = [item(1, "Meat Hookshot (Battleaxe)"), item(2, "Meat Hookshot (Blunderbuss)"), item(3, "Meat Hookshot (Sickle)")];
    expect([...droppedStateCopyIds(held)].sort()).toEqual([1, 2]);
    expect([...droppedStateCopyIds([item(1, "Meat Hookshot (Battleaxe)"), item(2, "Meat Hookshot (Blunderbuss)")])]).toEqual([1]);
  });

  it("keeps Precipit's attuned state copy, else the base staff", () => {
    expect([...droppedStateCopyIds([item(1, "Precipit, the Formless"), item(2, "Precipit, the Formless (Solid)", true)])]).toEqual([1]);
    expect([...droppedStateCopyIds([item(1, "Precipit, the Formless (Gas)"), item(2, "Precipit, the Formless")])]).toEqual([1]);
  });

  it("keeps a Hoopak's melee copy over its (Ranged) one", () => {
    expect([...droppedStateCopyIds([item(1, "Hoopak"), item(2, "Hoopak (Ranged)")])]).toEqual([2]);
    expect([...droppedStateCopyIds([item(1, "Forcebreaker Hoopak"), item(2, "Forcebreaker Hoopak (Ranged)", true)])]).toEqual([1]);
    expect([...droppedStateCopyIds([item(2, "Hoopak (Ranged)")])]).toEqual([]);
  });

  it("keeps every copy of one name, as they are separate items", () => {
    expect([...droppedStateCopyIds([item(1, "Hoopak"), item(2, "Hoopak")])]).toEqual([]);
    expect([...droppedStateCopyIds([item(1, "Hoopak"), item(2, "Hoopak (Ranged)"), item(3, "Hoopak")])]).toEqual([2]);
  });
});
