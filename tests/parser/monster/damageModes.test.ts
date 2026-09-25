import { DDBMonsterDamage } from "../../../src/parser/monster/features/DDBMonsterDamage";
import { parseMonsterDamageModes } from "../../../src/parser/monster/features/MonsterDamageModes";

vi.mock("../../../src/parser/monster/features/DDBMonsterFeature", () => ({ default: class {} }));

function parse(text: string) {
  const tokens = [...text.matchAll(new RegExp(DDBMonsterDamage.DAMAGE_EXPRESSION))]
    .filter((m) => m.groups?.dice || m.groups?.diceminor)
    .map((m) => ({ index: m.index, 0: m[0], groups: m.groups! }));
  return parseMonsterDamageModes(text, tokens);
}

describe("monster conditional damage clauses", () => {
  it.each([
    ["plus 2 (1d4) Fire damage if the attack had Advantage", "Attack with Advantage", "add"],
    ["or 8 (2d6 + 1) Slashing damage if the target is Bloodied", "Attack against Bloodied Target", "replace"],
    ["or 8 (2d6 + 1) Slashing damage while enlarged", "Enlarged Attack", "replace"],
    ["or 2 (1d4) Slashing damage if the swarm has half its hit points or fewer", "Bloodied Attack", "replace"],
    ["plus 2 (1d4) Fire damage if the target is in a form other than its true form", "Attack against Transformed Target", "add"],
  ])("recognizes %s", (suffix, name, operation) => {
    const result = parse(`Hit: 4 (1d6 + 1) Slashing damage, ${suffix}.`);
    expect(result.warnings).toEqual([]);
    expect(result.normal).toEqual([0]);
    expect(result.modes).toMatchObject([{ name, operation, parts: operation === "add" ? [0, 1] : [1] }]);
  });

  it("retains an unconditional rider before a leading movement condition", () => {
    const result = parse("Hit: 4 (1d6 + 1) Bludgeoning damage plus 2 (1d4) Cold damage. If the target is Small or smaller and the beast moved 10 feet straight toward it, the target takes an extra 3 (1d6) Bludgeoning damage and has the Prone condition.");
    expect(result.warnings).toEqual([]);
    expect(result.normal).toEqual([0, 1]);
    expect(result.modes).toMatchObject([{ name: "Moving Attack", parts: [0, 1, 2] }]);
    expect(result.normalText).not.toContain("Prone");
  });

  it("uses paired em-dash boundaries for shared trailing damage", () => {
    const result = parse("Hit: 4 (1d6 + 1) Piercing damage\u2014or 8 (2d6 + 1) Piercing damage if the target is Grappled by the beast\u2014plus 2 (1d4) Acid damage.");
    expect(result.normal).toEqual([0, 2]);
    expect(result.modes).toMatchObject([{ name: "Attack against Grappled Target", parts: [1, 2] }]);
    expect(result.modes[0].condition).toBe("the target is Grappled by the beast");
    expect(result.normalText).toContain("Acid damage");
  });

  it("keeps effects outside a conditional additive insertion", () => {
    const result = parse("Hit: 4 (1d6 + 1) Bludgeoning damage\u2014plus 2 (1d4) Cold damage if the beast is Bloodied\u2014and the target has the Prone condition.");
    expect(result.normal).toEqual([0]);
    expect(result.modes).toMatchObject([{ name: "Bloodied Attack", parts: [0, 1] }]);
    expect(result.normalText).toContain("Prone");
  });

  it("keeps a shared condition rider after a comma closing the damage alternative", () => {
    const result = parse("Hit: 8 (2d6 + 1) Necrotic damage, or 4 (1d6 + 1) Necrotic damage if the swarm is Bloodied, and the target has the Poisoned condition.");
    expect(result.normal).toEqual([0]);
    expect(result.normalText).toContain("Poisoned");
    expect(result.modes[0].text).not.toContain("Poisoned");
  });

  it("replaces a complete group of damage parts", () => {
    const result = parse("Hit: 4 (1d6 + 1) Bludgeoning damage plus 2 (1d4) Fire damage, or 8 (2d6 + 1) Bludgeoning damage plus 5 (2d4) Fire damage while enlarged.");
    expect(result.normal).toEqual([0, 1]);
    expect(result.modes).toMatchObject([{ parts: [2, 3] }]);
  });

  it.each(["Acid", "Cold"])("assumes the acid alternative replaces the whole group, including its %s rider", (type) => {
    const result = parse(`Hit: 7 (2d6) Acid damage plus 3 (1d6) ${type} damage, or 14 (4d6) Acid damage while enlarged.`);
    expect(result.normal).toEqual([0, 1]);
    expect(result.modes).toMatchObject([{ name: "Enlarged Attack", parts: [2] }]);
    expect(result.warnings).toEqual([]);
  });

  it("preserves a larger group when the alternative's type does not identify it", () => {
    const result = parse("Hit: 7 (2d6) Acid damage plus 3 (1d6) Cold damage, or 14 (4d6) Fire damage while enlarged.");
    expect(result.normal).toEqual([0, 1, 2]);
    expect(result.modes).toEqual([]);
    expect(result.warnings).toEqual(["Alternative damage group does not match the preceding hit"]);
  });

  it("trims trailing condition punctuation before a shared damage rider", () => {
    const result = parse("Hit: 4 (1d6 + 1) Slashing damage, or 6 (1d6 + 3) Slashing damage while raging, plus 2 (1d4) Fire damage.");
    expect(result.modes).toMatchObject([{ condition: "while raging", parts: [1, 2] }]);
    expect(result.normal).toEqual([0, 2]);
  });

  it.each([
    ["the beast is grappling another creature or is on the ground", "Conditional Attack"],
    ["the target is a Construct or is holding an object", "Conditional Attack"],
    ["the target is a fiend or an undead", "Attack against Fiend or Undead"],
    ["the beast is on the ground or floor", "Grounded Attack"],
    ["the beast has half its hit points or fewer", "Bloodied Attack"],
    ["the target is Small or smaller and the beast moved 10 feet", "Moving Attack"],
  ])("names the whole condition: %s", (condition, name) => {
    const result = parse(`Hit: 4 (1d6 + 1) Slashing damage, or 6 (1d6 + 3) Slashing damage if ${condition}.`);
    expect(result.modes).toMatchObject([{ name, condition }]);
  });

  it("does not mistake condition expiry for ongoing damage", () => {
    const result = parse("Hit: 4 (1d6 + 1) Slashing damage plus 2 (1d4) Poison damage, and the target has the Poisoned condition until the start of the beast's next turn. If the target is already Poisoned, it instead takes an extra 2 (1d4) Poison damage.");
    expect(result.modes).toMatchObject([{ name: "Attack against Poisoned Target", condition: "the target is already Poisoned", parts: [0, 1, 2] }]);
    expect(result.normal).toEqual([0, 1]);
  });

  it.each([
    "Hit: 4 (1d6 + 1) Piercing damage plus 2 (1d4) Fire damage.",
    "Hit: 4 (1d6 + 1) Piercing damage, or 5 (1d8 + 1) Piercing damage if used with two hands.",
    "Hit: 4 (1d6 + 1) Piercing damage, or 5 (1d8 + 1) Piercing damage when held with two claws.",
    "Hit: 4 (1d6 + 1) Piercing damage. The target makes a saving throw or takes 2 (1d4) Fire damage if it is Bloodied.",
  ])("does not create modes for %s", (text) => {
    expect(parse(text).modes).toEqual([]);
  });

  it("reports unrecognized conditions without changing damage", () => {
    const result = parse("Hit: 4 (1d6 + 1) Piercing damage, or 5 (1d8 + 1) Piercing damage if a mysterious bell rang.");
    expect(result.modes).toEqual([]);
    expect(result.normal).toEqual([0, 1]);
    expect(result.warnings).toHaveLength(1);
  });

  it("preserves a true versatile choice combined with conditional extra damage", () => {
    const result = parse("Hit: 4 (1d6 + 1) Piercing damage, or 5 (1d8 + 1) Piercing damage if used with two hands. If the target is Prone, it takes an extra 2 (1d4) Cold damage.");
    expect(result.modes).toEqual([]);
    expect(result.normal).toEqual([0, 1, 2]);
    expect(result.warnings).toEqual(["Conditional damage combined with versatile weapon use requires explicit combined modes"]);
  });
});
