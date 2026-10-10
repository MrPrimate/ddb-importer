// Class advancement linking finds the character's features by DDB name. A species trait can share
// that name with a class feature (Warforged and Ranger "Tireless"), and racial traits are parsed
// first, so the class lookup must be able to skip documents of other DDB types.

import DDBCharacter from "../../../src/parser/DDBCharacter";

function feature(name: string, type: string) {
  return { name, flags: { ddbimporter: { originalName: name, type } } };
}

function lookup(features: any[], featureName: string, options: Parameters<DDBCharacter["getDataFeature"]>[1] = {}) {
  const character = { data: { actions: [], features } };
  return DDBCharacter.prototype.getDataFeature.call(character as unknown as DDBCharacter, featureName, options);
}

describe("DDBCharacter.getDataFeature", () => {
  const trait = feature("Tireless", "race");
  const classFeature = feature("Tireless", "class");

  it("returns the first name match when no DDB type is given", () => {
    expect(lookup([trait, classFeature], "Tireless")).toBe(trait);
  });

  it("skips a same-named species trait when restricted to class features", () => {
    expect(lookup([trait, classFeature], "Tireless", { ddbTypes: ["class"] })).toBe(classFeature);
  });

  it("finds nothing when only a different DDB type carries the name", () => {
    expect(lookup([trait], "Tireless", { ddbTypes: ["class"] })).toBeUndefined();
  });

  it("still matches the class-name hint form", () => {
    expect(lookup([trait, classFeature], "Tireless (Ranger)", { hints: ["Ranger"], ddbTypes: ["class"] })).toBe(classFeature);
  });
});
