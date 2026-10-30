import ChangeHelper from "../../../../src/parser/enrichers/effects/ChangeHelper";
import BehaviorHelper from "../../../../src/parser/enrichers/effects/BehaviorHelper";
import SystemHelpers from "../../../../src/lib/SystemHelpers";
import { parseDamageRules } from "../../../../src/parser/enrichers/monster/Generic/_DamageRuleText";
import DDBEnricherData from "../../../../src/parser/enrichers/data/DDBEnricherData";
import { installActivityConfigStubs, setDnd5e61Features } from "../../../_fixtures/ddb/stubs";

const DAMAGE_TYPES = ["acid", "cold", "fire", "lightning", "necrotic", "piercing", "poison", "slashing", "thunder"];

beforeAll(() => {
  installActivityConfigStubs();
});

afterEach(() => {
  setDnd5e61Features(false);
});

describe("SystemHelpers.dnd5eSupports", () => {
  it("answers no for every 6.1 feature on 6.0 config", () => {
    setDnd5e61Features(false);
    for (const feature of Object.keys(SystemHelpers.DND5E_FEATURES) as (keyof typeof SystemHelpers.DND5E_FEATURES)[]) {
      expect(SystemHelpers.dnd5eSupports(feature)).toBe(false);
    }
  });

  it("answers yes once the 6.1 config entries exist", () => {
    setDnd5e61Features(true);
    for (const feature of Object.keys(SystemHelpers.DND5E_FEATURES) as (keyof typeof SystemHelpers.DND5E_FEATURES)[]) {
      expect(SystemHelpers.dnd5eSupports(feature)).toBe(true);
    }
  });
});

describe("ChangeHelper.damageApplicationChanges", () => {
  it("emits nothing before dnd5e 6.1", () => {
    expect(ChangeHelper.ignoreResistanceChanges("fire")).toEqual([]);
  });

  it("emits one damage rule change per type", () => {
    setDnd5e61Features(true);
    const changes = ChangeHelper.ignoreResistanceChanges(["Fire", "cold"], { conditions: ChangeHelper.SPELL_FILTER });
    expect(changes).toEqual([
      { key: "damage", type: "dnd5e.damage.ignore.resistance", value: "fire", priority: 20, conditions: JSON.stringify(ChangeHelper.SPELL_FILTER) },
      { key: "damage", type: "dnd5e.damage.ignore.resistance", value: "cold", priority: 20, conditions: JSON.stringify(ChangeHelper.SPELL_FILTER) },
    ]);
  });

  it("keeps ALL upper case and maps downgrade to its own type", () => {
    setDnd5e61Features(true);
    expect(ChangeHelper.ignoreImmunityChanges("all")[0]).toMatchObject({ type: "dnd5e.damage.ignore.immunity", value: "ALL" });
    expect(ChangeHelper.downgradeImmunityChanges("poison")[0]).toMatchObject({ type: "dnd5e.damage.downgrade", value: "poison" });
  });
});

describe("DDBEnricherData.ignoreDamageReductionEffect", () => {
  const conditions = { k: "activity.name", o: "exact", v: "Harm" };

  it("builds no effect before dnd5e 6.1", () => {
    expect(DDBEnricherData.ignoreDamageReductionEffect("Harm", "ALL", { conditions })).toEqual([]);
  });

  it("ignores resistance and immunity on one passive effect", () => {
    setDnd5e61Features(true);
    const [effect, ...rest] = DDBEnricherData.ignoreDamageReductionEffect("Harm", "ALL", { conditions });
    expect(rest).toEqual([]);
    expect(effect.options).toMatchObject({ transfer: true });
    expect(effect.changes?.map((change) => [change.type, change.value, change.conditions])).toEqual([
      ["dnd5e.damage.ignore.resistance", "ALL", JSON.stringify(conditions)],
      ["dnd5e.damage.ignore.immunity", "ALL", JSON.stringify(conditions)],
    ]);
  });

  it("leaves immunity alone when only resistance is ignored", () => {
    setDnd5e61Features(true);
    const [effect] = DDBEnricherData.ignoreDamageReductionEffect("Bloodboil Strike", "fire", { immunity: false });
    expect(effect.changes?.map((change) => [change.type, change.value, change.conditions])).toEqual([
      ["dnd5e.damage.ignore.resistance", "fire", undefined],
    ]);
  });
});

describe("ChangeHelper.fallingDamageChanges", () => {
  it("emits nothing before dnd5e 6.1", () => {
    expect(ChangeHelper.fallingDamageChanges("It has Immunity to falling damage.")).toEqual([]);
  });

  it("reads plain immunity", () => {
    setDnd5e61Features(true);
    const changes = ChangeHelper.fallingDamageChanges("Sharovipteryx has Immunity to falling damage and can glide.");
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ key: "system.traits.di.value", value: "falling" });
    expect(changes[0].conditions).toBeUndefined();
  });

  it("gates resistance on not being Incapacitated", () => {
    setDnd5e61Features(true);
    const changes = ChangeHelper.fallingDamageChanges("As long as you are not Incapacitated, you have Resistance to falling damage.");
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ key: "system.traits.dr.value", value: "falling" });
    expect(JSON.parse(changes[0].conditions!)).toEqual(ChangeHelper.notStatusFilter("incapacitated"));
  });

  it("splits immunity and the incapacitated fallback to resistance", () => {
    setDnd5e61Features(true);
    const changes = ChangeHelper.fallingDamageChanges("It has Immunity to falling damage, unless Incapacitated in which case it has Resistance to falling damage instead.");
    expect(changes.map((change) => change.key)).toEqual(["system.traits.di.value", "system.traits.dr.value"]);
    expect(JSON.parse(changes[0].conditions!)).toEqual(ChangeHelper.notStatusFilter("incapacitated"));
    expect(JSON.parse(changes[1].conditions!)).toEqual(ChangeHelper.statusFilter("incapacitated"));
  });

  it("ignores a reaction that grants immunity for a moment", () => {
    setDnd5e61Features(true);
    const changes = ChangeHelper.fallingDamageChanges("While attuned to this item, you have Resistance to falling damage. When taking falling damage, you may use your Reaction to instead gain Immunity to falling damage until the end of your turn.");
    expect(changes.map((change) => change.key)).toEqual(["system.traits.dr.value"]);
  });
});

describe("BehaviorHelper.antimagic", () => {
  it("is null before dnd5e 6.1", () => {
    expect(BehaviorHelper.antimagic()).toBeNull();
  });

  it("builds the system antimagic behavior", () => {
    setDnd5e61Features(true);
    expect(BehaviorHelper.antimagic()).toMatchObject({ type: "antimagic", config: {}, name: "Antimagic" });
  });
});

describe("parseDamageRules", () => {
  it("reads a standing trait with two types", () => {
    expect(parseDamageRules("<p>Lightning and thunder damage dealt by Xogomoc ignore damage resistance.</p>", DAMAGE_TYPES)).toEqual([
      { types: ["lightning", "thunder"], rules: ["resistance"], scope: "standing", spellsOnly: false, weaponAttacksOnly: false },
    ]);
  });

  it("reads resistance plus downgrade", () => {
    const [clause] = parseDamageRules("Poison damage dealt by Yserthrax ignores damage resistance and treats damage immunity as damage resistance.", DAMAGE_TYPES);
    expect(clause).toMatchObject({ types: ["poison"], rules: ["resistance", "downgrade"], scope: "standing" });
  });

  it("scopes to spells and weapon attacks", () => {
    expect(parseDamageRules("Necrotic damage dealt by Krull's spells ignores resistance to necrotic damage.", DAMAGE_TYPES)[0])
      .toMatchObject({ types: ["necrotic"], spellsOnly: true });
    expect(parseDamageRules("In addition, damage from her weapon attacks ignores resistance to poison damage.", DAMAGE_TYPES)[0])
      .toMatchObject({ types: ["poison"], weaponAttacksOnly: true, scope: "standing" });
  });

  it("reads an action clause, with ALL when no type is named", () => {
    expect(parseDamageRules("Hit: 7 (1d8 + 3) piercing damage. This attack ignores damage resistance.", DAMAGE_TYPES)[0])
      .toMatchObject({ types: ["ALL"], rules: ["resistance"], scope: "self" });
    expect(parseDamageRules("This attack ignores Resistance and Immunity to Slashing damage.", DAMAGE_TYPES)[0])
      .toMatchObject({ types: ["slashing"], rules: ["resistance", "immunity"], scope: "self" });
  });

  it("skips target-gated and self-protection wording", () => {
    expect(parseDamageRules("The florivore's attacks against floral dragons and plants ignore damage resistances.", DAMAGE_TYPES)).toEqual([]);
    expect(parseDamageRules("This damage ignores resistance, and it cannot reduce the swarm to 0 hit points.", DAMAGE_TYPES)).toEqual([]);
  });
});

describe("ChangeHelper.resolveSelfIdentifier", () => {
  it("swaps the placeholder for the finished document's identifier and leaves other conditions alone", () => {
    setDnd5e61Features(true);
    const self = { k: "item.identifier", o: "exact", v: ChangeHelper.SELF_IDENTIFIER };
    const changes = [
      ...ChangeHelper.ignoreResistanceChanges("fire", { conditions: [self, ChangeHelper.SPELL_FILTER] }),
      ...ChangeHelper.ignoreImmunityChanges("cold", { conditions: ChangeHelper.SPELL_FILTER }),
    ];
    ChangeHelper.resolveSelfIdentifier([{ system: { changes } }], "fire-breath-renamed");
    expect(JSON.parse(changes[0].conditions!)).toEqual([
      { k: "item.identifier", o: "exact", v: "fire-breath-renamed" },
      ChangeHelper.SPELL_FILTER,
    ]);
    expect(changes[1].conditions).toBe(JSON.stringify(ChangeHelper.SPELL_FILTER));
  });
});
