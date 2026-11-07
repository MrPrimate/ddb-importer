import { describe, expect, it } from "vitest";
import AdvancementBuilder from "../../../src/parser/advancements/AdvancementBuilder";

describe("AdvancementBuilder.buildModifyItem", () => {
  it("builds a Modify Item advancement pointing at the document's own enchantment", () => {
    const advancement = AdvancementBuilder.buildModifyItem({
      id: "ddbEmpStrikesAd1",
      name: "Force Unarmed Strikes",
      level: 6,
      changes: [{ effectId: "ddbEmpStrikesEf1", identifiers: ["weapon:unarmed-strike"] }],
    }) as unknown as Record<string, any>;

    expect(advancement._id).toBe("ddbEmpStrikesAd1");
    expect(advancement.type).toBe("ModifyItem");
    expect(advancement.name).toBe("Force Unarmed Strikes");
    expect(advancement.level).toBe(6);
    // a null uuid makes dnd5e read the effect from the advancement's own item by _id
    expect(advancement.configuration.changes).toEqual([
      { _id: "ddbEmpStrikesEf1", uuid: null, identifiers: ["weapon:unarmed-strike"] },
    ]);
  });
});
