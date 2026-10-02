// @vitest-environment jsdom
/**
 * A character holding both DDB state copies of a trick weapon keeps one: the attuned copy, or the
 * Untransformed one when neither or both are attuned (the Transformed state is then assumed not to
 * be active).
 */
// the lib barrel first, so the parser modules inventory.ts pulls in resolve in their usual order
import "../../../src/lib/_module";
import { droppedTransformCopyIds } from "../../../src/parser/character/inventory";

const item = (id: number, name: string, isAttuned = false) => ({ id, isAttuned, definition: { name } }) as any;
const TRANSFORMED = "Galvanized Claw (Transformed)";
const UNTRANSFORMED = "Galvanized Claw (Untransformed)";

describe("droppedTransformCopyIds", () => {
  it("keeps a lone copy whatever its attunement", () => {
    expect([...droppedTransformCopyIds([item(1, TRANSFORMED)])]).toEqual([]);
    expect([...droppedTransformCopyIds([item(2, UNTRANSFORMED, true), item(3, "Longsword")])]).toEqual([]);
  });

  it("drops the copy that is not attuned", () => {
    expect([...droppedTransformCopyIds([item(1, TRANSFORMED, true), item(2, UNTRANSFORMED)])]).toEqual([2]);
    expect([...droppedTransformCopyIds([item(1, TRANSFORMED), item(2, UNTRANSFORMED, true)])]).toEqual([1]);
  });

  it("drops the Transformed copy when neither or both are attuned", () => {
    expect([...droppedTransformCopyIds([item(1, TRANSFORMED), item(2, UNTRANSFORMED)])]).toEqual([1]);
    expect([...droppedTransformCopyIds([item(1, TRANSFORMED, true), item(2, UNTRANSFORMED, true)])]).toEqual([1]);
  });
});
