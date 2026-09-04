/**
 * Illusory Dragon: the spell summons the importer-built dragon actor, and the
 * dragon's own features are shaped by the monster/IllusoryDragon enrichers.
 *
 * The spell audit replays one printing per capture and never builds the summon
 * actor, so the 2014/2024 dice split on both sides and the profile key the spell
 * asks for are pinned here. The vi.mock preamble is the SpellEnrichers.test.ts one.
 */
const loggerMock = vi.hoisted(() => ({
  warn: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  verbose: vi.fn(),
}));

const parserLib = vi.hoisted(() => ({ DDBDataUtils: {} as any, DDBTemplateStrings: {} as any }));
const modules = vi.hoisted(() => ({ midiQolInstalled: true }));

vi.mock("../../../src/lib/_module", async () => ({
  logger: loggerMock,
  utils: (await vi.importActual<any>("../../../src/lib/Utils")).default,
}));
vi.mock("../../../src/parser/spells/CharacterSpellFactory", () => ({ default: class {} }));
vi.mock("../../../src/parser/spells/DDBSpell", () => ({ default: class {} }));
vi.mock("../../../src/parser/lib/_module", () => parserLib);
vi.mock("../../../src/parser/enrichers/effects/_module", async () => ({
  AutoEffects: { effectModules: () => modules },
  EnchantmentEffects: {},
  ChangeHelper: (await vi.importActual<any>("../../../src/parser/enrichers/effects/ChangeHelper")).default,
  BehaviorHelper: (await vi.importActual<any>("../../../src/parser/enrichers/effects/BehaviorHelper")).default,
  SRDEffects: (await vi.importActual<any>("../../../src/parser/enrichers/effects/SRDEffects")).default,
  EffectGenerator: {},
}));

import IllusoryDragonSpell from "../../../src/parser/enrichers/spell/IllusoryDragon";
import FrightfulAppearance from "../../../src/parser/enrichers/monster/IllusoryDragon/FrightfulAppearance";
import BreathWeapon from "../../../src/parser/enrichers/monster/IllusoryDragon/BreathWeapon";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

const SIX_TYPES = ["acid", "cold", "fire", "lightning", "necrotic", "poison"];

describe("Illusory Dragon spell", () => {
  it("summons the ruleset's dragon profile with matched saves and keeps both saves on the spell", () => {
    const modern = makeEnricherData(IllusoryDragonSpell, { name: "Illusory Dragon" }) as any;
    expect(modern.type).toBe("summon");
    expect(modern.generateSummons).toBe(true);
    expect(modern.activity).toMatchObject({
      name: "Summon Dragon",
      noTemplate: true,
      profileKeys: [{ count: 1, name: "IllusoryDragon2024" }],
      summons: { match: { saves: true, attacks: false } },
      data: { creatureSizes: ["huge"] },
    });
    expect(modern.override.data.flags.ddbimporter.disposition.match).toBe(true);

    const [fear, breath] = modern.additionalActivities;
    expect(fear.init).toEqual({ name: "Frightful Appearance (Wisdom Save)", type: "save" });
    expect(fear.build.noSpellslot).toBe(true);
    expect(fear.build.saveOverride.ability).toEqual(["wis"]);
    expect(fear.overrides.activationType).toBe("special");
    expect(breath.init).toEqual({ name: "Breath (Intelligence Save)", type: "save" });
    expect(breath.build.noSpellslot).toBe(true);
    expect(breath.build.saveOverride.ability).toEqual(["int"]);
    expect(breath.build.onSave).toBe("half");
    expect(breath.build.damageParts[0]).toMatchObject({ number: 6, denomination: 6, types: SIX_TYPES });
    expect(breath.build.targetOverride.template).toMatchObject({ type: "cone", size: "60" });
    expect(breath.overrides.activationType).toBe("bonus");

    const [frightened] = modern.effects;
    expect(frightened.activityMatch).toBe("Frightful Appearance (Wisdom Save)");
    expect(frightened.statuses).toEqual(["Frightened"]);
  });

  it("asks for the 2014 profile and the XGtE 7d6 breath in 2014", () => {
    const legacy = makeEnricherData(IllusoryDragonSpell, { name: "Illusory Dragon", is2014: true }) as any;
    expect(legacy.activity.profileKeys).toEqual([{ count: 1, name: "IllusoryDragon2014" }]);
    const breath = legacy.additionalActivities.find((a: any) => a.init.name === "Breath (Intelligence Save)");
    expect(breath.build.damageParts[0].number).toBe(7);
  });
});

describe("Illusory Dragon summon features", () => {
  it("Frightful Appearance is a special-activation Wisdom save that frightens enemies", () => {
    const e = makeEnricherData(FrightfulAppearance, { name: "Frightful Appearance", actions: null }) as any;
    expect(e.type).toBe("save");
    expect(e.clearAutoEffects).toBe(true);
    expect(e.activity).toMatchObject({
      targetType: "enemy",
      activationType: "special",
      data: {
        range: { units: "spec" },
        save: { ability: ["wis"], dc: { calculation: "spellcasting" } },
        damage: { parts: [] },
      },
    });
    expect(e.effects).toHaveLength(1);
    expect(e.effects[0].statuses).toEqual(["Frightened"]);
    expect(e.effects[0].options.durationSeconds).toBe(60);
  });

  it("Breath Weapon is a bonus-action 60-foot cone Intelligence save for half damage", () => {
    const modern = makeEnricherData(BreathWeapon, { name: "Breath Weapon", actions: null }) as any;
    expect(modern.type).toBe("save");
    expect(modern.activity).toMatchObject({
      targetType: "creature",
      activationType: "bonus",
      data: {
        target: { override: true, template: { type: "cone", size: "60", units: "ft" } },
        save: { ability: ["int"], dc: { calculation: "spellcasting" } },
        damage: { onSave: "half" },
      },
    });
    expect(modern.activity.data.damage.parts).toHaveLength(1);
    expect(modern.activity.data.damage.parts[0]).toMatchObject({ number: 6, denomination: 6, types: SIX_TYPES });

    const legacy = makeEnricherData(BreathWeapon, { name: "Breath Weapon", actions: null, is2014: true }) as any;
    expect(legacy.activity.data.damage.parts[0].number).toBe(7);
  });
});
