import "../../../src/parser/character/token";
import "../../../src/parser/character/senses"; // _generateToken calls getSenses
import { makeMockCharacter } from "../../_fixtures/mockCharacter";
import { auditFixturesPresent, loadFixtureCharacter } from "../../_fixtures/ddb/auditCharacterFixtures";
import { setMockModules } from "../../_setup/foundryMocks";
import DDBCharacter from "../../../src/parser/DDBCharacter";

// _generateToken merges CONFIG.Canvas.visionModes[mode].vision.defaults into
// the token sight; the shared foundry mocks do not provide CONFIG.Canvas, so a
// small recognisable stub is installed for this file
const VISION_DEFAULTS = {
  basic: { attenuation: 0, contrast: 0, saturation: 0, brightness: 0 },
  darkvision: { attenuation: 0, contrast: 0, saturation: -1, brightness: 0 },
  devilsSight: { attenuation: 0, contrast: 0, saturation: -0.5, brightness: 0.5 },
};

beforeAll(() => {
  (globalThis as any).CONFIG.Canvas = {
    visionModes: {
      basic: { vision: { defaults: VISION_DEFAULTS.basic } },
      darkvision: { vision: { defaults: VISION_DEFAULTS.darkvision } },
      devilsSight: { vision: { defaults: VISION_DEFAULTS.devilsSight } },
    },
  };
});

afterAll(() => {
  delete (globalThis as any).CONFIG.Canvas;
});

// _generateToken calls this.getSenses(), so the mock needs the real prototype
function tokenMock(ddbCharacter: Record<string, any>, prototypeToken: Record<string, any> = { texture: {} }): any {
  const mock = makeMockCharacter({ ddbCharacter });
  Object.setPrototypeOf(mock, DDBCharacter.prototype);
  mock.raw.character.name = "Testy";
  mock.currentActor = { prototypeToken };
  return mock;
}

function raceModifiers(race: Record<string, any>[]): Record<string, any> {
  return {
    modifiers: {
      race,
      class: [], background: [], item: [], feat: [], condition: [],
    },
  };
}

function generate(mock: any) {
  mock._generateToken();
  return mock.raw.character.prototypeToken;
}

describe("DDBCharacter._generateToken (synthetic)", () => {
  it("writes basic linked-token defaults for a character with no senses", () => {
    const token = generate(tokenMock({}, { name: "old name", texture: { src: "face.png" } }));
    expect(token.actorLink).toBe(true);
    expect(token.name).toBe("Testy");
    // existing actor token data such as the artwork survives the merge
    expect(token.texture.src).toBe("face.png");
    expect(token.sight).toEqual({ enabled: true, range: 0, visionMode: "basic" });
    expect(token.detectionModes).toEqual({});
  });

  it("sets darkvision vision mode, range and vision defaults", () => {
    const token = generate(tokenMock(raceModifiers([
      { type: "set-base", subType: "darkvision", value: 60, isGranted: true, restriction: "" },
    ])));
    expect(token.sight).toEqual({
      enabled: true,
      range: 60,
      visionMode: "darkvision",
      ...VISION_DEFAULTS.darkvision,
    });
    // darkvision has no separate detection mode without vision-5e
    expect(token.detectionModes).toEqual({});
  });

  it("keeps the largest sense for sight and maps the rest to detection modes", () => {
    const token = generate(tokenMock(raceModifiers([
      { type: "set-base", subType: "darkvision", value: 60, isGranted: true, restriction: "" },
      { type: "set-base", subType: "blindsight", value: 30, isGranted: true, restriction: "" },
      { type: "set-base", subType: "tremorsense", value: 15, isGranted: true, restriction: "" },
      { type: "set-base", subType: "truesight", value: 120, isGranted: true, restriction: "" },
    ])));
    // truesight (120) wins the range; the default sense map renders it with
    // the basic vision mode
    expect(token.sight.visionMode).toBe("basic");
    expect(token.sight.range).toBe(120);
    expect(token.detectionModes).toEqual({
      blindsight: { range: 30, enabled: true },
      feelTremor: { range: 15, enabled: true },
      seeAll: { range: 120, enabled: true },
    });
  });

  it("resets Devil's Sight to basic vision when vision-5e is not active", () => {
    const token = generate(tokenMock(raceModifiers([
      {
        type: "set-base", subType: "darkvision", value: 120, isGranted: true,
        restriction: "You can see normally in darkness, both magical and nonmagical",
      },
    ])));
    expect(token.sight.visionMode).toBe("basic");
    expect(token.sight.range).toBe(120);
    // basic defaults overwrite the darkvision desaturation
    expect(token.sight.saturation).toBe(0);
  });

  it("uses the devilsSight vision mode and skips detection modes with vision-5e active", () => {
    setMockModules({ "vision-5e": { active: true } });
    const token = generate(tokenMock(raceModifiers([
      {
        type: "set-base", subType: "darkvision", value: 120, isGranted: true,
        restriction: "You can see normally in darkness, both magical and nonmagical",
      },
      { type: "set-base", subType: "blindsight", value: 30, isGranted: true, restriction: "" },
    ])));
    expect(token.sight.visionMode).toBe("devilsSight");
    expect(token.sight.range).toBe(120);
    expect(token.sight.brightness).toBe(VISION_DEFAULTS.devilsSight.brightness);
    // vision-5e provides its own detection handling
    expect(token.detectionModes).toEqual({});
  });

  it("does nothing without a current actor", () => {
    const mock = tokenMock({});
    mock.currentActor = null;
    mock._generateToken();
    expect(mock.raw.character.prototypeToken).toBeUndefined();
  });
});

describe.skipIf(!auditFixturesPresent())("DDBCharacter._generateToken (audit fixtures)", () => {
  it("gives a Deep Gnome token 120 ft of darkvision", async () => {
    const mock = await loadFixtureCharacter("species", "-Deep Gnome-", { generateAbilities: false });
    mock.currentActor = { prototypeToken: { texture: {} } };
    mock._generateToken();
    const token = mock.raw.character.prototypeToken;
    expect(token.sight.visionMode).toBe("darkvision");
    expect(token.sight.range).toBe(120);
    expect(token.detectionModes).toEqual({});
  });

  it("leaves a senseless Grung token on basic sight", async () => {
    const mock = await loadFixtureCharacter("species", "-Grung-", { generateAbilities: false });
    mock.currentActor = { prototypeToken: { texture: {} } };
    mock._generateToken();
    const token = mock.raw.character.prototypeToken;
    expect(token.sight).toEqual({ enabled: true, range: 0, visionMode: "basic" });
    expect(token.detectionModes).toEqual({});
  });
});
