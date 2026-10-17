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
    "Hit: 4 (1d6 + 1) Piercing damage. If the target is a creature, it must succeed on a DC 13 Strength saving throw or take an extra 3 (1d6) Piercing damage.",
  ])("does not create modes for %s", (text) => {
    expect(parse(text).modes).toEqual([]);
  });

  it("names an unrecognized condition as a conditional attack", () => {
    const result = parse("Hit: 4 (1d6 + 1) Piercing damage, plus 5 (1d8) Cold damage if Bjornhild uses Auril's Blessing.");
    expect(result.warnings).toEqual([]);
    expect(result.normal).toEqual([0]);
    expect(result.modes).toMatchObject([{ name: "Conditional Attack", condition: "Bjornhild uses Auril's Blessing", parts: [0, 1] }]);
  });

  it.each([
    "Hit: 4 (1d6 + 1) Piercing damage. If the urdefhan scores a Critical Hit, the target takes an extra 2 (1d4) Slashing damage.",
    "Hit: 4 (1d6 + 1) Piercing damage. Critical Hit: If the target is a shape-shifted creature, it takes an additional 4 (1d8) Slashing damage.",
  ])("keeps reporting conditions no attack mode stands in for: %s", (text) => {
    const result = parse(text);
    expect(result.modes).toEqual([]);
    expect(result.normal).toEqual([0, 1]);
    expect(result.warnings).toHaveLength(1);
  });

  it("keeps a true versatile choice beside conditional extra damage", () => {
    const result = parse("Hit: 4 (1d6 + 1) Piercing damage, or 5 (1d8 + 1) Piercing damage if used with two hands. If the target is Prone, it takes an extra 2 (1d4) Cold damage.");
    expect(result.warnings).toEqual([]);
    expect(result.normal).toEqual([0]);
    expect(result.versatile).toEqual([1]);
    expect(result.modes).toMatchObject([{ name: "Attack against Prone Target", operation: "add", parts: [0, 2] }]);
  });

  it("keeps a versatile choice and an alternative with a trailing rider", () => {
    const result = parse("Hit: 3 (1d6) Bludgeoning damage, 4 (1d8) Bludgeoning damage if wielded with two hands, or 6 (1d8 + 2) Bludgeoning damage with shillelagh.");
    expect(result.warnings).toEqual([]);
    expect(result.normal).toEqual([0]);
    expect(result.versatile).toEqual([1]);
    expect(result.modes).toMatchObject([{ name: "Shillelagh Attack", operation: "replace", parts: [2] }]);
  });

  it("shares a rider after a versatile choice with both attacks", () => {
    const result = parse("Hit: 7 (1d6 + 4) Piercing damage, or 8 (1d8 + 4) Piercing damage if used with two hands to make a melee attack, plus 3 (1d6) Force damage if the reigar is wearing their talarith.");
    expect(result.warnings).toEqual([]);
    expect(result.normal).toEqual([0]);
    expect(result.versatile).toEqual([1]);
    expect(result.modes).toMatchObject([{ name: "Conditional Attack", parts: [0, 2] }]);
  });

  it("reads a plus after a versatile alternative as a rider, not an alternative", () => {
    const result = parse("Hit: 8 (1d8 + 4) Slashing damage, or 9 (1d10 + 4) if used with two hands, plus 18 (4d8) Force damage.");
    expect(result.warnings).toEqual([]);
    expect(result.modes).toEqual([]);
  });

  it.each([
    ["Hit: 9 (2d6 + 2) Piercing damage in melee or 5 (1d6 + 2) Piercing damage at range.", "Ranged Attack", "at range"],
    ["Hit: 10 (2d4 + 5) Piercing damage when used as a melee weapon, or 7 (1d4 + 5) Piercing damage when used as a ranged weapon.", "Ranged Attack", "when used as a ranged weapon"],
    ["Hit: 5 (1d4 + 3) Piercing damage, or 8 (2d4 + 3) Piercing damage if used to make a melee attack.", "Melee Attack", "used to make a melee attack"],
    ["Hit: 2 (1d4) Bludgeoning damage, or 8 (1d8 + 4) Bludgeoning damage with shillelagh.", "Shillelagh Attack", "with shillelagh"],
    ["Hit: 8 (1d12 + 2) Piercing damage, or 11 (1d12 + 5) Piercing damage while mounted.", "Mounted Attack", "while mounted"],
    ["Hit: 10 (2d6 + 3) Necrotic damage, or 13 (3d6 + 3) Necrotic damage if the target can't see the lightthief.", "Unseen Attack", "the target can't see the lightthief"],
    ["Hit: 6 (1d6 + 3) Piercing damage, or 9 (2d6 + 3) Piercing damage if the target is Medium or larger.", "Attack against Medium or Larger Target", "the target is Medium or larger"],
  ])("names the alternative in %s", (text, name, condition) => {
    const result = parse(text);
    expect(result.warnings).toEqual([]);
    expect(result.normal).toEqual([0]);
    expect(result.modes).toMatchObject([{ name, condition, operation: "replace", parts: [1] }]);
  });

  it.each([
    ["Hit: 3 (1d4 + 1) Piercing damage. If the target is a creature that is Large or bigger, it takes an extra 5 (1d10) Piercing damage.", "Attack against Large or Larger Target"],
    ["Hit: 12 (2d6 + 5) Bludgeoning damage. If the willow is on fire, this attack deals an extra 3 (1d6) Fire damage.", "Conditional Attack"],
    ["Hit: 7 (2d4 + 2) Piercing damage, plus 7 (2d6) Piercing damage if Leptonectes swam 40+ ft. straight towards the target immediately before the hit.", "Moving Attack"],
  ])("adds the extra damage in %s", (text, name) => {
    const result = parse(text);
    expect(result.warnings).toEqual([]);
    expect(result.normal).toEqual([0]);
    expect(result.modes).toMatchObject([{ name, operation: "add", parts: [0, 1] }]);
  });

  it("replaces only the rider a dice-only alternative of its type stands for", () => {
    const result = parse("Hit: 9 (1d8 + 5) Slashing damage plus 4 (1d8) Radiant damage, or 9 (2d8) Radiant damage if the target has any remaining spell slots.");
    expect(result.warnings).toEqual([]);
    expect(result.normal).toEqual([0, 1]);
    expect(result.modes).toMatchObject([{ name: "Conditional Attack", parts: [0, 2] }]);
  });

  it("builds one mode per independent clause", () => {
    const result = parse("Hit: 6 (1d6 + 3) Force damage, or 10 (2d6 + 3) Force damage while enlarged. If the soulblade has advantage on the attack roll, the attack deals an extra 3 (1d6) Force damage.");
    expect(result.warnings).toEqual([]);
    expect(result.normal).toEqual([0]);
    expect(result.modes).toMatchObject([
      { name: "Enlarged Attack", operation: "replace", parts: [1] },
      { name: "Attack with Advantage", operation: "add", parts: [0, 2] },
    ]);
    expect(result.normalText).not.toContain("enlarged");
    expect(result.normalText).not.toContain("advantage");
  });

  it("reports an alternative to another clause's damage", () => {
    const result = parse("Hit: 8 (1d8 + 4) Piercing damage, or 13 (2d8 + 4) Piercing damage while enlarged. If the minotaur moved at least 10 feet straight toward the target immediately before it hit, the target takes an extra 4 (1d8) Piercing damage, or 9 (2d8) Piercing damage if the minotaur is enlarged.");
    expect(result.modes).toEqual([]);
    expect(result.normal).toEqual([0, 1, 2, 3]);
    expect(result.warnings).toHaveLength(1);
  });

  it("reads a different roll before a type choice as an alternative", () => {
    const result = parse("Hit: 36 (8d8) Slashing damage (the swarm's choice), or 18 (4d8) Slashing damage (the swarm's choice) if the swarm has half of its hit points or fewer.");
    expect(result.modes).toEqual([]);
    expect(result.warnings).toEqual(["Alternative damage has no recognized condition boundary"]);
  });

  it("does not read a damage type choice as an alternative", () => {
    const result = parse("Hit: 13 (1d10 + 8) Bludgeoning damage plus 10 (3d6) Necrotic damage or (3d6) Radiant damage (the son's choice).");
    expect(result.warnings).toEqual([]);
    expect(result.modes).toEqual([]);
  });
});
