import { describe, expect, it } from "vitest";
import { matchFields } from "../../../src/parser/character/infusions";

/**
 * `targetItemMatches` clauses on a transferEnchantment flag: scalar fields compare strictly,
 * array fields (the weapon's scraped classFeatures) match by membership.
 */
describe("matchFields", () => {
  const weapon = {
    type: "weapon",
    system: { type: { value: "martialM" } },
    flags: { ddbimporter: { dndbeyond: { classFeatures: ["pactWeapon", "OffHand"] } } },
  } as unknown as TAll5eDocuments;

  it("matches scalar fields with strict equality", () => {
    expect(matchFields(weapon, [{ field: "type", value: "weapon" }])).toBe(true);
    expect(matchFields(weapon, [{ field: "system.type.value", value: "simpleM" }])).toBe(false);
  });

  it("matches an array field when it contains the value", () => {
    expect(matchFields(weapon, [{ field: "flags.ddbimporter.dndbeyond.classFeatures", value: "pactWeapon" }])).toBe(true);
    expect(matchFields(weapon, [{ field: "flags.ddbimporter.dndbeyond.classFeatures", value: "hexWarrior" }])).toBe(false);
  });

  it("fails when the field is missing or any clause fails", () => {
    expect(matchFields(weapon, [{ field: "flags.ddbimporter.pactWeapon", value: true }])).toBe(false);
    expect(matchFields(weapon, [
      { field: "type", value: "weapon" },
      { field: "flags.ddbimporter.dndbeyond.classFeatures", value: "kenseiWeapon" },
    ])).toBe(false);
  });
});
