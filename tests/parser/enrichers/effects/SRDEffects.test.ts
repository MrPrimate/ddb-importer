import { describe, expect, it } from "vitest";
import SRDEffects from "../../../../src/parser/enrichers/effects/SRDEffects";
import { SRD_EFFECTS, SRD_EFFECTS_PACK } from "../../../../src/config/dictionary/effects/srdEffects";
import { withSystemVersion } from "../../../_fixtures/systemVersion";

describe("SRDEffects", () => {
  it("builds compendium uuids from the dictionary", () => {
    expect(SRDEffects.condition("silenced")).toBe(`Compendium.${SRD_EFFECTS_PACK}.ActiveEffect.${SRD_EFFECTS.conditions.silenced.id}`);
    expect(SRDEffects.damageResistance("necrotic")).toContain(SRD_EFFECTS.damageResistances.necrotic.id);
    expect(SRDEffects.checkAndSaveAdvantage("str")).toContain(SRD_EFFECTS.checkAndSaveAdvantage.str.id);
    expect(SRDEffects.skillAdvantage("prc")).toContain(SRD_EFFECTS.skillAdvantage.prc.id);
    expect(SRDEffects.speed("fly")).toContain(SRD_EFFECTS.speeds.fly.id);
  });

  it("throws on unknown keys", () => {
    expect(() => SRDEffects.uuid("conditions", "nope" as any)).toThrow(/Unknown SRD effect/);
  });

  it("describes SRD uuids for humans and leaves others alone", () => {
    expect(SRDEffects.describe(SRDEffects.condition("deafened"))).toBe("SRD:Deafened");
    expect(SRDEffects.isSRDUuid(SRDEffects.condition("deafened"))).toBe(true);
    expect(SRDEffects.describe("Compendium.world.ddb-effects.ActiveEffect.abc")).toBe("Compendium.world.ddb-effects.ActiveEffect.abc");
    expect(SRDEffects.isSRDUuid("Silenced")).toBe(false);
  });

  describe("optionalUuid", () => {
    it("returns entries every supported dnd5e ships", () => {
      withSystemVersion("6.0.6", () => {
        expect(SRDEffects.optionalUuid("conditions", "prone")).toBe(SRDEffects.condition("prone"));
      });
    });

    it("withholds entries newer than the running dnd5e", () => {
      withSystemVersion("6.0.6", () => {
        expect(SRDEffects.optionalUuid("conditions", "dodging")).toBeNull();
        expect(SRDEffects.optionalUuid("attackAdvantage", "all")).toBeNull();
      });
      withSystemVersion("6.1.0", () => {
        expect(SRDEffects.optionalUuid("conditions", "dodging")).toContain(SRD_EFFECTS.conditions.dodging.id);
        expect(SRDEffects.optionalUuid("species", "dragonbornAcidBreathWeapon")).toContain(SRD_EFFECTS.species.dragonbornAcidBreathWeapon.id);
      });
      withSystemVersion(undefined, () => {
        expect(SRDEffects.optionalUuid("conditions", "dodging")).toBeNull();
      });
    });

    it("returns null for unknown keys", () => {
      expect(SRDEffects.optionalUuid("conditions", "nope" as any)).toBeNull();
    });
  });

  it("has every dictionary id looking like a 16 character document id", () => {
    for (const [category, entries] of Object.entries(SRD_EFFECTS)) {
      for (const [key, entry] of Object.entries(entries as Record<string, { id: string }>)) {
        expect(entry.id, `${category}.${key}`).toMatch(/^[A-Za-z0-9]{16}$/);
      }
    }
  });
});
