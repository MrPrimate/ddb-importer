/**
 * Pins for the 2024 Dungeon Master's Guide artifact property tables: the compendium ids must
 * stay unique and stable, the enchantment must describe the artifact without renaming it, the
 * host feats must wire their enchant activity to every rider, and the build must write both
 * compendiums only for a GM.
 */
const libMock = vi.hoisted(() => ({
  logger: { warn: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn(), verbose: vi.fn() },
  CompendiumHelper: { getCompendiumType: vi.fn((): unknown => null) },
  DDBCompendiumFolders: class {
    loadCompendium = vi.fn();
    createEffectFoldersForItemDocuments = vi.fn();
    addCompendiumFolderIds = vi.fn();
  },
  DDBEffectImporter: { importEffects: vi.fn() },
  DDBItemImporter: { buildHandler: vi.fn() },
  SystemHelpers: { effectModules: vi.fn(() => ({ ac5eInstalled: false, midiQolInstalled: false })) },
}));

vi.mock("../../../src/lib/_module", async () => ({
  ...libMock,
  utils: (await vi.importActual<any>("../../../src/lib/Utils")).default,
}));

import ArtifactProperties, { ARTIFACT_PROPERTIES } from "../../../src/parser/enrichers/item/_ArtifactProperties";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

function property(name: string, rules: "2014" | "2024" = "2024") {
  return ArtifactProperties.byName(name, rules)!;
}

function tierCounts(rules: "2014" | "2024") {
  return ArtifactProperties.forRules([rules])
    .reduce((acc, p) => ({ ...acc, [p.tier]: (acc[p.tier] ?? 0) + 1 }), {} as Record<string, number>);
}

describe("Artifact property table", () => {
  it("carries the four tables of both printings", () => {
    expect(tierCounts("2024")).toEqual({ minorBeneficial: 9, majorBeneficial: 9, minorDetrimental: 14, majorDetrimental: 12 });
    expect(tierCounts("2014")).toEqual({ minorBeneficial: 9, majorBeneficial: 9, minorDetrimental: 18, majorDetrimental: 19 });
    expect(new Set(ARTIFACT_PROPERTIES.map((p) => `${p.rules} ${p.name.toLowerCase()}`)).size).toBe(ARTIFACT_PROPERTIES.length);
  });

  it("derives unique 16 character ids for every enchantment, rider, activity and host", () => {
    const effects = ArtifactProperties.standaloneEffects();
    const ids = effects.map((effect) => effect._id as string);
    for (const effect of effects) {
      expect(effect.flags?.ddbimporter?.parent?.name).toBe("Artifact Properties");
    }
    for (const p of ARTIFACT_PROPERTIES) {
      ids.push(ArtifactProperties.hostItemId(p), ArtifactProperties.enchantActivityId(p));
      ids.push(...Object.keys(ArtifactProperties.activities(p)));
    }
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toHaveLength(16);
      expect(id.startsWith("ddb")).toBe(true);
    }
  });

  it("recognises the artifact text that refers to the tables", () => {
    expect(ArtifactProperties.mentionsPropertyTables("<li>1 minor beneficial property</li>")).toBe(true);
    expect(ArtifactProperties.mentionsPropertyTables("2 Major Detrimental properties")).toBe(true);
    expect(ArtifactProperties.mentionsPropertyTables("a beneficial effect")).toBe(false);
    expect(ArtifactProperties.mentionsPropertyTables(undefined)).toBe(false);
  });

  it("prefers the proxy-served printed text over the shipped paraphrase", () => {
    const skilled = property("Skilled");
    const config = (globalThis as any).CONFIG;
    const previous = config.DDB;
    config.DDB = { ARTIFACT_PROPERTIES: { "Skilled": "Printed Skilled text.", "Fearless": "", "Skilled (2014)": "Printed 2014 Skilled text." } };
    try {
      expect(ArtifactProperties.text(skilled)).toBe("Printed Skilled text.");
      expect(ArtifactProperties.text(property("Skilled", "2014"))).toBe("Printed 2014 Skilled text.");
      expect(ArtifactProperties.text(property("Fearless"))).toBe(property("Fearless").text);
      expect(ArtifactProperties.hostItem(skilled).system.description.value).toContain("Printed Skilled text.");
    } finally {
      config.DDB = previous;
    }
  });

  it("builds an enchantment that describes the artifact without renaming it", () => {
    const effect = ArtifactProperties.enchantmentEffect(property("Fearless"));
    expect(effect.type).toBe("enchantment");
    expect(effect.transfer).toBe(false);
    expect(effect.system?.changes?.map((c) => [c.key, c.type, c.value])).toEqual([
      ["system.properties", "add", "mgc"],
      ["system.description.value", "override", expect.stringContaining("{}<p><strong>Fearless (Minor Beneficial Artifact Property).</strong>")],
      ["system.attunement", "override", "required"],
    ]);
    // the attunement-time properties do not demand attunement of the item themselves
    const shock = ArtifactProperties.enchantmentEffect(property("Psychic Shock"));
    expect(shock.system?.changes?.map((c) => c.key)).not.toContain("system.attunement");
  });

  it("ships the DM's-choice properties as disabled toggles", () => {
    const skills = ArtifactProperties.riderEffects(property("Skilled"));
    expect(skills).toHaveLength(18);
    expect(skills.every((e) => e.disabled && e.transfer)).toBe(true);
    expect(skills.find((e) => e.name === "Artifact Skill (Stealth)")?.system?.changes?.[0]?.key).toBe("system.skills.ste.value");

    const resistances = ArtifactProperties.riderEffects(property("Resistance"));
    expect(resistances.map((e) => e.system?.changes?.[0]?.value)).toContain("force");
    expect(resistances).toHaveLength(13);

    const drain = ArtifactProperties.riderEffects(property("Ability Drain"));
    expect(drain).toHaveLength(6);
    expect(drain[0].system?.changes?.[0]).toMatchObject({ key: "system.abilities.str.value", value: "2>=3" });

    const sight = ArtifactProperties.riderEffects(property("Tethered Sight"))[0];
    expect(sight.disabled).toBe(true);
    expect(sight.statuses).toEqual(["blinded"]);
  });

  it("applies the always-on riders enabled", () => {
    const [unflinching] = ArtifactProperties.riderEffects(property("Unflinching"));
    expect(unflinching.disabled).toBe(false);
    expect(unflinching.system?.changes?.map((c) => c.value)).toEqual(["blinded", "deafened", "petrified", "stunned"]);
    const [strikes] = ArtifactProperties.riderEffects(property("Force Strikes"));
    expect(strikes.system?.changes?.[0]).toMatchObject({ key: "damage", type: "dnd5e.bonus", value: "1d6[force]" });
    const [vulnerable] = ArtifactProperties.riderEffects(property("Universal Vulnerability"));
    expect(vulnerable.system?.changes?.[0]).toMatchObject({ key: "system.traits.dv.value", value: "ALL" });
  });

  it("builds the granted activities in dnd5e shape", () => {
    // nothing to link for the DM's spell: dnd5e cannot cache a Cast activity without one
    expect(ArtifactProperties.activities(property("Cantrip"))).toEqual({});
    const [level4] = Object.values(ArtifactProperties.activities(property("Level 4 Spell"))) as any[];
    expect(level4).toMatchObject({ type: "utility", name: "Level 4 Spell: Recharge Roll", roll: { formula: "1d6" } });
    expect(level4.uses).toEqual({ spent: 0, max: "1", recovery: [{ period: "dawn", type: "recoverAll" }] });
    expect(level4.consumption.targets).toHaveLength(1);
    expect(ARTIFACT_PROPERTIES.flatMap((p) => Object.values(ArtifactProperties.activities(p))).some((a: any) => a.type === "cast")).toBe(false);

    const [regenerate] = Object.values(ArtifactProperties.activities(property("Regeneration"))) as any[];
    expect(regenerate).toMatchObject({ type: "heal", activation: { type: "turnStart" } });
    expect(regenerate.healing).toMatchObject({ number: 1, denomination: 6, types: ["healing"] });

    const [shock] = Object.values(ArtifactProperties.activities(property("Psychic Shock"))) as any[];
    expect(shock.damage.parts[0]).toMatchObject({ number: 8, denomination: 10, types: ["psychic"] });

    const [deadly] = Object.values(ArtifactProperties.activities(property("Deadly Attunement"))) as any[];
    expect(deadly.save).toEqual({ ability: ["con"], dc: { calculation: "", formula: "10" } });
  });
});

describe("2014 artifact property table", () => {
  it("keeps the 2014 rows apart from the 2024 rows of the same name", () => {
    const skilled2014 = property("Skilled", "2014");
    expect(ArtifactProperties.enchantmentId(skilled2014)).not.toBe(ArtifactProperties.enchantmentId(property("Skilled")));
    expect(ArtifactProperties.enchantmentId(skilled2014).endsWith("14")).toBe(true);
    expect(ArtifactProperties.enchantmentEffect(skilled2014).flags?.ddbimporter?.parent).toMatchObject({ bookCode: "DMG", isLegacy: true });
    expect(ArtifactProperties.textKey(skilled2014)).toBe("Skilled (2014)");
    expect(property("Level 3 Spell", "2014").text).toContain("3rd-level spell");
  });

  it("models the 2014-only rows", () => {
    const [disease] = ArtifactProperties.riderEffects(property("Disease Immunity", "2014"));
    expect(disease.system?.changes?.[0]).toMatchObject({ key: "system.traits.ci.value", value: "diseased" });

    // untyped dice: the extra damage takes the weapon's type
    const [strikes] = ArtifactProperties.riderEffects(property("Weapon Strikes", "2014"));
    expect(strikes.system?.changes?.[0]).toMatchObject({ key: "damage", type: "dnd5e.bonus", value: "1d6" });

    const [walk] = ArtifactProperties.riderEffects(property("Swiftness", "2014"));
    expect(walk.system?.changes?.[0]).toMatchObject({ key: "system.attributes.movement.walk", value: "10" });

    // the spell-save disadvantage exists only as module changes
    expect(ArtifactProperties.riderEffects(property("Spell Susceptibility", "2014"))[0].system?.changes).toEqual([]);
    expect(ArtifactProperties.riderEffects(property("Spell Susceptibility", "2014"), { midi: true, ac5e: true })[0].system?.changes?.map((c) => c.key))
      .toEqual(["flags.midi-qol.magicVulnerability.all", "flags.automated-conditions-5e.save.disadvantage"]);

    const drain = ArtifactProperties.riderEffects(property("Ability Drain", "2014"));
    expect(drain[0].system?.changes?.[0]).toMatchObject({ key: "system.abilities.str.value", value: "2" });

    const lifeForce = Object.values(ArtifactProperties.activities(property("Hostile Life Force", "2014"))) as any[];
    expect(lifeForce.map((a) => a.type)).toEqual(["utility", "save"]);
    expect(lifeForce[1].save).toEqual({ ability: ["cha"], dc: { calculation: "", formula: "20" } });

    const aging = Object.values(ArtifactProperties.activities(property("Aging Attunement", "2014"))) as any[];
    expect(aging.map((a) => [a.type, a.roll?.formula ?? a.save?.dc.formula])).toEqual([["utility", "3d10"], ["save", "10"]]);

    const [jolt] = Object.values(ArtifactProperties.activities(property("Psychic Jolt", "2014"))) as any[];
    expect(jolt.damage.parts[0]).toMatchObject({ number: 4, denomination: 10, types: ["psychic"] });
  });
});

describe("Artifact property host feats", () => {
  it("builds one enchant activity per property whose profile lists every rider", () => {
    const hosts = ArtifactProperties.hostItems();
    expect(hosts).toHaveLength(ARTIFACT_PROPERTIES.length);
    for (const host of hosts) {
      const rules = host.flags.ddbimporter!.is2014 ? "2014" : "2024";
      const p = property(host.flags.ddbimporter!.artifactProperty as string, rules);
      expect(host.type).toBe("feat");
      expect(host.system.type.value).toBe("enchantment");
      expect(host.system.source.rules).toBe(rules);
      expect(host.flags.ddbimporter!.isEffectItem).toBe(true);
      expect(host.flags.ddbimporter!.effectName).toBe(rules === "2014" ? "Artifact Properties (2014)" : "Artifact Properties");
      expect(host.flags.ddbimporter!.is2024).toBe(rules === "2024");
      const enchant = host.system.activities[ArtifactProperties.enchantActivityId(p)] as any;
      expect(enchant.type).toBe("enchant");
      expect(enchant.restrictions.allowMagical).toBe(true);
      const profile = enchant.effects[0];
      expect(profile._id).toBe(ArtifactProperties.enchantmentId(p));
      expect(host.effects!.find((e) => e._id === profile._id)?.type).toBe("enchantment");
      for (const id of profile.riders.activity) expect(host.system.activities[id]).toBeDefined();
      for (const id of profile.riders.effect) expect(host.effects!.find((e) => e._id === id)?.transfer).toBe(true);
      expect(host.flags.dnd5e!.riders).toEqual({ activity: profile.riders.activity, effect: profile.riders.effect });
      for (const effect of host.effects ?? []) expect(effect.flags?.ddbimporter?.parent).toBeUndefined();
    }
  });
});

describe("Artifact property compendium build", () => {
  const originalUser = (globalThis as any).game.user;

  afterEach(() => {
    (globalThis as any).game.user = originalUser;
    libMock.CompendiumHelper.getCompendiumType.mockReturnValue(null);
    vi.clearAllMocks();
  });

  it("writes the effects and host feats for a GM", async () => {
    (globalThis as any).game.user = { isGM: true };
    libMock.CompendiumHelper.getCompendiumType.mockReturnValue({ metadata: { id: "world.ddb-items" } });
    await ArtifactProperties.buildCompendiums({ updateBool: true });
    expect(libMock.DDBEffectImporter.importEffects).toHaveBeenCalledTimes(1);
    expect(vi.mocked(libMock.DDBEffectImporter.importEffects).mock.calls[0][0]).toHaveLength(ArtifactProperties.standaloneEffects().length);
    expect(libMock.DDBItemImporter.buildHandler).toHaveBeenCalledWith("items", expect.any(Array), true, expect.objectContaining({ matchFlags: ["artifactProperty", "is2014"] }));
  });

  it("writes only the rulesets asked for", async () => {
    (globalThis as any).game.user = { isGM: true };
    libMock.CompendiumHelper.getCompendiumType.mockReturnValue({ metadata: { id: "world.ddb-items" } });
    await ArtifactProperties.buildCompendiums({ rules: ["2014"] });
    const hosts = vi.mocked(libMock.DDBItemImporter.buildHandler).mock.calls[0][1] as any[];
    expect(hosts).toHaveLength(55);
    expect(hosts.every((host) => host.flags.ddbimporter.is2014)).toBe(true);
    expect(vi.mocked(libMock.DDBEffectImporter.importEffects).mock.calls[0][0])
      .toHaveLength(ArtifactProperties.standaloneEffects({}, ["2014"]).length);
  });

  it("writes nothing for a player", async () => {
    (globalThis as any).game.user = { isGM: false };
    await ArtifactProperties.buildCompendiums();
    expect(libMock.DDBEffectImporter.importEffects).not.toHaveBeenCalled();
    expect(libMock.DDBItemImporter.buildHandler).not.toHaveBeenCalled();
  });
});
