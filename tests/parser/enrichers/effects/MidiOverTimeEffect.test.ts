// Mock the barrel/circular-dependency chains the same way ChangeHelper.test does:
// MidiOverTimeEffect imports DDBEffectHelper directly (circular via effects/_module).
import { describe, it, expect, vi } from "vitest";

import MidiOverTimeEffect from "../../../../src/parser/enrichers/effects/MidiOverTimeEffect";

describe("MidiOverTimeEffect.resolveOverTimeDc", () => {
  it("returns the numeric DC when the stat block gives a literal", () => {
    expect(MidiOverTimeEffect.resolveOverTimeDc({ dc: { formula: "15", calculation: "" } })).toBe(15);
  });

  it("returns the spellcasting rollData reference when there is no literal DC", () => {
    expect(MidiOverTimeEffect.resolveOverTimeDc({ dc: { formula: "", calculation: "spellcasting" } }))
      .toBe("@attributes.spell.dc");
  });

  it("returns an ability rollData reference for an ability-derived DC", () => {
    expect(MidiOverTimeEffect.resolveOverTimeDc({ dc: { formula: "", calculation: "wis" } }))
      .toBe("@abilities.wis.dc");
  });

  it("returns null when there is no usable DC", () => {
    expect(MidiOverTimeEffect.resolveOverTimeDc({ dc: { formula: "", calculation: "" } })).toBeNull();
    expect(MidiOverTimeEffect.resolveOverTimeDc(null)).toBeNull();
    expect(MidiOverTimeEffect.resolveOverTimeDc(undefined)).toBeNull();
  });

  it("prefers the literal DC even when a calculation is also present", () => {
    expect(MidiOverTimeEffect.resolveOverTimeDc({ dc: { formula: "13", calculation: "spellcasting" } })).toBe(13);
  });
});
