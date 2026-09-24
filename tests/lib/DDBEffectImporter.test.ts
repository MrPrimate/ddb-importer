vi.mock("../../src/lib/CompendiumHelper", () => ({
  default: {
    getCompendiumLabel: vi.fn((type: string) => (type === "items" ? "world.ddb-items" : "world.ddb-effects")),
    getCompendiumType: vi.fn(),
  },
}));

import DDBEffectImporter from "../../src/lib/DDBEffectImporter";

/** The fixtures are deliberately minimal, so they are narrowed to the item union in one place. */
function asItem(document: object): TAll5eItemDocuments {
  return document as unknown as TAll5eItemDocuments;
}

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
    const a = DDBEffectImporter.standaloneEffectId({ documentName: "Silence", effectName: "Silenced", rules: "2024" });
    const b = DDBEffectImporter.standaloneEffectId({ documentName: "Silence", effectName: "Silenced", rules: "2024" });
    expect(a).toBe(b);
    expect(a).toHaveLength(16);
    expect(a).toMatch(/^ddb[a-zA-Z0-9]{13}$/);
    expect(DDBEffectImporter.standaloneEffectId({ documentName: "Aura of Life", effectName: "Aura of Life", rules: "2024" })).not.toBe(a);
  });

  it("splits the 2014 and 2024 versions of a same-named document into separate compendium ids", () => {
    const cases = [
      ["Silence", "Silenced"],
      ["Spirit Guardians", "Spirit Guardians"],
      // six short words: the name alone truncates to one or two characters a word
      ["Aura of Protection", "Aura of Protection"],
      // one long word: the ruleset must survive the truncation
      ["Antimagicfieldextendedname", "Antimagicfieldextendedname"],
    ];
    for (const [documentName, effectName] of cases) {
      const legacy = DDBEffectImporter.standaloneEffectId({ documentName, effectName, rules: "2014" });
      const modern = DDBEffectImporter.standaloneEffectId({ documentName, effectName, rules: "2024" });
      expect(legacy, documentName).not.toBe(modern);
      expect(legacy, documentName).toMatch(/^ddb[a-zA-Z0-9]{13}$/);
      expect(modern, documentName).toMatch(/^ddb[a-zA-Z0-9]{13}$/);
      expect(DDBEffectImporter.standaloneEffectId({ documentName, effectName, rules: "2014" })).toBe(legacy);
      expect(DDBEffectImporter.standaloneEffectId({ documentName, effectName, rules: "2024" })).toBe(modern);
    }
  });

  it("keeps distinct names distinct once the ruleset takes its share of the id", () => {
    const protection = DDBEffectImporter.standaloneEffectId({ documentName: "Aura of Protection", effectName: "Aura of Protection", rules: "2024" });
    const purity = DDBEffectImporter.standaloneEffectId({ documentName: "Aura of Purity", effectName: "Aura of Purity", rules: "2024" });
    expect(protection).not.toBe(purity);
  });

  it("leaves an explicit shared key ruleset-free", () => {
    const key = "Evolved Studious";
    const legacy = DDBEffectImporter.standaloneEffectId({ key, documentName: "A", effectName: "B", rules: "2014" });
    const modern = DDBEffectImporter.standaloneEffectId({ key, documentName: "C", effectName: "D", rules: "2024" });
    expect(legacy).toBe(modern);
    expect(legacy).toHaveLength(16);
  });

  it("keys the ruleset on the document source, falling back to the enricher's ruleset", () => {
    expect(DDBEffectImporter.documentRules({ system: { source: { rules: "2014" } } }, false)).toBe("2014");
    expect(DDBEffectImporter.documentRules({ system: { source: { rules: "2024" } } }, true)).toBe("2024");
    expect(DDBEffectImporter.documentRules({ system: { source: { rules: null } } }, true)).toBe("2014");
    expect(DDBEffectImporter.documentRules({ system: {} }, false)).toBe("2024");
    expect(DDBEffectImporter.documentRules({}, true)).toBe("2014");
  });

  it("turns a ruleset into a short id-safe postfix", () => {
    expect(DDBEffectImporter.rulesetPostfix("2014")).toBe("14");
    expect(DDBEffectImporter.rulesetPostfix("2024")).toBe("24");
    expect(DDBEffectImporter.rulesetPostfix(null)).toBeNull();
    expect(DDBEffectImporter.rulesetPostfix("")).toBeNull();
  });

  it("builds compendium uuids for the effects pack", () => {
    expect(DDBEffectImporter.effectUuid("ddbSilenceSilencd")).toBe("Compendium.world.ddb-effects.ActiveEffect.ddbSilenceSilencd");
  });

  it("extracts standalone effects, resolves behavior effect names to uuids and strips the flag", () => {
    const spell = makeSpell();
    const effects = DDBEffectImporter.extractStandaloneEffects([asItem(spell)]);

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
    const effects = DDBEffectImporter.extractStandaloneEffects([asItem(a), asItem(b)]);

    expect(effects).toHaveLength(1);
    expect(b.system.activities.act1.behaviors[0].config.effects).toEqual(["Compendium.dnd5e.effects.ActiveEffect.phbeffSilenced00"]);
  });

  it("is a no-op for documents without standalone effects", () => {
    const doc = { name: "Plain", flags: { ddbimporter: {} }, system: { activities: {} } };
    expect(DDBEffectImporter.extractStandaloneEffects([asItem(doc)])).toEqual([]);
  });

  it("points an applied copy at its compendium original, even on documents with nothing to extract", () => {
    const doc = {
      name: "Studious Blade of the Guardian",
      type: "weapon",
      flags: { ddbimporter: {} },
      system: { activities: {} },
      effects: [
        { _id: "ddbEvolvedStudio", type: "enchantment", flags: { ddbimporter: { standaloneOrigin: "ddbEvolvedStudio" } } },
        { _id: "ddbRiderVigilant", flags: { ddbimporter: {} } },
      ],
    };
    expect(DDBEffectImporter.extractStandaloneEffects([asItem(doc)])).toEqual([]);
    const [enchantment, rider] = doc.effects as any[];
    expect(enchantment.origin).toBe("Compendium.world.ddb-effects.ActiveEffect.ddbEvolvedStudio");
    expect(enchantment.system.origin.effect).toBe(enchantment.origin);
    expect(enchantment.flags.ddbimporter.standaloneOrigin).toBeUndefined();
    expect(rider.origin).toBeUndefined();
  });

  it("points an applied enchantment at its host item's enchant activity and profile", () => {
    const doc = {
      name: "Studious Blade of the Guardian",
      type: "weapon",
      flags: { ddbimporter: {} },
      system: { activities: {} },
      effects: [
        {
          _id: "ddbEvolvedStudio",
          type: "enchantment",
          flags: { ddbimporter: { enchantmentOrigin: { itemId: "ddbHostStudious0", activityId: "ddbApplyStudious", profileId: "ddbEvolvedStudio" } } },
        },
      ],
    };
    DDBEffectImporter.extractStandaloneEffects([asItem(doc)]);
    const [enchantment] = doc.effects as any[];
    const uuid = "Compendium.world.ddb-items.Item.ddbHostStudious0.Activity.ddbApplyStudious";
    expect(enchantment.origin).toBe(uuid);
    expect(enchantment.system.origin).toEqual({ activity: uuid, profile: "ddbEvolvedStudio" });
    expect(enchantment.flags.dnd5e.enchantmentProfile).toBe("ddbEvolvedStudio");
    expect(enchantment.flags.ddbimporter.enchantmentOrigin).toBeUndefined();
  });

  it("keeps a folder parent an effect shared by several documents already names", () => {
    const shared = { name: "Evolved Magic Item Properties", type: "item", bookCode: "AU", isLegacy: false };
    const doc = {
      name: "Blade of the Guardian",
      type: "weapon",
      flags: { ddbimporter: { standaloneEffects: [{ _id: "ddbEvolvedStudio", name: "Studious", flags: { ddbimporter: { parent: shared } } }] } },
      system: { activities: {} },
    };
    const [effect] = DDBEffectImporter.extractStandaloneEffects([asItem(doc)]);
    expect(effect.flags?.ddbimporter?.parent).toEqual(shared);
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
    expect(DDBEffectImporter.parentType(asItem({ name: "X", ...doc }))).toBe(expected);
  });

  it("stamps the declaring document on each extracted effect", () => {
    const spell = { ...makeSpell(), system: { ...makeSpell().system, source: { book: "PHB-2024" } } };
    spell.flags.ddbimporter = { ...spell.flags.ddbimporter, legacy: false } as any;
    const [effect] = DDBEffectImporter.extractStandaloneEffects([asItem(spell)]);
    expect(effect.flags?.ddbimporter?.parent).toEqual({ name: "Silence", type: "spell", bookCode: "PHB-2024", isLegacy: false });
  });
});
