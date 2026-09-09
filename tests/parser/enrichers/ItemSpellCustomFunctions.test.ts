/**
 * Item enrichers that adjust a spell-as-activity copy through `customFunction`.
 *
 * DDBItem.#addSpellAsActivity hands the cloned spell activity to the enricher wrapped in the
 * hint shape the enrichers are typed against (`{ activity: { data } }`). Before that wrap the
 * enrichers read `activity.data` off a raw activity object: Staff of Healing silently never
 * applied and Circlet of Blasting threw inside mergeObject on every character wearing one
 * (found by the character audit, 2026-09-08).
 */
import CircletOfBlasting from "../../../src/parser/enrichers/item/CircletOfBlasting";
import StaffOfHealing from "../../../src/parser/enrichers/item/StaffOfHealing";
import { makeEnricherData } from "../../_fixtures/ddb/factories";

function castActivity(): Partial<I5eCastActivity> {
  return {
    type: "cast",
    spell: { ability: "", challenge: { attack: "", save: "", override: false }, level: null, properties: [], spellbook: true, uuid: "" },
  } as Partial<I5eCastActivity>;
}

describe("Circlet of Blasting", () => {
  it("fixes the Scorching Ray attack bonus at +5 on the activity data", async () => {
    const enricher = makeEnricherData(CircletOfBlasting, { name: "Circlet of Blasting" });
    const options: ICustomFunctionOptions = { name: "Scorching Ray", activity: { data: castActivity() } };
    await enricher.customFunction(options);
    const data = options.activity?.data as Partial<I5eCastActivity>;
    expect(data.spell?.challenge).toEqual({ attack: "5", save: "", override: true });
  });

  it("leaves other spells alone", async () => {
    const enricher = makeEnricherData(CircletOfBlasting, { name: "Circlet of Blasting" });
    const options: ICustomFunctionOptions = { name: "Fireball", activity: { data: castActivity() } };
    await enricher.customFunction(options);
    const data = options.activity?.data as Partial<I5eCastActivity>;
    expect(data.spell?.challenge).toEqual({ attack: "", save: "", override: false });
  });
});

describe("Staff of Healing", () => {
  it("makes Cure Wounds consume a charge, scaling up to four, instead of a spell slot", async () => {
    const enricher = makeEnricherData(StaffOfHealing, { name: "Staff of Healing" });
    const options: ICustomFunctionOptions = { name: "Cure Wounds", activity: { data: { type: "heal" } } };
    await enricher.customFunction(options);
    const consumption = options.activity?.data?.consumption;
    expect(consumption?.spellSlot).toBe(false);
    expect(consumption?.targets?.[0]).toMatchObject({ type: "itemUses", value: "1" });
    expect(consumption?.scaling).toEqual({ allowed: true, max: "4" });
  });
});
