/**
 * Pins for the Vestige Patron companion actors: each keeps only its own form's Divine Power option
 * in the description and gets that option as its activity, and its Vestige's Strike hits for the
 * form's damage type. The stat block text
 * here is a synthetic stand-in with the same paragraph shape as DDB's.
 */
import { DivinePower, VestigesStrike } from "../../../src/parser/enrichers/monster/VestigeCompanion/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

const DESCRIPTION = [
  "<div class=\"ddb\">\n",
  "<p> Your vestige manifests a remnant of its divine power in one of the following ways, based on its form:</p>",
  "<p><strong>Cursed Invocation (Undead Only).</strong> Undead text.</p>",
  "<p><strong>Fiendish Swap (Fiend Only).</strong> Fiend text.</p>",
  "<p><strong>Healing Touch (Celestial Only).</strong> Celestial text.</p>",
  "\n</div>",
].join("");

function divinePower(form: string): DivinePower {
  return makeEnricherData(DivinePower, {
    name: "Divine Power",
    actions: null,
    data: { system: { description: { value: DESCRIPTION, chat: "" }, activities: {} } },
    ddbParser: { ddbMonster: { npc: { name: `Vestige Companion (${form})` } } },
  });
}

describe("Vestige Companion Divine Power", () => {
  it.each([
    ["Celestial", "heal", "Healing Touch", "Celestial text."],
    ["Fiend", "teleport", "Fiendish Swap", "Fiend text."],
    ["Undead", "utility", "Cursed Invocation", "Undead text."],
  ])("keeps and implements only the %s option", async (form, type, name, text) => {
    const enricher = divinePower(form);
    expect(enricher.form).toBe(form);
    expect(enricher.type).toBe(type);
    expect(enricher.activity).toMatchObject({ name, activationType: "bonus", addItemConsume: true });

    await enricher.cleanup();

    const value = enricher.data.system.description.value;
    expect(value).toContain(`<p><strong>${name}.</strong> ${text}</p>`);
    expect(value).not.toContain("manifests a remnant");
    expect(value).not.toContain("Only)");
    for (const other of ["Healing Touch", "Fiendish Swap", "Cursed Invocation"].filter((n) => n !== name)) {
      expect(value).not.toContain(other);
    }
  });

  it("reads a chosen form's stat block, where the lead-in and option share a paragraph", () => {
    const html = "<div class=\"ddb\">\n<p> Your vestige manifests a remnant of its divine power in one of the following ways, based on its form:<br /> <strong>Fiendish Swap.</strong> Fiend text.<br /><br /></p>\n</div>";
    expect(DivinePower.formDescription(html, "Fiend")).toBe("<div class=\"ddb\">\n<p><strong>Fiendish Swap.</strong> Fiend text.</p>\n</div>");
  });

  it("curses only from the Undead form", () => {
    expect(divinePower("Undead").effects).toEqual([
      expect.objectContaining({ name: "Cursed by Vestige", activityMatch: "Cursed Invocation", statuses: ["Cursed"] }),
    ]);
    expect(divinePower("Celestial").effects).toEqual([]);
  });

  it("leaves a companion without a known form alone", async () => {
    const enricher = divinePower("Aberration");
    expect(enricher.form).toBeNull();
    expect(enricher.type).toBeNull();
    await enricher.cleanup();
    expect(enricher.data.system.description.value).toBe(DESCRIPTION);
  });
});

describe("Vestige Companion Vestige's Strike", () => {
  function strike(form: string): VestigesStrike {
    return makeEnricherData(VestigesStrike, {
      name: "Vestige's Strike",
      actions: null,
      ddbParser: { ddbMonster: { npc: { name: `Vestige Companion (${form})` } } },
    });
  }

  it.each([
    ["Celestial", "radiant"],
    ["Fiend", "fire"],
    ["Undead", "necrotic"],
  ])("the %s form hits for 1d6 + 3 %s damage, melee or ranged", (form, type) => {
    const enricher = strike(form);
    expect(enricher.activity).toMatchObject({
      name: "Melee",
      data: {
        attack: { type: { value: "melee" } },
        damage: { parts: [expect.objectContaining({ number: 1, denomination: 6, bonus: "3", types: [type] })] },
      },
    });
    expect(enricher.additionalActivities[0].overrides).toMatchObject({ name: "Ranged", data: { range: { value: "60" } } });
  });
});
