import "../../../src/parser/character/currency";
import { makeMockCharacter } from "../../_fixtures/mockCharacter";
import { auditFixturesPresent, loadFixtureCharacter } from "../../_fixtures/ddb/auditCharacterFixtures";
import DDBCharacter from "../../../src/parser/DDBCharacter";

const generateCurrency = DDBCharacter.prototype._generateCurrency;

function currencyMock(currencies: Record<string, number>): any {
  return makeMockCharacter({ ddbCharacter: { currencies } });
}

describe("DDBCharacter._generateCurrency (synthetic)", () => {
  it("maps all five DDB denominations onto system currency", () => {
    const mock = currencyMock({ pp: 1, gp: 25, ep: 3, sp: 14, cp: 99 });
    generateCurrency.call(mock);
    expect(mock.raw.character.system.currency).toEqual({ pp: 1, gp: 25, ep: 3, sp: 14, cp: 99 });
  });

  it("keeps _currency as an independent clone of the generated currency", () => {
    const mock = currencyMock({ pp: 0, gp: 10, ep: 0, sp: 0, cp: 5 });
    generateCurrency.call(mock);
    expect(mock._currency).toEqual({ pp: 0, gp: 10, ep: 0, sp: 0, cp: 5 });
    mock.raw.character.system.currency.gp = 999;
    expect(mock._currency.gp).toBe(10);
  });

  // v7.0.x: skipped, expects dnd5e 6.0 / v14 branch behaviour or an API not on this branch; review before enabling

  it.skip("does nothing without DDB source data", () => {
    const mock = currencyMock({ pp: 1, gp: 1, ep: 1, sp: 1, cp: 1 });
    mock.source = undefined;
    generateCurrency.call(mock);
    expect(mock.raw.character.system.currency).toBeUndefined();
    expect(mock._currency).toBeUndefined();
  });
});

describe.skipIf(!auditFixturesPresent())("DDBCharacter._generateCurrency (audit fixtures)", () => {
  it("maps the all-zero mule-capture currency block through unchanged", async () => {
    const mock = await loadFixtureCharacter("backgrounds", "-Acolyte-", { generateAbilities: false });
    mock._generateCurrency();
    expect(mock.raw.character.system.currency).toEqual({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });
  });
});
