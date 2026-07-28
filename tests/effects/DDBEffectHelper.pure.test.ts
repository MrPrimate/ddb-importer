// Characterization tests for the pure static surface of DDBEffectHelper.
//
// DDBEffectHelper itself is the unit under test, so the DDBEffectHelper module
// is NOT mocked here. Instead the modules its import chain needs are stubbed:
// the config barrel (cycle), the effects barrel (pulled in via lib/_module ->
// DDBItemImporter), DDBMonsterFeature (heavy monster parser, only used by the
// non-pre-parsed damage fallback) and the enricher effects barrel (cycle via
// MidiOverTimeEffect -> DDBEffectHelper).
import { setMockModules } from "../_setup/foundryMocks";

vi.mock("../../src/parser/monster/features/DDBMonsterFeature", () => ({
  default: class {},
}));
import DDBEffectHelper from "../../src/effects/DDBEffectHelper";

const globalAny: any = globalThis;

describe("DDBEffectHelper.filterActivitiesByTypes", () => {
  const activities = {
    aaa: { _id: "id1", type: "attack" },
    bbb: { _id: "id2", type: "save" },
    ccc: { _id: "id3", type: "attack" },
  };

  it("keeps only activities whose type is listed", () => {
    expect(DDBEffectHelper.filterActivitiesByTypes(activities, ["attack"])).toEqual({
      aaa: activities.aaa,
      ccc: activities.ccc,
    });
  });

  it("supports multiple types", () => {
    expect(DDBEffectHelper.filterActivitiesByTypes(activities, ["attack", "save"])).toEqual(activities);
  });

  it("returns an empty object when the types list is empty", () => {
    // note: empty filter means nothing survives, not everything
    expect(DDBEffectHelper.filterActivitiesByTypes(activities, [])).toEqual({});
  });

  it("returns an empty object when nothing matches", () => {
    expect(DDBEffectHelper.filterActivitiesByTypes(activities, ["utility"])).toEqual({});
  });
});

describe("DDBEffectHelper.filerActivitiesByIds", () => {
  // The method name typo ("filer") is real and pinned deliberately.
  const activities = {
    aaa: { _id: "id1", type: "attack" },
    bbb: { _id: "id2", type: "save" },
  };

  it("keeps only activities whose _id is listed, preserving keys", () => {
    expect(DDBEffectHelper.filerActivitiesByIds(activities, ["id2"])).toEqual({ bbb: activities.bbb });
  });

  it("returns an empty object when the ids list is empty", () => {
    expect(DDBEffectHelper.filerActivitiesByIds(activities, [])).toEqual({});
  });

  it("returns an empty object when no ids match", () => {
    expect(DDBEffectHelper.filerActivitiesByIds(activities, ["nope"])).toEqual({});
  });
});

function makeAttackActivity({
  type = "attack",
  classification = "weapon",
  value = "melee",
  properties = [] as string[],
} = {}): any {
  return {
    type,
    attack: { type: { classification, value } },
    parent: { properties: new Set(properties) },
  };
}

describe("DDBEffectHelper.isAttack", () => {
  it("returns false without an activity", () => {
    expect(DDBEffectHelper.isAttack()).toBe(false);
    expect(DDBEffectHelper.isAttack({})).toBe(false);
  });

  it("returns false when the activity is not an attack", () => {
    expect(DDBEffectHelper.isAttack({ activity: makeAttackActivity({ type: "save" }) })).toBe(false);
  });

  it("returns true for a plain attack activity with no extra constraints", () => {
    expect(DDBEffectHelper.isAttack({ activity: makeAttackActivity() })).toBe(true);
  });

  it("enforces the classification when given", () => {
    const activity = makeAttackActivity({ classification: "spell" });
    expect(DDBEffectHelper.isAttack({ activity, classification: "weapon" })).toBe(false);
    expect(DDBEffectHelper.isAttack({ activity, classification: "spell" })).toBe(true);
  });

  it("enforces the attack type value when given", () => {
    const activity = makeAttackActivity({ value: "melee" });
    expect(DDBEffectHelper.isAttack({ activity, type: "ranged" })).toBe(false);
    expect(DDBEffectHelper.isAttack({ activity, type: "melee" })).toBe(true);
  });

  it("requires every andHasProperties entry on the parent", () => {
    const activity = makeAttackActivity({ properties: ["fin"] });
    expect(DDBEffectHelper.isAttack({ activity, andHasProperties: ["fin"] })).toBe(true);
    expect(DDBEffectHelper.isAttack({ activity, andHasProperties: ["fin", "thr"] })).toBe(false);
  });

  it("treats orHasProperties as an alternative to the type gate", () => {
    // A thrown melee weapon (attack type "melee" plus "thr") counts as a ranged attack.
    const thrown = makeAttackActivity({ value: "melee", properties: ["thr"] });
    expect(DDBEffectHelper.isAttack({ activity: thrown, type: "ranged", orHasProperties: ["thr"] })).toBe(true);
    // A plain melee weapon without "thr" is not a ranged attack.
    const plainMelee = makeAttackActivity({ value: "melee", properties: [] });
    expect(DDBEffectHelper.isAttack({ activity: plainMelee, type: "ranged", orHasProperties: ["thr"] })).toBe(false);
    // A real ranged weapon still matches on type directly.
    const ranged = makeAttackActivity({ value: "ranged", properties: [] });
    expect(DDBEffectHelper.isAttack({ activity: ranged, type: "ranged", orHasProperties: ["thr"] })).toBe(true);
    // With no type gate, orHasProperties does not reject.
    expect(DDBEffectHelper.isAttack({ activity: plainMelee, orHasProperties: ["thr"] })).toBe(true);
  });
});

describe("DDBEffectHelper.isMeleeWeaponAttack", () => {
  it("returns true for a melee weapon attack", () => {
    expect(DDBEffectHelper.isMeleeWeaponAttack({ activity: makeAttackActivity() })).toBe(true);
  });

  it("returns false for a ranged weapon attack", () => {
    expect(DDBEffectHelper.isMeleeWeaponAttack({ activity: makeAttackActivity({ value: "ranged" }) })).toBe(false);
  });

  it("returns false for a melee spell attack", () => {
    expect(DDBEffectHelper.isMeleeWeaponAttack({ activity: makeAttackActivity({ classification: "spell" }) })).toBe(false);
  });

  it("returns false without an activity", () => {
    expect(DDBEffectHelper.isMeleeWeaponAttack()).toBe(false);
    expect(DDBEffectHelper.isMeleeWeaponAttack({})).toBe(false);
  });
});

describe("DDBEffectHelper.isRangedWeaponAttack", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("treats a thrown melee weapon beyond melee range as a ranged attack", () => {
    vi.spyOn(DDBEffectHelper, "getDistance").mockReturnValue(30);
    const thrown = makeAttackActivity({ value: "melee", properties: ["thr"] });
    expect(DDBEffectHelper.isRangedWeaponAttack({
      activity: thrown, sourceToken: {} as any, targetToken: {} as any,
    })).toBe(true);
  });

  it("does not count a thrown weapon used within melee range", () => {
    vi.spyOn(DDBEffectHelper, "getDistance").mockReturnValue(5);
    const thrown = makeAttackActivity({ value: "melee", properties: ["thr"] });
    expect(DDBEffectHelper.isRangedWeaponAttack({
      activity: thrown, sourceToken: {} as any, targetToken: {} as any,
    })).toBe(false);
  });

  it("rejects a plain melee weapon with no thrown property", () => {
    vi.spyOn(DDBEffectHelper, "getDistance").mockReturnValue(30);
    const greatsword = makeAttackActivity({ value: "melee", properties: [] });
    expect(DDBEffectHelper.isRangedWeaponAttack({
      activity: greatsword, sourceToken: {} as any, targetToken: {} as any,
    })).toBe(false);
  });
});

describe("DDBEffectHelper.getSizeValue", () => {
  beforeAll(() => {
    // The shared foundry mock does not define CONFIG.DND5E.actorSizes; inject
    // the dnd5e ordering so indexOf-based size values behave as in game.
    globalAny.CONFIG.DND5E.actorSizes = {
      tiny: {}, sm: {}, med: {}, lg: {}, huge: {}, grg: {},
    };
  });

  afterAll(() => {
    delete globalAny.CONFIG.DND5E.actorSizes;
  });

  it("returns the index of the size key in CONFIG.DND5E.actorSizes", () => {
    expect(DDBEffectHelper.getSizeValue("tiny")).toBe(0);
    expect(DDBEffectHelper.getSizeValue("sm")).toBe(1);
    expect(DDBEffectHelper.getSizeValue("med")).toBe(2);
    expect(DDBEffectHelper.getSizeValue("grg")).toBe(5);
  });

  it("defaults a missing size to med", () => {
    const noSize: any = undefined;
    expect(DDBEffectHelper.getSizeValue(noSize)).toBe(2);
  });

  it("returns -1 for an unknown size key", () => {
    expect(DDBEffectHelper.getSizeValue("colossal")).toBe(-1);
  });
});

describe("DDBEffectHelper.isSmaller", () => {
  function makeActor(size: string): any {
    return { system: { traits: { size } } };
  }

  it("returns true when a is smaller than b", () => {
    expect(DDBEffectHelper.isSmaller(makeActor("tiny"), makeActor("med"))).toBe(true);
    expect(DDBEffectHelper.isSmaller(makeActor("med"), makeActor("lg"))).toBe(true);
  });

  it("returns false when a is larger than or equal to b", () => {
    expect(DDBEffectHelper.isSmaller(makeActor("huge"), makeActor("med"))).toBe(false);
    expect(DDBEffectHelper.isSmaller(makeActor("med"), makeActor("med"))).toBe(false);
  });

  it("treats small and medium as the same size (both DICTIONARY size 1)", () => {
    expect(DDBEffectHelper.isSmaller(makeActor("sm"), makeActor("med"))).toBe(false);
    expect(DDBEffectHelper.isSmaller(makeActor("med"), makeActor("sm"))).toBe(false);
  });

  it("returns false when either size is unknown", () => {
    expect(DDBEffectHelper.isSmaller(makeActor("colossal"), makeActor("med"))).toBe(false);
    expect(DDBEffectHelper.isSmaller(makeActor("tiny"), makeActor("colossal"))).toBe(false);
  });
});

describe("DDBEffectHelper.isEffectExpired", () => {
  function makeEffect(remaining: number): any {
    return { duration: { remaining } };
  }

  it("uses duration.remaining when times-up is not active", () => {
    expect(DDBEffectHelper.isEffectExpired(makeEffect(0))).toBe(true);
    expect(DDBEffectHelper.isEffectExpired(makeEffect(-5))).toBe(true);
    expect(DDBEffectHelper.isEffectExpired(makeEffect(3))).toBe(false);
  });

  it("delegates to TimesUp when the times-up module is active", () => {
    setMockModules({ "times-up": { active: true } });
    const timesUpSpy = vi.fn().mockReturnValue(true);
    globalAny.TimesUp = { isEffectExpired: timesUpSpy };
    try {
      const effect = makeEffect(100);
      expect(DDBEffectHelper.isEffectExpired(effect)).toBe(true);
      expect(timesUpSpy).toHaveBeenCalledWith(effect);
    } finally {
      delete globalAny.TimesUp;
    }
  });

  it("falls back to duration when times-up is active but exposes no isEffectExpired", () => {
    setMockModules({ "times-up": { active: true } });
    globalAny.TimesUp = {};
    try {
      expect(DDBEffectHelper.isEffectExpired(makeEffect(0))).toBe(true);
      expect(DDBEffectHelper.isEffectExpired(makeEffect(10))).toBe(false);
    } finally {
      delete globalAny.TimesUp;
    }
  });
});

describe("DDBEffectHelper.getMonsterFeatureDamage (pre-parsed branch)", () => {
  const damageParts = [
    { damage: "2d6 + 3", type: "fire" },
    { damage: "1d4", type: "poison" },
  ];

  function makeFeatureDoc(): any {
    return { flags: { monsterMunch: { actionData: { damageParts } } } };
  }

  it("returns the pre-parsed damage from flags.monsterMunch.actionData.damageParts", () => {
    const result = DDBEffectHelper.getMonsterFeatureDamage("taking 7 (2d6) fire damage", makeFeatureDoc());
    expect(result).toBe(damageParts);
  });

  it("ignores the damage text entirely when pre-parsed data exists", () => {
    const result = DDBEffectHelper.getMonsterFeatureDamage("completely unrelated text", makeFeatureDoc());
    expect(result).toBe(damageParts);
  });
});

describe("DDBEffectHelper.getOvertimeDamage", () => {
  const damageParts = [{ damage: "3d8", type: "necrotic" }];

  function makeFeatureDoc(): any {
    return { flags: { monsterMunch: { actionData: { damageParts } } } };
  }

  it("returns damage for 'taking ... on a failed save' text", () => {
    const text = "the target must make a DC 15 Constitution save, taking 13 (3d8) necrotic damage on a failed save";
    expect(DDBEffectHelper.getOvertimeDamage(text, makeFeatureDoc())).toBe(damageParts);
  });

  it("returns damage for 'taking ... damage on a failure' text", () => {
    const text = "make a save, taking 13 (3d8) necrotic damage on a failure";
    expect(DDBEffectHelper.getOvertimeDamage(text, makeFeatureDoc())).toBe(damageParts);
  });

  it("returns undefined when the text has no 'taking' keyword", () => {
    const text = "suffers 13 (3d8) necrotic damage on a failed save";
    expect(DDBEffectHelper.getOvertimeDamage(text, makeFeatureDoc())).toBeUndefined();
  });

  it("returns undefined when 'taking' is present without a failure phrase", () => {
    const text = "taking 13 (3d8) necrotic damage every round";
    expect(DDBEffectHelper.getOvertimeDamage(text, makeFeatureDoc())).toBeUndefined();
  });
});

describe("DDBEffectHelper.getConcentrationNames", () => {
  // game.i18n.localize is an identity function in the test mocks.
  it("builds midi and vanilla concentration names for a document", () => {
    expect(DDBEffectHelper.getConcentrationNames("Fireball")).toEqual([
      "midi-qol.Concentrating: Fireball",
      "midi-qol.Concentrating",
      "Concentrating: Fireball",
      "Concentrating",
    ]);
  });

  it("keeps trailing-space variants for an empty document name", () => {
    expect(DDBEffectHelper.getConcentrationNames()).toEqual([
      "midi-qol.Concentrating: ",
      "midi-qol.Concentrating",
      "Concentrating: ",
      "Concentrating",
    ]);
  });

  it("deduplicates entries via a Set", () => {
    const names = DDBEffectHelper.getConcentrationNames("Bless");
    expect(new Set(names).size).toBe(names.length);
  });
});
