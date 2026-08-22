import "../../../src/parser/character/speed";
import "../../../src/parser/character/ac"; // isUnArmored lives here
import { makeMockCharacter } from "../../_fixtures/mockCharacter";
import { auditFixturesPresent, loadFixtureCharacter } from "../../_fixtures/ddb/auditCharacterFixtures";
import DDBCharacter from "../../../src/parser/DDBCharacter";

const generateSpeed = DDBCharacter.prototype._generateSpeed;

function speedMock(ddbCharacter: Record<string, any>): any {
  const mock = makeMockCharacter({
    ddbCharacter: {
      race: {
        fullName: "Human",
        weightSpeeds: { normal: { walk: 30, fly: 0, burrow: 0, swim: 0, climb: 0 } },
        ...ddbCharacter.race,
      },
      ...ddbCharacter,
    },
  });
  mock.isUnArmored = () => true;
  return mock;
}

function movement(mock: any) {
  generateSpeed.call(mock);
  return mock.raw.character.system.attributes.movement;
}

describe("DDBCharacter._generateSpeed (synthetic)", () => {
  it("uses the race walking speed, leaving zero speeds blank", () => {
    expect(movement(speedMock({}))).toEqual({
      speeds: { burrow: "", climb: "", fly: "", swim: "", walk: "30" },
      units: "ft", hover: false,
    });
  });

  it("takes the highest innate-speed set modifier for a movement type", () => {
    const mock = speedMock({
      modifiers: {
        race: [{ type: "set", subType: "innate-speed-flying", value: 50, isGranted: true, restriction: "" }],
        class: [], background: [], item: [], feat: [], condition: [],
      },
    });
    expect(movement(mock).speeds.fly).toBe("50");
  });

  it("does not raise an existing speed with a lower innate set", () => {
    const mock = speedMock({
      race: { weightSpeeds: { normal: { walk: 30, fly: 0, burrow: 0, swim: 0, climb: 40 } } },
      modifiers: {
        race: [{ type: "set", subType: "innate-speed-climbing", value: 20, isGranted: true, restriction: "" }],
        class: [], background: [], item: [], feat: [], condition: [],
      },
    });
    expect(movement(mock).speeds.climb).toBe("40");
  });

  it("sets a speed equal to walking for the id-182 equal-to-walking modifier", () => {
    // e.g. 2024 aquatic species: "swim speed equal to your walking speed"
    const mock = speedMock({
      modifiers: {
        race: [{
          type: "set", subType: "innate-speed-swimming", value: null,
          modifierSubTypeId: 182, modifierTypeId: 9, isGranted: true, restriction: "",
        }],
        class: [], background: [], item: [], feat: [], condition: [],
      },
    });
    expect(movement(mock).speeds.swim).toBe("30");
  });

  it("applies a flat speed bonus to every non-zero movement type", () => {
    // e.g. Squat Nimbleness / Mobile: race-bucket bonus applies without class plumbing
    const mock = speedMock({
      race: {
        weightSpeeds: { normal: { walk: 25, fly: 0, burrow: 0, swim: 0, climb: 25 } },
      },
      modifiers: {
        race: [{ type: "bonus", subType: "speed", value: 5, isGranted: true, restriction: "" }],
        class: [], background: [], item: [], feat: [], condition: [],
      },
    });
    const result = movement(mock);
    expect(result.speeds.walk).toBe("30");
    expect(result.speeds.climb).toBe("30");
    expect(result.speeds.fly).toBe("");
  });

  it("applies a typed speed bonus only to that movement type", () => {
    const mock = speedMock({
      race: {
        weightSpeeds: { normal: { walk: 30, fly: 0, burrow: 0, swim: 30, climb: 0 } },
      },
      modifiers: {
        race: [{ type: "bonus", subType: "speed-swimming", value: 10, isGranted: true, restriction: "" }],
        class: [], background: [], item: [], feat: [], condition: [],
      },
    });
    const result = movement(mock);
    expect(result.speeds.swim).toBe("40");
    expect(result.speeds.walk).toBe("30");
  });

  it("lets a custom speed override the computed value", () => {
    // movementId 1 = walk in DICTIONARY.actor.speeds
    const mock = speedMock({
      customSpeeds: [{ movementId: 1, distance: 60 }],
    });
    expect(movement(mock).speeds.walk).toBe("60");
  });
});

describe.skipIf(!auditFixturesPresent())("DDBCharacter._generateSpeed (audit fixtures)", () => {
  it("parses Grung climb and walk speeds from a real capture", async () => {
    const mock = await loadFixtureCharacter("species", "-Grung-", { generateAbilities: false });
    mock._generateSpeed();
    const result = mock.raw.character.system.attributes.movement;
    expect(result.speeds.walk).toBe("25");
    expect(result.speeds.climb).toBe("25");
    expect(result.speeds.fly).toBe("");
  });

  it("parses Aarakocra innate flying speed from a real capture", async () => {
    const mock = await loadFixtureCharacter("species", "-Aarakocra-", { generateAbilities: false });
    mock._generateSpeed();
    const result = mock.raw.character.system.attributes.movement;
    expect(result.speeds.walk).toBe("30");
    expect(result.speeds.fly).toBe("30");
  });

  it("does not bake excluded-effect class speed bonuses into base movement", async () => {
    // monk unarmored movement and barbarian fast movement are emitted as
    // active effects (config/dictionary/effects/excluded.ts), so the base
    // walk speed must stay at the racial value
    const monk = await loadFixtureCharacter("classes/monk", "Sheep-Dragon-Shepherd", { generateAbilities: false });
    monk._generateSpeed();
    expect(monk.raw.character.system.attributes.movement.speeds.walk).toBe("30");

    const barbarian = await loadFixtureCharacter("classes/barbarian", "Path-of-Wild-Magic", { generateAbilities: false });
    barbarian._generateSpeed();
    expect(barbarian.raw.character.system.attributes.movement.speeds.walk).toBe("30");
  });
});
