import CastLevelRider from "../../../src/effects/enhancers/Spells/CastLevelRider";

const EFFECT_NAME = "Battle Familiar: Spell Level";
const g = globalThis as any;

/** The source effect on the Battle Familiar item, as the enricher builds it. */
function sourceEffect() {
  return {
    uuid: "Actor.druid.Item.bf.ActiveEffect.lvl",
    toObject: () => ({
      _id: "lvlEffect0000001",
      name: EFFECT_NAME,
      flags: { ddbimporter: { noeffect: true } },
      changes: [{ key: "flags.ddbimporter.battleFamiliarLevel", value: "@item.level" }],
    }),
  };
}

/** A familiar actor that records the effects created on it. */
function familiar(name: string, { owner = true, existing = [] as any[] } = {}) {
  const created: any[] = [];
  return {
    name,
    uuid: `Actor.${name}`,
    isOwner: owner,
    created,
    effects: { find: (fn: (e: any) => boolean) => existing.find(fn) },
  };
}

/** Empower Familiar on a druid; the usage message carries the cast level. */
function empower({ flag = true } = {}) {
  const caster = { name: "druid" };
  const activity: any = {
    id: "ddbBattleFamTrns",
    uuid: "Actor.druid.Item.bf.Activity.ddbBattleFamTrns",
    actor: caster,
    flags: flag ? { ddbimporter: { castLevelRider: EFFECT_NAME } } : {},
    item: {
      effects: { getName: (n: string) => (n === EFFECT_NAME ? sourceEffect() : undefined) },
      system: { level: 2 },
    },
  };
  return { caster, activity };
}

describe("CastLevelRider", () => {
  let warnings: string[];
  let socketCalls: any[];

  beforeEach(() => {
    warnings = [];
    socketCalls = [];
    g.ui = { notifications: { warn: (m: string) => warnings.push(m) } };
    g.canvas = { tokens: { controlled: [] } };
    g.game = { ...(g.game ?? {}), user: { targets: new Set() } };
    g.DDBImporter = { socket: { executeAsGM: async (name: string, args: any) => socketCalls.push([name, args]) } };
    g.ActiveEffect = {
      implementation: {
        create: async (data: any, { parent }: any) => parent.created.push(data),
        getInitialDuration: () => ({ duration: { startTime: 5000, startRound: 2, startTurn: 1 } }),
      },
    };
  });

  it("applies the effect to the targeted familiar with the cast level baked in", async () => {
    const { activity } = empower();
    const fam = familiar("owl");
    g.game.user.targets = new Set([{ actor: fam }]);
    await CastLevelRider.apply(activity, EFFECT_NAME, {}, { message: { uuid: "ChatMessage.m1", system: { scaling: 1, spellLevel: 3 } } as any });
    expect(fam.created).toHaveLength(1);
    const [effect] = fam.created;
    expect(effect.changes[0].value).toBe("3");
    expect(effect).toMatchObject({ disabled: false, transfer: false, flags: { dnd5e: { scaling: 1, spellLevel: 3 } } });
    expect(effect.origin).toBe(activity.uuid);
    expect(effect._id).toBeUndefined();
    expect(effect.flags.ddbimporter.noeffect).toBeNull();
  });

  it("reads the level from the spell and its scaling when the message has none", async () => {
    const { activity } = empower();
    const fam = familiar("owl");
    g.game.user.targets = new Set([{ actor: fam }]);
    await CastLevelRider.apply(activity, EFFECT_NAME, { scaling: 2 }, {});
    expect(fam.created[0].changes[0].value).toBe("4");
  });

  it("falls back to selected tokens other than the caster's", async () => {
    const { activity, caster } = empower();
    const fam = familiar("owl");
    g.canvas.tokens.controlled = [{ actor: caster }, { actor: fam }];
    await CastLevelRider.apply(activity, EFFECT_NAME, {}, { message: { system: { scaling: 0, spellLevel: 2 } } as any });
    expect(fam.created).toHaveLength(1);
    expect(fam.created[0].changes[0].value).toBe("2");
  });

  it("warns and applies nothing when no familiar is targeted or selected", async () => {
    const { activity, caster } = empower();
    g.canvas.tokens.controlled = [{ actor: caster }];
    await CastLevelRider.apply(activity, EFFECT_NAME, {}, {});
    expect(warnings).toHaveLength(1);
  });

  it("hands a familiar the user does not own to the GM", async () => {
    const { activity } = empower();
    const fam = familiar("owl", { owner: false });
    g.game.user.targets = new Set([{ actor: fam }]);
    await CastLevelRider.apply(activity, EFFECT_NAME, {}, { message: { system: { scaling: 2, spellLevel: 4 } } as any });
    expect(fam.created).toHaveLength(0);
    expect(socketCalls).toHaveLength(1);
    expect(socketCalls[0][0]).toBe("createEffects");
    expect(socketCalls[0][1].effects[0].changes[0].value).toBe("4");
  });

  it("refreshes the copy a previous cast left on the familiar", async () => {
    const { activity } = empower();
    const updates: any[] = [];
    const previous = { id: "oldCopy000000001", _stats: { duplicateSource: sourceEffect().uuid }, update: async (u: any) => updates.push(u) };
    const fam = familiar("owl", { existing: [previous] });
    g.game.user.targets = new Set([{ actor: fam }]);
    await CastLevelRider.apply(activity, EFFECT_NAME, {}, { message: { system: { scaling: 1, spellLevel: 3 } } as any });
    expect(fam.created).toHaveLength(0);
    expect(updates).toHaveLength(1);
    expect(updates[0]._id).toBe("oldCopy000000001");
    // a recast restarts the clock rather than keeping the item effect's empty start
    expect(updates[0].duration).toMatchObject({ startTime: 5000, startRound: 2, startTurn: 1 });
  });

  it("ignores activities without a rider", () => {
    const { activity } = empower({ flag: false });
    CastLevelRider.postUseActivityHook(activity, {}, {});
    expect(warnings).toHaveLength(0);
  });
});
