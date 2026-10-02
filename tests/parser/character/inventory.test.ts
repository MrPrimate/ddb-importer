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

  it("keeps a Hoopak's melee copy over its (Ranged) one", () => {
    expect([...droppedStateCopyIds([item(1, "Hoopak"), item(2, "Hoopak (Ranged)")])]).toEqual([2]);
    expect([...droppedStateCopyIds([item(1, "Forcebreaker Hoopak"), item(2, "Forcebreaker Hoopak (Ranged)", true)])]).toEqual([1]);
    expect([...droppedStateCopyIds([item(2, "Hoopak (Ranged)")])]).toEqual([]);
  });
});
