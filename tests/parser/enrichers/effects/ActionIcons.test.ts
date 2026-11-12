import { describe, expect, it } from "vitest";
import ActionIcons from "../../../../src/parser/enrichers/effects/ActionIcons";
import SystemHelpers from "../../../../src/parser/lib/SystemHelpers";
import { withSystemVersion } from "../../../_fixtures/systemVersion";

const ICON = "systems/dnd5e/icons/svg/action";

function document(activities: Record<string, { name?: string; img?: string | null }>): any {
  return { system: { activities } };
}

describe("SystemHelpers.dnd5eAtLeast", () => {
  it("compares against the running dnd5e and is false before it loads", () => {
    withSystemVersion("6.1.0", () => {
      expect(SystemHelpers.dnd5eAtLeast("6.1.0")).toBe(true);
      expect(SystemHelpers.dnd5eAtLeast("6.0.3")).toBe(true);
      expect(SystemHelpers.dnd5eAtLeast("6.2.0")).toBe(false);
    });
    withSystemVersion(undefined, () => {
      expect(SystemHelpers.dnd5eAtLeast("6.0.0")).toBe(false);
    });
  });
});

describe("ActionIcons", () => {
  it("gives 6.1 icons only on 6.1, and the Dash icon on 6.0 too", () => {
    withSystemVersion("6.0.6", () => {
      expect(ActionIcons.iconFor("Dash")).toBe(`${ICON}/dash.svg`);
      expect(ActionIcons.iconFor("Disengage")).toBeNull();
    });
    withSystemVersion("6.1.0", () => {
      expect(ActionIcons.iconFor("Disengage")).toBe(`${ICON}/disengage.svg`);
      expect(ActionIcons.iconFor(" Reroll ")).toBe(`${ICON}/reroll.svg`);
    });
  });

  it("matches whole activity names only", () => {
    withSystemVersion("6.1.0", () => {
      expect(ActionIcons.iconFor("Dash and Disengage")).toBeNull();
      expect(ActionIcons.iconFor("Magic")).toBeNull();
      expect(ActionIcons.iconFor(null)).toBeNull();
    });
  });

  it("fills activities without an image and leaves set images alone", () => {
    withSystemVersion("6.1.0", () => {
      const doc = document({
        a: { name: "Trip" },
        b: { name: "Hide", img: "icons/custom/hide.webp" },
        c: { name: "Strike" },
      });
      ActionIcons.apply(doc);
      expect(doc.system.activities.a.img).toBe(`${ICON}/trip.svg`);
      expect(doc.system.activities.b.img).toBe("icons/custom/hide.webp");
      expect(doc.system.activities.c.img).toBeUndefined();
    });
  });
});
