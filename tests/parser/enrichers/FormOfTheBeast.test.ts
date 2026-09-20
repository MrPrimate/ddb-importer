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
