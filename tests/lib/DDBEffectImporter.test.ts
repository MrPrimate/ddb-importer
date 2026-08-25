vi.mock("../../src/lib/CompendiumHelper", () => ({
  default: {
    getCompendiumLabel: vi.fn(() => "world.ddb-effects"),
    getCompendiumType: vi.fn(),
  },
}));

import DDBEffectImporter from "../../src/lib/DDBEffectImporter";

function makeSpell() {
  return {
    name: "Silence",
    type: "spell",
    flags: {
      ddbimporter: {
        standaloneEffects: [
          { _id: "ddbSilenceSilencd", name: "Silenced", system: { changes: [] } },
        ],
      },
    },
    system: {
      activities: {
        act1: {
          _id: "act1",
          type: "utility",
          behaviors: [
            { _id: "b1", type: "applyActiveEffect", config: { effects: ["Silenced"], sizes: [], types: [] } },
            { _id: "b2", type: "difficultTerrain", config: { types: ["web"] } },
          ],
        },
      },
    },
  };
}

describe("DDBEffectImporter", () => {
  it("builds deterministic ids from the document and effect names", () => {
    const a = DDBEffectImporter.standaloneEffectId("Silence", "Silenced");
    const b = DDBEffectImporter.standaloneEffectId("Silence", "Silenced");
    expect(a).toBe(b);
    expect(a).toHaveLength(16);
    expect(a.startsWith("ddb")).toBe(true);
    expect(DDBEffectImporter.standaloneEffectId("Aura of Life", "Aura of Life")).not.toBe(a);
  });

  it("builds compendium uuids for the effects pack", () => {
    expect(DDBEffectImporter.effectUuid("ddbSilenceSilencd")).toBe("Compendium.world.ddb-effects.ActiveEffect.ddbSilenceSilencd");
  });

  it("extracts standalone effects, resolves behavior effect names to uuids and strips the flag", () => {
    const spell = makeSpell();
    const effects = DDBEffectImporter.extractStandaloneEffects([spell]);

    expect(effects.map((e) => e._id)).toEqual(["ddbSilenceSilencd"]);
    expect(spell.system.activities.act1.behaviors[0].config.effects)
      .toEqual(["Compendium.world.ddb-effects.ActiveEffect.ddbSilenceSilencd"]);
    // the difficult terrain behavior is untouched
    expect(spell.system.activities.act1.behaviors[1].config).toEqual({ types: ["web"] });
    expect(spell.flags.ddbimporter.standaloneEffects).toBeUndefined();
  });

  it("leaves full uuids alone and dedupes effects shared by several documents", () => {
    const a = makeSpell();
    const b = makeSpell();
    (b.system.activities.act1.behaviors[0].config as any).effects = ["Compendium.dnd5e.effects.ActiveEffect.phbeffSilenced00"];
    const effects = DDBEffectImporter.extractStandaloneEffects([a, b]);

    expect(effects).toHaveLength(1);
    expect(b.system.activities.act1.behaviors[0].config.effects).toEqual(["Compendium.dnd5e.effects.ActiveEffect.phbeffSilenced00"]);
  });

  it("is a no-op for documents without standalone effects", () => {
    const doc = { name: "Plain", flags: { ddbimporter: {} }, system: { activities: {} } };
    expect(DDBEffectImporter.extractStandaloneEffects([doc])).toEqual([]);
  });
});

describe("DDBEffectImporter parent classification", () => {
  it.each([
    [{ type: "spell" }, "spell"],
    [{ type: "feat", flags: { ddbimporter: { type: "class" } } }, "classFeature"],
    [{ type: "feat", flags: { ddbimporter: { type: "subclass" } } }, "classFeature"],
    [{ type: "feat", flags: { ddbimporter: { type: "race" } } }, "speciesTrait"],
    [{ type: "feat", flags: { ddbimporter: { type: "feat" } } }, "feat"],
    [{ type: "feat", flags: { monsterMunch: {} } }, "monsterFeature"],
    [{ type: "weapon" }, "item"],
    [{ type: "background" }, "background"],
    [{ type: "feat" }, "other"],
  ])("classifies %j as %s", (doc, expected) => {
    expect(DDBEffectImporter.parentType({ name: "X", ...doc })).toBe(expected);
  });

  it("stamps the declaring document on each extracted effect", () => {
    const spell = { ...makeSpell(), system: { ...makeSpell().system, source: { book: "PHB-2024" } } };
    spell.flags.ddbimporter = { ...spell.flags.ddbimporter, legacy: false } as any;
    const [effect] = DDBEffectImporter.extractStandaloneEffects([spell]);
    expect(effect.flags?.ddbimporter?.parent).toEqual({ name: "Silence", type: "spell", bookCode: "PHB-2024", isLegacy: false });
  });
});
