import { applyShapeShiftFormItems } from "../../../src/parser/monster/features/ShapeShiftForms";

function item(name: string, identifier: string): any {
  return { name, img: "icons/svg/item-bag.svg", system: { identifier, activities: {} }, effects: [], flags: {} };
}

function form(_id: string, name: string): any {
  return { _id, name, transfer: false, system: { changes: [] } };
}

/** A shape-shifter with Hybrid and Wolf forms, and the items a lycanthrope restricts by form. */
function lycanthrope() {
  const shifter = item("Shape-Shift", "shape-shift");
  shifter.effects = [form("hybridFormEffect", "Hybrid Form"), form("wolfFormEffect00", "Wolf Form")];
  shifter.system.activities.change = {
    name: "Change Form",
    type: "transform",
    transform: { mode: "form", formless: true },
    effects: [{ _id: "hybridFormEffect" }, { _id: "wolfFormEffect00" }],
  };
  return [
    shifter,
    item("Bite (Wolf or Hybrid Form Only)", "bite-wolf-or-hybrid-form-only"),
    item("Pike (Humanoid or Hybrid Form Only)", "pike-humanoid-or-hybrid-form-only"),
    item("Sling (Humanoid Form Only)", "sling-humanoid-form-only"),
    item("Pack Tactics", "pack-tactics"),
  ];
}

const hiddenBy = (effect: any) => effect.system.changes
  .filter((c: any) => c.key === "items.hidden")
  .map((c: any) => `${c.type}:${c.value}`);

describe("applyShapeShiftFormItems", () => {
  it("hides true-form items in the forms that cannot use them", () => {
    const items = lycanthrope();
    applyShapeShiftFormItems(items);
    const [hybrid, wolf] = items[0].effects;

    expect(hiddenBy(hybrid)).toContain("add:sling-humanoid-form-only");
    expect(hiddenBy(hybrid)).not.toContain("add:pike-humanoid-or-hybrid-form-only");
    expect(hiddenBy(wolf)).toEqual(expect.arrayContaining([
      "add:pike-humanoid-or-hybrid-form-only",
      "add:sling-humanoid-form-only",
    ]));
  });

  it("hides a form-only item through an unlinked transferred True Form that the forms reveal", () => {
    const items = lycanthrope();
    applyShapeShiftFormItems(items);
    const [hybrid, wolf, trueForm] = items[0].effects;

    expect(trueForm).toMatchObject({ name: "True Form", transfer: true });
    expect(hiddenBy(trueForm)).toEqual(["add:bite-wolf-or-hybrid-form-only"]);
    expect(hiddenBy(hybrid)).toContain("subtract:bite-wolf-or-hybrid-form-only");
    expect(hiddenBy(wolf)).toContain("subtract:bite-wolf-or-hybrid-form-only");

    // the reveal has to beat the hide
    const hide = trueForm.system.changes[0];
    const reveal = wolf.system.changes.find((c: any) => c.type === "subtract");
    expect(reveal.priority).toBeGreaterThan(hide.priority);

    // True Form is not one of the selectable forms
    expect(items[0].system.activities.change.effects.map((e: any) => e._id)).toEqual(["hybridFormEffect", "wolfFormEffect00"]);
    expect(trueForm.flags?.ddbimporter?.activityMatch).toBeUndefined();
  });

  it("matches a one-word restriction to a longer form name", () => {
    const shifter = item("Shape-Shift", "shape-shift");
    shifter.effects = [form("batFormEffect000", "Bat Form"), form("mistFormEffect00", "Cloud of Mist Form")];
    shifter.system.activities.change = {
      type: "transform",
      transform: { mode: "form" },
      effects: [{ _id: "batFormEffect000" }, { _id: "mistFormEffect00" }],
    };
    const items = [shifter, item("Gust (Mist Form Only)", "gust-mist-form-only")];
    applyShapeShiftFormItems(items);

    expect(hiddenBy(shifter.effects[0])).toEqual([]);
    expect(hiddenBy(shifter.effects[1])).toEqual(["subtract:gust-mist-form-only"]);
    expect(hiddenBy(shifter.effects[2])).toEqual(["add:gust-mist-form-only"]);
  });

  it("leaves unrestricted items and monsters without a form-mode transform alone", () => {
    const items = lycanthrope();
    applyShapeShiftFormItems(items);
    expect(items[4].effects).toEqual([]);
    expect(items[0].effects.flatMap(hiddenBy).some((c: string) => c.endsWith("pack-tactics"))).toBe(false);

    const plain = [item("Change Shape", "change-shape"), item("Bite (Wolf Form Only)", "bite-wolf-form-only")];
    plain[0].system.activities.use = { type: "utility", effects: [] };
    applyShapeShiftFormItems(plain);
    expect(plain[0].effects).toEqual([]);
  });
});
