import OriginFixer from "../../src/lib/OriginFixer";

vi.mock("../../src/lib/CompendiumHelper", () => ({
  default: { getCompendiumLabel: vi.fn(() => "world.ddb-monsters") },
}));

function makeActor(effects: any[]) {
  const updates: any[] = [];
  return {
    actor: {
      name: "Test Actor",
      uuid: "Actor.newActorId0001",
      effects: effects.map((e) => ({ ...e, toObject: () => foundry.utils.deepClone(e) })),
      updateEmbeddedDocuments: async (_type: string, data: any[]) => updates.push(...data),
    } as any,
    updates,
  };
}

describe("OriginFixer", () => {
  const originalFromUuid = (globalThis as any).fromUuid;

  beforeEach(() => {
    (globalThis as any).fromUuid = vi.fn().mockResolvedValue({});
  });

  afterEach(() => {
    (globalThis as any).fromUuid = originalFromUuid;
  });

  it("rewrites broken legacy origins to the new actor", async () => {
    const { actor, updates } = makeActor([
      { _id: "e1", name: "Old", origin: "Actor.oldActorId0000.Item.itemId000000001" },
    ]);
    await OriginFixer.updateActorEffects(actor);
    expect(updates[0].origin).toBe("Actor.newActorId0001.Item.itemId000000001");
  });

  // v7.0.x: skipped, expects dnd5e 6.0 / v14 branch behaviour or an API not on this branch; review before enabling

  it.skip("rewrites absolute system.origin fields the same way and leaves relative ones alone", async () => {
    const { actor, updates } = makeActor([
      {
        _id: "e1",
        name: "Structured",
        origin: null,
        system: {
          origin: {
            item: "Actor.oldActorId0000.Item.itemId000000001",
            effect: "Item.relativeRef0001.ActiveEffect.aaaabbbbccccdddd",
          },
        },
      },
    ]);
    await OriginFixer.updateActorEffects(actor);
    expect(updates[0].system.origin.item).toBe("Actor.newActorId0001.Item.itemId000000001");
    expect(updates[0].system.origin.effect).toBe("Item.relativeRef0001.ActiveEffect.aaaabbbbccccdddd");
  });

  it("makes no update when nothing matches", async () => {
    const { actor, updates } = makeActor([
      { _id: "e1", name: "Fine", origin: "Actor.newActorId0001.Item.itemId000000001" },
      { _id: "e2", name: "Marker", origin: "Ability.Override" },
    ]);
    await OriginFixer.updateActorEffects(actor);
    expect(updates).toEqual([]);
  });
});
