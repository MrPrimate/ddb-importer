// @vitest-environment jsdom
// A 2024 Circle of the Land land option grants its table's spells always prepared at each Druid
// level, as the SRD's land features do.

// CharacterFeatureFactory must load first, it initialises the feature class chain
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBChoiceFeature from "../../../src/parser/features/DDBChoiceFeature";
import AdvancementHelper from "../../../src/parser/advancements/AdvancementHelper";

const ARID_TABLE = `<table><thead><tr><th>Druid Level</th><th>Circle Spells</th></tr></thead><tbody>
<tr><td>3</td><td>Blur, Burning Hands, Fire Bolt</td></tr>
<tr><td>5</td><td>Fireball</td></tr>
<tr><td>7</td><td>Blight</td></tr>
<tr><td>9</td><td>Wall of Stone</td></tr>
</tbody></table>`;

function stub(parentName: string, { is2014 = false } = {}): any {
  const added: any[] = [];
  return {
    added,
    is2014,
    is2024: !is2014,
    ddbDefinition: { name: parentName, description: ARID_TABLE },
    data: { name: "Arid Land" },
    spellLinks: [],
    _addAdvancement: (advancement: any) => added.push(advancement),
  };
}

describe("DDBChoiceFeature._generateSpellTableGrants", () => {
  const original = AdvancementHelper.getSpellGrantAdvancement;
  const calls: any[] = [];

  beforeEach(() => {
    calls.length = 0;
    AdvancementHelper.getSpellGrantAdvancement = (async (args: any) => {
      calls.push(args);
      return { level: args.level };
    }) as any;
  });

  afterEach(() => {
    AdvancementHelper.getSpellGrantAdvancement = original;
  });

  it("grants each row's spells always prepared at its Druid level", async () => {
    const land = stub("Circle of the Land Spells");
    await DDBChoiceFeature.prototype._generateSpellTableGrants.call(land);
    expect(calls.map((c) => [c.level, c.spellGrants.map((g: any) => g.name)])).toEqual([
      [3, ["Blur", "Burning Hands", "Fire Bolt"]],
      [5, ["Fireball"]],
      [7, ["Blight"]],
      [9, ["Wall of Stone"]],
    ]);
    expect(calls.every((c) => c.name === "Arid Land" && c.method === "spell" && c.prepared === 2 && c.requireSlot === false)).toBe(true);
    expect(land.added.map((a: any) => a.level)).toEqual([3, 5, 7, 9]);
  });

  it("leaves other options and the 2014 printing alone", async () => {
    await DDBChoiceFeature.prototype._generateSpellTableGrants.call(stub("Divine Order"));
    await DDBChoiceFeature.prototype._generateSpellTableGrants.call(stub("Circle of the Land Spells", { is2014: true }));
    expect(calls).toEqual([]);
  });
});
