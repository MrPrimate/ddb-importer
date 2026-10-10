import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DDBCharacterImporter from "../../src/muncher/DDBCharacterImporter";

// dnd5e creates the cached spell copies of cast activities after the import returns; these fake
// actors stand in for that, with copies that land on timers.
interface IFakeCast { id: string; spell: { uuid: string }; cachedSpell?: unknown }

function makeActor(items: { id: string; name: string; casts: IFakeCast[] }[]) {
  const map = new Map(items.map((item) => [item.id, {
    id: item.id,
    name: item.name,
    system: { activities: { getByType: (type: string) => (type === "cast" ? item.casts : []) } },
  }]));
  const collection = {
    get: (id: string) => map.get(id),
    [Symbol.iterator]: () => map.values(),
    get size() {
      return map.size;
    },
  };
  return {
    actor: { id: "actorIdIIIIIIIII", name: "Test Actor", items: collection } as unknown as TImporterActor,
    // a copy lands: the cast finds its cached spell and the actor gains an item
    land(cast: IFakeCast) {
      cast.cachedSpell = {};
      map.set(`copy-${cast.id}`, { id: `copy-${cast.id}`, name: "Copy", system: {} } as any);
    },
  };
}

describe("DDBCharacterImporter.settleCachedSpells", () => {
  const originalFromUuid = (globalThis as any).fromUuid;
  beforeEach(() => {
    (globalThis as any).fromUuid = vi.fn(async (uuid: string) => (uuid.includes("missing") ? null : { uuid }));
  });
  afterEach(() => {
    (globalThis as any).fromUuid = originalFromUuid;
  });

  it("returns at once when every cast already has its copy", async () => {
    const { actor } = makeActor([{ id: "wand", name: "Wand", casts: [{ id: "c1", spell: { uuid: "S.fireball" }, cachedSpell: {} }] }]);
    const started = Date.now();
    expect(await DDBCharacterImporter.settleCachedSpells(actor, { timeoutMs: 5000, quietMs: 2000 })).toEqual([]);
    expect(Date.now() - started).toBeLessThan(200);
  });

  it("waits for copies that land after the import", async () => {
    const fireball: IFakeCast = { id: "c1", spell: { uuid: "S.fireball" } };
    const web: IFakeCast = { id: "c2", spell: { uuid: "S.web" } };
    const fake = makeActor([{ id: "wand", name: "Wand", casts: [fireball] }, { id: "web", name: "Wand of Web", casts: [web] }]);
    setTimeout(() => fake.land(fireball), 300);
    setTimeout(() => fake.land(web), 700);
    expect(await DDBCharacterImporter.settleCachedSpells(fake.actor, { timeoutMs: 5000, quietMs: 1000 })).toEqual([]);
    expect(web.cachedSpell).toBeDefined();
  });

  it("gives up once no item has been created for the quiet window, naming the item", async () => {
    const stuck: IFakeCast = { id: "c1", spell: { uuid: "S.fireball" } };
    const { actor } = makeActor([{ id: "wand", name: "Wand of Fireballs", casts: [stuck] }]);
    const started = Date.now();
    expect(await DDBCharacterImporter.settleCachedSpells(actor, { timeoutMs: 5000, quietMs: 500 })).toEqual(["Wand of Fireballs"]);
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it("does not wait for casts whose spell does not resolve, since dnd5e never copies them", async () => {
    const { actor } = makeActor([{ id: "wand", name: "Wand", casts: [{ id: "c1", spell: { uuid: "S.missing" } }] }]);
    const started = Date.now();
    expect(await DDBCharacterImporter.settleCachedSpells(actor, { timeoutMs: 5000, quietMs: 2000 })).toEqual([]);
    expect(Date.now() - started).toBeLessThan(200);
  });
});
