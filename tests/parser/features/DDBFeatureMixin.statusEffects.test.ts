// @vitest-environment jsdom
// DDBFeatureMixin.dropCoveredStatusEffects: the "Status: X" effect read from a feature's text goes when another
// effect the feature applies already carries its conditions, so the condition is not applied twice or from an
// activity that applies nothing.

// CharacterFeatureFactory must load first, it initialises the feature class chain
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBFeatureMixin from "../../../src/parser/features/DDBFeatureMixin";

function textStatus(id: string, statuses: string[]) {
  const condition = statuses[0];
  return {
    _id: id,
    name: `Status: ${condition[0].toUpperCase()}${condition.slice(1)}`,
    description: `Apply status ${condition}`,
    statuses,
    transfer: false,
  };
}

function hintEffect(id: string, name: string, statuses: string[], { transfer = false } = {}) {
  return { _id: id, name, description: "", statuses, transfer };
}

function link(id: string) {
  return { _id: id, level: { min: null, max: null }, uuid: null };
}

function feature(effects: any[], activities: Record<string, string[]>): any {
  return {
    name: "Example Feature",
    effects,
    system: {
      activities: Object.fromEntries(Object.entries(activities)
        .map(([id, links]) => [id, { _id: id, effects: links.map(link) }])),
    },
  };
}

function links(doc: any) {
  return Object.fromEntries(Object.entries(doc.system.activities)
    .map(([id, activity]: [string, any]) => [id, activity.effects.map((l: any) => l._id)]));
}

describe("DDBFeatureMixin.dropCoveredStatusEffects", () => {
  it("drops the text copy and its links when a linked effect applies the same conditions", () => {
    const doc = feature(
      [textStatus("text", ["blinded", "prone"]), hintEffect("wrath", "Assembly's Wrath", ["blinded", "prone"])],
      { damage: ["text", "wrath"], restore: ["text"] },
    );
    DDBFeatureMixin.dropCoveredStatusEffects(doc);
    expect(doc.effects.map((e: any) => e._id)).toEqual(["wrath"]);
    expect(links(doc)).toEqual({ damage: ["wrath"], restore: [] });
  });

  it("moves the links to a covering effect that no activity links", () => {
    const doc = feature(
      [textStatus("text", ["stunned", "incapacitated"]), hintEffect("stunned", "Stunned", ["stunned", "incapacitated"])],
      { save: ["text"] },
    );
    DDBFeatureMixin.dropCoveredStatusEffects(doc);
    expect(doc.effects.map((e: any) => e._id)).toEqual(["stunned"]);
    expect(links(doc)).toEqual({ save: ["stunned"] });
  });

  it("gives an enricher effect that has no id yet one and moves the links to it", () => {
    const doc = feature(
      [textStatus("text", ["stunned", "incapacitated"]), hintEffect("", "Stunned", ["stunned", "incapacitated"])],
      { save: ["text"] },
    );
    doc.effects[1]._id = null;
    DDBFeatureMixin.dropCoveredStatusEffects(doc);
    expect(doc.effects).toHaveLength(1);
    const id = doc.effects[0]._id;
    expect(id).toEqual(expect.any(String));
    expect(links(doc)).toEqual({ save: [id] });
  });

  it("keeps the text copy when no applied effect carries all of its conditions", () => {
    const doc = feature(
      [
        textStatus("text", ["blinded", "prone"]),
        hintEffect("blind", "Blinded", ["blinded"]),
        hintEffect("aura", "Passive Prone", ["blinded", "prone"], { transfer: true }),
      ],
      { save: ["text", "blind"] },
    );
    DDBFeatureMixin.dropCoveredStatusEffects(doc);
    expect(doc.effects.map((e: any) => e._id)).toEqual(["text", "blind", "aura"]);
    expect(links(doc)).toEqual({ save: ["text", "blind"] });
  });

  it("leaves an enricher effect named like a status alone", () => {
    const doc = feature(
      [hintEffect("named", "Status: Frightened", ["frightened"]), hintEffect("other", "Frightened", ["frightened"])],
      { save: ["named"] },
    );
    DDBFeatureMixin.dropCoveredStatusEffects(doc);
    expect(doc.effects.map((e: any) => e._id)).toEqual(["named", "other"]);
  });
});
