import DDBCharacter from "../../../src/parser/DDBCharacter";
import "../../../src/parser/character/senses";
import { makeMockCharacter } from "../../_fixtures/mockCharacter";
import { auditFixturesPresent, loadFixtureCharacter } from "../../_fixtures/ddb/auditCharacterFixtures";

const getSenses = DDBCharacter.prototype.getSenses;

function senseMock(ddbCharacter: Record<string, any>): any {
  return makeMockCharacter({ ddbCharacter });
}

describe("DDBCharacter.getSenses (synthetic)", () => {
  it("returns zeroed ranges for a character with no sense data", () => {
    const senses = getSenses.call(senseMock({}));
    expect(senses).toEqual({
      ranges: { darkvision: 0, blindsight: 0, tremorsense: 0, truesight: 0 },
      units: "ft",
      special: "",
    });
  });

  it("maps an integer custom sense onto its range", () => {
    // senseId 2 = Darkvision in DICTIONARY.actor.senses
    const senses = getSenses.call(senseMock({
      customSenses: [{ senseId: 2, distance: 90 }],
    }));
    expect(senses.ranges?.darkvision).toBe(90);
  });

  it("surfaces an unmappable custom sense in special", () => {
    // unmappable custom senses once wrote to senses.special directly, which
    // the final special.join() clobbered - they now share the special array
    const senses = getSenses.call(senseMock({
      customSenses: [{ senseId: 99, distance: 15 }],
    }));
    expect(senses.special).toBe("15");
    expect(senses.ranges?.darkvision).toBe(0);
  });

  it("labels a mapped custom sense with a non-integer distance in special", () => {
    const senses = getSenses.call(senseMock({
      customSenses: [{ senseId: 2, distance: 15.5 }],
    }));
    expect(senses.special).toBe("Darkvision (15.5)");
    expect(senses.ranges?.darkvision).toBe(0);
  });

  it("joins custom-sense specials with modifier specials", () => {
    const senses = getSenses.call(senseMock({
      customSenses: [{ senseId: 99, distance: 15 }],
      modifiers: {
        race: [
          { type: "sense", subType: "magical-darkness", value: null, friendlySubtypeName: "Magical Darkness", isGranted: true, restriction: "" },
        ],
        class: [], background: [], item: [], feat: [], condition: [],
      },
    }));
    expect(senses.special).toBe("15, Magical Darkness");
  });

  it("takes the highest set-base modifier for a sense", () => {
    const senses = getSenses.call(senseMock({
      modifiers: {
        race: [
          { type: "set-base", subType: "darkvision", value: 60, isGranted: true, restriction: "" },
          { type: "set-base", subType: "darkvision", value: 120, isGranted: true, restriction: "" },
        ],
        class: [], background: [], item: [], feat: [], condition: [],
      },
    }));
    expect(senses.ranges?.darkvision).toBe(120);
  });

  it("ignores a set-base modifier granted by an unchosen choice option", () => {
    const senses = getSenses.call(senseMock({
      modifiers: {
        race: [
          { type: "set-base", subType: "darkvision", value: 60, isGranted: true, restriction: "", componentId: 111 },
        ],
        class: [], background: [], item: [], feat: [], condition: [],
      },
      choices: {
        class: [], race: [], feat: [],
        choiceDefinitions: [{ options: [{ id: 111 }] }],
      },
    }));
    expect(senses.ranges?.darkvision).toBe(0);
  });

  // note: class-bucket modifiers only apply when they trace to a chosen class
  // feature id, which needs a full class structure; the race bucket passes
  // through directly, so these restriction/bonus branches are exercised there
  it("treats Devil's Sight as darkvision plus a special note", () => {
    const senses = getSenses.call(senseMock({
      modifiers: {
        race: [
          {
            type: "set-base", subType: "darkvision", value: 120, isGranted: true,
            restriction: "You can see normally in darkness, both magical and nonmagical",
          },
        ],
        class: [], background: [], item: [], feat: [], condition: [],
      },
    }));
    expect(senses.ranges?.darkvision).toBe(120);
    expect(senses.special).toContain("You can see normally in darkness");
  });

  it("adds a sense bonus modifier on top of a base range (Gloom Stalker style)", () => {
    const senses = getSenses.call(senseMock({
      modifiers: {
        race: [
          { type: "set-base", subType: "darkvision", value: 60, isGranted: true, restriction: "" },
          { type: "sense", subType: "darkvision", value: 60, isGranted: true, restriction: "" },
        ],
        class: [], background: [], item: [], feat: [], condition: [],
      },
    }));
    expect(senses.ranges?.darkvision).toBe(120);
  });

  it("collects a valueless sense modifier into special by name", () => {
    const senses = getSenses.call(senseMock({
      modifiers: {
        race: [
          { type: "sense", subType: "magical-darkness", value: null, friendlySubtypeName: "Magical Darkness", isGranted: true, restriction: "" },
        ],
        class: [], background: [], item: [], feat: [], condition: [],
      },
    }));
    expect(senses.special).toBe("Magical Darkness");
  });
});

describe.skipIf(!auditFixturesPresent())("DDBCharacter senses (audit fixtures)", () => {
  it("parses Deep Gnome superior darkvision from a real capture", async () => {
    const mock = await loadFixtureCharacter("species", "-Deep Gnome-", { generateAbilities: false });
    const senses = mock.getSenses();
    expect(senses.ranges?.darkvision).toBe(120);
    expect(senses.ranges?.truesight).toBe(0);
  });

  it("_generateSenses writes the ranges onto system attributes", async () => {
    const mock = await loadFixtureCharacter("species", "-Deep Gnome-", { generateAbilities: false });
    mock._generateSenses();
    expect(mock.raw.character.system.attributes.senses.ranges.darkvision).toBe(120);
    expect(mock.raw.character.system.attributes.senses.units).toBe("ft");
  });

  it("finds no senses on a race without any (Grung)", async () => {
    const mock = await loadFixtureCharacter("species", "-Grung-", { generateAbilities: false });
    const senses = mock.getSenses();
    expect(senses.ranges).toEqual({ darkvision: 0, blindsight: 0, tremorsense: 0, truesight: 0 });
  });
});
