// @vitest-environment jsdom
import DDBCompanion2024 from "../../../src/parser/companions/DDBCompanion2024";

// The 2024 stat block format puts damage and condition immunities on a single
// "Immunities" line, so the parser has to sort them itself.
function makeCompanion(immunities: string, options: Record<string, any> = {}) {
  const block = `<div><p><strong>Immunities</strong> ${immunities}</p></div>`;
  const companion = new DDBCompanion2024(block as unknown as HTMLElement, options);
  (companion as any).npc = {
    name: "Test Companion",
    system: { traits: {} },
  };
  return companion;
}

async function parseImmunities(immunities: string, options: Record<string, any> = {}) {
  const companion = makeCompanion(immunities, options);
  await (companion as any)._generate();
  return (companion as any).npc.system.traits;
}

describe("DDBCompanion2024 immunities", () => {

  it("sorts capitalised damage types into damage immunities, not custom conditions", async () => {
    // Renanimated Companion: DDB writes the damage types capitalised
    const traits = await parseImmunities("Lightning, Poison; Exhaustion, Poisoned");

    expect(traits.di.value).toEqual(expect.arrayContaining(["lightning", "poison"]));
    expect(traits.di.custom).toBe("");
    expect(traits.ci.value).toEqual(expect.arrayContaining(["exhaustion", "poisoned"]));
    expect(traits.ci.custom).toBe("");
  });

  it("sorts lowercase damage types into damage immunities", async () => {
    const traits = await parseImmunities("necrotic, poison; charmed, frightened");

    expect(traits.di.value).toEqual(expect.arrayContaining(["necrotic", "poison"]));
    expect(traits.di.custom).toBe("");
    expect(traits.ci.value).toEqual(expect.arrayContaining(["charmed", "frightened"]));
    expect(traits.ci.custom).toBe("");
  });

  it("keeps unknown entries as custom condition immunities", async () => {
    const traits = await parseImmunities("Poison; Rugpulling");

    expect(traits.di.value).toEqual(["poison"]);
    expect(traits.ci.value).toEqual([]);
    expect(traits.ci.custom).toBe("Rugpulling");
  });

  it("filters subtype gated damage immunities on a capitalised line", async () => {
    const traits = await parseImmunities("Poison; Fire (Fire only)", { subType: "Fire" });

    expect(traits.di.value).toEqual(expect.arrayContaining(["poison", "fire"]));
  });

  it("drops subtype gated damage immunities for other subtypes", async () => {
    const traits = await parseImmunities("Poison; Fire (Fire only)", { subType: "Water" });

    expect(traits.di.value).toEqual(["poison"]);
    expect(traits.di.value).not.toContain("fire");
  });

});
