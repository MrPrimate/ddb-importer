const resolveMonsterTokenArt = vi.hoisted(() => vi.fn());
vi.mock("../../../src/parser/companions/types/MonsterTokenArt", () => ({ resolveMonsterTokenArt }));

import ShapeShift from "../../../src/parser/enrichers/monster/Generic/ShapeShift";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => installActivityConfigStubs());

function shapeShift(text: string, monsterSpeeds?: Record<string, number>): ShapeShift {
  const e = makeEnricherData(ShapeShift, {
    name: "Shape-Shift",
    actions: null,
    ddbParser: {
      strippedHtml: text,
      actionData: { damageParts: [] },
      ...(monsterSpeeds
        ? { ddbMonster: { npc: { system: { attributes: { movement: { speeds: monsterSpeeds } } } } } }
        : {}),
    },
  });
  e.document = { system: { activities: {} }, effects: [] };
  return e;
}

const FORM_BLOCK = { mode: "form", formless: true, customize: false, preset: "" };

const textureOf = (hint: IDDBEffectHint) => hint.tokenChanges?.find((c) => c.key === "token.texture.src")?.value;

describe("monster Shape-Shift", () => {
  it("builds a form-mode transform with one form per creature listed with speeds", () => {
    const e = shapeShift("The fiend shape-shifts to resemble a bat (Speed 10 ft., Fly 40 ft.), a centipede (40 ft., Climb 40 ft.), or a toad (40 ft., Swim 40 ft.), or it returns to its true form.");
    expect(e.type).toBe("transform");
    expect(e.activity.name).toBe("Change Form");
    const data = e.activity.data as Partial<I5eTransformActivity>;
    expect(data.transform).toEqual(FORM_BLOCK);
    expect(data.profiles).toEqual([]);
    expect(data.settings).toBeNull();
    expect(data.duration).toEqual({ units: "inst" });

    expect(e.effects.map((f) => f.name)).toEqual(["Bat Form", "Centipede Form", "Toad Form"]);
    for (const form of e.effects) {
      expect(form.activityMatch).toBe("Change Form");
      expect(form.options).toEqual({ transfer: false, durationSeconds: null });
    }
    expect(e.effects[0].changes).toEqual([
      expect.objectContaining({ key: "system.attributes.movement.speeds.walk", value: "10" }),
      expect.objectContaining({ key: "system.attributes.movement.speeds.fly", value: "40" }),
    ]);
    expect(e.effects[1].changes?.map((c) => c.key)).toEqual([
      "system.attributes.movement.speeds.walk",
      "system.attributes.movement.speeds.climb",
    ]);
    expect(e.effects.map(textureOf)).toEqual([
      "systems/dnd5e/tokens/beast/Bat.webp",
      "systems/dnd5e/tokens/beast/GiantCentipede.webp",
      "systems/dnd5e/tokens/beast/GiantToad.webp",
    ]);
  });

  it("reads 'Fly Speed' wording and the size of each form", () => {
    const e = shapeShift("If the ghoul isn’t in sunlight, it shape-shifts into a Tiny bat (Speed 5 ft., Fly Speed 30 ft.) or a Medium cloud of mist (Speed 5 ft., Fly Speed 20 ft. ), or it returns to its ghoul form. While in bat form, it can't speak.");
    expect(e.effects.map((f) => f.name)).toEqual(["Bat Form", "Cloud of Mist Form"]);
    expect(e.effects[0].changes).toContainEqual(expect.objectContaining({ key: "system.traits.size", value: "tiny" }));
    expect(e.effects[1].changes?.map((c) => c.value)).toEqual(["5", "20", "med"]);
    expect(textureOf(e.effects[1])).toBe("systems/dnd5e/tokens/elemental/InvisibleStalker.webp");
  });

  it("zeroes the monster's other speeds in a form that lists its own", () => {
    const e = shapeShift("The fiend shape-shifts into a rat (Speed 20 ft.), or it returns to its true form.", { walk: 20, fly: 40, swim: 0 });
    expect(e.effects[0].changes).toEqual([
      expect.objectContaining({ key: "system.attributes.movement.speeds.walk", value: "20" }),
      expect.objectContaining({ key: "system.attributes.movement.speeds.fly", value: "0" }),
    ]);
  });

  it("makes forms from creatures described only by size", () => {
    const e = shapeShift("The beast shape-shifts into a Large bear-humanoid hybrid form or a Large bear, or it returns to its true humanoid form.", { walk: 30, climb: 30 });
    expect(e.type).toBe("transform");
    expect(e.effects.map((f) => f.name)).toEqual(["Hybrid Form", "Bear Form"]);
    // speeds are untouched because neither form lists any
    expect(e.effects[0].changes).toEqual([expect.objectContaining({ key: "system.traits.size", value: "lg" })]);
    expect(e.effects[0].tokenChanges).toBeUndefined();
    expect(textureOf(e.effects[1])).toBe("systems/dnd5e/tokens/beast/BrownBear.webp");
  });

  it("reads multi-word creature names", () => {
    const e = shapeShift("The beast shape-shifts into a Large dire wolf humanoid hybrid or a Large dire wolf, or it returns to its true humanoid form.");
    expect(e.effects.map((f) => f.name)).toEqual(["Hybrid Form", "Dire Wolf Form"]);
    expect(textureOf(e.effects[1])).toBe("systems/dnd5e/tokens/beast/DireWolf.webp");
  });

  it("ignores a creature named as the true form", () => {
    const e = shapeShift("The beast shape-shifts into a Medium human or a Medium jackal-humanoid hybrid, or it returns to its true form (that of a Small jackal).");
    expect(e.effects.map((f) => f.name)).toEqual(["Human Form", "Hybrid Form"]);
  });

  it("stays a utility with no effects when the text only offers an appearance", () => {
    for (const text of [
      "The mimic shape-shifts into a Medium or Small Humanoid, or it returns to its true form.",
      "The ogre shape-shifts into a Small or Medium Humanoid or a Large Giant, or it returns to its true form.",
      "The spirit shape-shifts into a Huge or smaller version of the animal it represents or a Medium or Small Humanoid, or it returns to its true form.",
    ]) {
      const e = shapeShift(text);
      expect(e.type).toBe("utility");
      expect(e.activity.data).toBeUndefined();
      expect(e.effects).toEqual([]);
    }
  });

  it("never emits a token texture change without art", () => {
    const e = shapeShift("The beast shape-shifts into a Small swan or a Tiny imp (Speed 20 ft., Fly Speed 40 ft.), or it returns to its true form.");
    expect(e.effects.map((f) => f.name)).toEqual(["Imp Form", "Swan Form"]);
    for (const form of e.effects) {
      expect(form.tokenChanges).toBeUndefined();
      expect(form.img).toBeUndefined();
    }
  });

  describe("monster token art", () => {
    /** The built effects as the feature holds them at cleanup: hint changes folded into system.changes. */
    function withBuiltEffects(text: string): ShapeShift {
      const e = shapeShift(text);
      const effects = e.effects.map((hint) => ({
        name: hint.name,
        img: hint.img,
        system: { changes: [...(hint.changes ?? []), ...(hint.tokenChanges ?? [])] },
      }));
      (e as any).ddbEnricher.ddbParser.data = { effects };
      return e;
    }

    const builtTexture = (effect: any) => effect.system.changes.find((c: any) => c.key === "token.texture.src")?.value;

    beforeEach(() => resolveMonsterTokenArt.mockReset());

    it("wears the form creature's monster token in place of the system art", async () => {
      resolveMonsterTokenArt.mockImplementation(async (options?: { name: string }) => `tokens/${options?.name}.webp`);
      const e = withBuiltEffects("The fiend shape-shifts to resemble a bat (Speed 10 ft., Fly 40 ft.), a centipede (40 ft., Climb 40 ft.), or a Tiny imp (Speed 20 ft.), or it returns to its true form.");
      await e.cleanup();

      expect(resolveMonsterTokenArt.mock.calls.map(([options]) => options)).toEqual([
        { name: "Bat", is2014: false },
        { name: "Giant Centipede", is2014: false },
        { name: "Imp", is2014: false },
      ]);
      const effects = e.data.effects;
      expect(effects.map(builtTexture)).toEqual(["tokens/Bat.webp", "tokens/Giant Centipede.webp", "tokens/Imp.webp"]);
      expect(effects.map((f: any) => f.img)).toEqual(["tokens/Bat.webp", "tokens/Giant Centipede.webp", "tokens/Imp.webp"]);
      // one texture change per form, the system art replaced rather than joined
      for (const effect of effects) {
        expect(effect.system.changes.filter((c: any) => c.key === "token.texture.src")).toHaveLength(1);
      }
    });

    it("keeps the system art when no monster art is found, and never looks up a form that is no creature", async () => {
      resolveMonsterTokenArt.mockResolvedValue(null);
      const e = withBuiltEffects("The beast shape-shifts into a Large bear-humanoid hybrid or a Large bear, or a Medium cloud of mist (Speed 5 ft.), or it returns to its true form.");
      await e.cleanup();

      expect(resolveMonsterTokenArt.mock.calls.map(([options]) => options.name)).toEqual(["Brown Bear"]);
      const byName = Object.fromEntries(e.data.effects.map((f: any) => [f.name, builtTexture(f)]));
      expect(byName).toEqual({
        "Cloud of Mist Form": "systems/dnd5e/tokens/elemental/InvisibleStalker.webp",
        "Hybrid Form": undefined,
        "Bear Form": "systems/dnd5e/tokens/beast/BrownBear.webp",
      });
    });

    it("does nothing for an appearance-only shape-shift", async () => {
      const e = withBuiltEffects("The mimic shape-shifts into a Medium or Small Humanoid, or it returns to its true form.");
      await e.cleanup();
      expect(resolveMonsterTokenArt).not.toHaveBeenCalled();
    });
  });
});
