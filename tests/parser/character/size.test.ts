import "../../../src/parser/character/size";
import { makeMockCharacter } from "../../_fixtures/mockCharacter";
import { auditFixturesPresent, loadFixtureCharacter } from "../../_fixtures/ddb/auditCharacterFixtures";
import DDBCharacter from "../../../src/parser/DDBCharacter";

const generateSize = DDBCharacter.prototype._generateSize;

function sizeMock(ddbCharacter: Record<string, any>): any {
  const mock = makeMockCharacter({ ddbCharacter });
  mock.raw.character.prototypeToken = { texture: {} };
  return mock;
}

describe("DDBCharacter._generateSize (synthetic)", () => {
  it("defaults to medium when the race has no size information", () => {
    const mock = sizeMock({ race: { fullName: "Sizeless" } });
    generateSize.call(mock);
    expect(mock.raw.character.system.traits.size).toBe("med");
    expect(mock.raw.character.prototypeToken.width).toBe(1);
    expect(mock.raw.character.prototypeToken.texture.scaleX).toBe(1);
  });

  it("maps a small race by sizeId", () => {
    const mock = sizeMock({ race: { fullName: "Goblin", sizeId: 3 } });
    generateSize.call(mock);
    expect(mock.raw.character.system.traits.size).toBe("sm");
  });

  it("maps a race by size name string", () => {
    const mock = sizeMock({ race: { fullName: "Firbolg", size: "Medium" } });
    generateSize.call(mock);
    expect(mock.raw.character.system.traits.size).toBe("med");
  });

  it("prefers a race size modifier over the race size field", () => {
    const mock = sizeMock({
      race: { fullName: "Custom", sizeId: 4 },
      modifiers: {
        race: [{ type: "size", subType: "large", isGranted: true, restriction: "" }],
        class: [], background: [], item: [], feat: [], condition: [],
      },
    });
    generateSize.call(mock);
    expect(mock.raw.character.system.traits.size).toBe("lg");
    expect(mock.raw.character.prototypeToken.width).toBe(2);
  });

  // v7.0.x: skipped, expects dnd5e 6.0 / v14 branch behaviour or an API not on this branch; review before enabling

  it.skip("does nothing without a prototype token skeleton", () => {
    const mock = makeMockCharacter({ ddbCharacter: { race: { fullName: "Goblin", sizeId: 3 } } });
    generateSize.call(mock);
    expect(mock.raw.character.system.traits.size).toBeUndefined();
  });
});

describe.skipIf(!auditFixturesPresent())("DDBCharacter._generateSize (audit fixtures)", () => {
  it("parses a small species capture (Grung) with token scale", async () => {
    const mock = await loadFixtureCharacter("species", "-Grung-", { generateAbilities: false });
    mock._generateSize();
    expect(mock.raw.character.system.traits.size).toBe("sm");
    expect(mock.raw.character.prototypeToken.width).toBe(1);
    expect(mock.raw.character.prototypeToken.texture.scaleX).toBe(0.8);
  });

  it("parses a medium species capture (Aarakocra)", async () => {
    const mock = await loadFixtureCharacter("species", "-Aarakocra-", { generateAbilities: false });
    mock._generateSize();
    expect(mock.raw.character.system.traits.size).toBe("med");
    expect(mock.raw.character.prototypeToken.texture.scaleX).toBe(1);
  });
});
