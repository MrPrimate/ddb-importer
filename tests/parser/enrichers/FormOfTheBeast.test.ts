import FormOfTheBeast from "../../../src/parser/enrichers/class/warlock/FormOfTheBeast";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

/**
 * dnd5e 5.x does not copy an activity's duration onto the effect it applies, and the description
 * parser's first duration match is the level 6 upgrade, so the effect carries its own span.
 */
describe("Form of the Beast effect duration", () => {
  const warlock = (level: number) => ({ classes: [{ level, definition: { name: "Warlock" } }] });

  const durationAt = (character: Record<string, any>) =>
    makeEnricherData(FormOfTheBeast, { name: "Form of the Beast", character }).effects[0].options;

  it("lasts ten minutes below warlock level 6", () => {
    expect(durationAt(warlock(3))).toMatchObject({ durationSeconds: 600, expiry: null });
    expect(durationAt(warlock(5))).toMatchObject({ durationSeconds: 600 });
  });

  it("lasts an hour from warlock level 6", () => {
    expect(durationAt(warlock(6))).toMatchObject({ durationSeconds: 3600 });
    expect(durationAt(warlock(20))).toMatchObject({ durationSeconds: 3600 });
  });

  it("takes the base ten minutes when munched without a character", () => {
    expect(durationAt({})).toMatchObject({ durationSeconds: 600 });
  });
});

describe("Form of the Beast attacks and scale root", () => {
  const build = (options: Parameters<typeof makeEnricherData>[1] = {}): any =>
    makeEnricherData(FormOfTheBeast, { name: "Form of the Beast", ...options });

  it("makes Bite and Claw melee Unarmed Strikes that add the better of Strength and Charisma once", () => {
    const attacks = build().additionalActivities.filter((a: any) => ["Bite", "Claw"].includes(a.init?.name));
    expect(attacks).toHaveLength(2);
    for (const attack of attacks) {
      expect(attack.overrides.data.attack).toMatchObject({
        ability: "none",
        bonus: "max(@abilities.str.mod, @abilities.cha.mod)",
        type: { value: "melee", classification: "unarmed" },
      });
    }
  });

  it("roots the duration scale on the warlock class, and on nothing for the muncher", () => {
    const warlock = { ddbCharacter: { raw: { classes: [{ name: "Warlock", _id: "warlock0000000aa" }] } } };
    expect(build({ ddbParser: warlock }).override.data.flags)
      .toEqual({ dnd5e: { advancementRoot: "warlock0000000aa" } });
    // no warlock on a muncher import, so no root
    expect(build().override.data.flags).toEqual({});
  });
});
