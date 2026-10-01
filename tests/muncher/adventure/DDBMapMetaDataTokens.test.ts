import { describe, it, expect, beforeEach, afterEach } from "vitest";
import DDBMapMetaData from "../../../src/muncher/adventure/DDBMapMetaData";

// The native importer places meta-data tokens through DDBMapMetaData; these pin that it carries the
// captured per-token data the zip importer (AdventureMunch._getTokenUpdateData) also applies.
const applyOverrides = (stub: any, metaToken: any, worldActor: any, options: any = {}, swapped = false) =>
  (DDBMapMetaData as any)._applyTokenOverrides(stub, metaToken, worldActor, { applyTokens: true, ...options }, swapped);

function metaToken(overrides: Record<string, any> = {}) {
  return {
    _id: "metaToken0000001",
    name: "Tangletop",
    flags: {
      ddbActorFlags: {
        id: 17, name: "Mitflit", keepToken: true, tokenImage: "assets/02-09.tangletop.png",
        keepAvatar: true, avatarImage: "assets/02-09.tangletop.png",
      },
    },
    actorData: { _id: "metaActorData001", name: "Tangletop", system: { attributes: { hp: { value: 0, max: 10 } } } },
    light: { dim: 0, bright: 0, alpha: 0.5 },
    ...overrides,
  };
}

const worldActor = { name: "Mitflit", items: [] };

describe("DDBMapMetaData token overrides", () => {
  it("applies the captured actor data, kept art and name as the zip importer does", async () => {
    const stub: any = { name: "Tangletop", flags: {} };
    const assetMap = new Map([["assets/02-09.tangletop.png", "ddb-images/adventures/av/02-09.tangletop.webp"]]);
    await applyOverrides(stub, metaToken(), worldActor, { assetMap });
    expect(stub.delta).toEqual({
      name: "Tangletop",
      img: "ddb-images/adventures/av/02-09.tangletop.webp",
      system: { attributes: { hp: { value: 0, max: 10 } } },
    });
    expect(stub.texture.src).toBe("ddb-images/adventures/av/02-09.tangletop.webp");
    // a token light that emits nothing must not replace the actor's prototype light
    expect(stub.light).toBeUndefined();
  });

  it("names the delta after a renamed token when the capture has no actor name", async () => {
    const stub: any = { name: "Sleeping Guard", flags: {} };
    await applyOverrides(stub, metaToken({ name: "Sleeping Guard", actorData: { system: {} } }), worldActor);
    expect(stub.delta.name).toBe("Sleeping Guard");
    expect(stub.texture).toBeUndefined();
  });

  it("keeps a light the token emits", async () => {
    const stub: any = { name: "Flickerwisp", flags: {} };
    const light = { dim: 10, bright: 5, alpha: 0.5 };
    await applyOverrides(stub, metaToken({ name: "Flickerwisp", light }), { name: "Flickerwisp", items: [] });
    expect(stub.light).toEqual(light);
  });

  it("keeps only the captured name on a token swapped to its 2024 monster", async () => {
    const stub: any = { name: "Tangletop", flags: {} };
    await applyOverrides(stub, metaToken(), worldActor, {}, true);
    expect(stub.delta).toEqual({ name: "Tangletop" });
  });
});

// A native re-import must replace the earlier meta-data, not stack a second copy on the scene
describe("DDBMapMetaData.clearMetaData", () => {
  const globals = globalThis as any;
  let saved: { scenes: unknown; Scene: unknown };

  beforeEach(() => {
    saved = { scenes: globals.game.scenes, Scene: globals.Scene };
  });

  afterEach(() => {
    globals.game.scenes = saved.scenes;
    globals.Scene = saved.Scene;
  });

  it("removes the floor clones and the placeables and tokens enrich made, keeping hand-placed tokens and tiles", async () => {
    const deletedScenes: string[][] = [];
    const clone = { id: "clone1", flags: { ddbimporter: { metaCloneOf: "scene1" } } };
    const other = { id: "other", flags: { ddbimporter: { metaCloneOf: "scene2" } } };
    globals.game.scenes = { contents: [clone, other] };
    globals.Scene = { deleteDocuments: async (ids: string[]) => deletedScenes.push(ids) };
    const deleted: Record<string, string[]> = {};
    const collection = (...ids: (string | [string, any])[]) => ({
      contents: ids.map((entry) => (Array.isArray(entry) ? { id: entry[0], flags: entry[1] } : { id: entry, flags: {} })),
    });
    const scene: any = {
      id: "scene1",
      name: "Level 1",
      walls: collection("w1", "w2"),
      lights: collection("l1"),
      drawings: collection(),
      notes: collection("n1"),
      tokens: collection(["t1", { ddbimporter: { source: "meta-data" } }], ["t2", {}]),
      tiles: collection("snip1"),
      deleteEmbeddedDocuments: async (type: string, ids: string[]) => {
        deleted[type] = ids;
      },
    };
    await DDBMapMetaData.clearMetaData(scene);
    expect(deletedScenes).toEqual([["clone1"]]);
    expect(deleted).toEqual({ Wall: ["w1", "w2"], AmbientLight: ["l1"], Note: ["n1"], Token: ["t1"] });
  });
});

describe("DDBMapMetaData meta-data scene prefetch", () => {
  const info = (filepath: string, ids: (number | string)[]): any => ({
    bookCode: "av",
    filepath,
    scene: { flags: { ddb: { tokens: ids.map((id) => ({ flags: { ddbActorFlags: { id } } })) } } },
  });

  it("collects each token monster id once across scenes", () => {
    expect(DDBMapMetaData.metaTokenMonsterIds([info("a.json", [17, 42, "17"]), info("b.json", [42, 99])]).sort())
      .toEqual([17, 42, 99]);
  });

  it("lets enrich reuse prefetched payloads instead of fetching again", async () => {
    const prefetched = new Map([["av/a.json", info("a.json", [17])]]);
    const fetched = await (DDBMapMetaData as any)._fetchSceneInfos([{ bookCode: "av", filepath: "a.json" }], prefetched);
    expect(fetched).toEqual([prefetched.get("av/a.json")]);
  });
});

describe("DDBMapMetaData meta-data token names", () => {
  const token = (name: string, legacyName = "Kobold") => ({ name, flags: { ddbActorFlags: { name: legacyName } } });

  it("takes the 2024 name only for a token that carried the legacy monster's name", () => {
    const swapped = { name2024: "Kobold Warrior" };
    expect((DDBMapMetaData as any)._metaTokenName(token("Kobold"), swapped, "Kobold Warrior")).toBe("Kobold Warrior");
    expect((DDBMapMetaData as any)._metaTokenName(token("Ekrash"), swapped, "Kobold Warrior")).toBe("Ekrash");
  });

  it("keeps the captured name without a swap and falls back to the actor name", () => {
    expect((DDBMapMetaData as any)._metaTokenName(token("Ekrash"), undefined, "Kobold")).toBe("Ekrash");
    expect((DDBMapMetaData as any)._metaTokenName({ flags: {} }, undefined, "Kobold")).toBe("Kobold");
  });
});
