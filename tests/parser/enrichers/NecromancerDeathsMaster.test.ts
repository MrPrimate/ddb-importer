/**
 * Pins for the Necromancer (AU 2024) Harvest Undead / Death's Master split. DDB shipped the level
 * 14 feature under the level 10 name until 2026-09-08; these lock the corrected layout: Harvest
 * Undead is the reaction heal alone, Death's Master carries the three DDB actions, and the
 * spell-slot Extinguish variant is a reaction costing a level 5 slot that shares the sibling
 * "No Reactions" effect rather than emitting a duplicate.
 */
const loggerMock = vi.hoisted(() => ({
  warn: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  verbose: vi.fn(),
}));

vi.mock("../../../src/lib/_module", async () => ({
  logger: loggerMock,
  utils: (await vi.importActual<any>("../../../src/lib/Utils")).default,
}));
vi.mock("../../../src/parser/spells/CharacterSpellFactory", () => ({ default: class {} }));
vi.mock("../../../src/parser/spells/DDBSpell", () => ({ default: class {} }));
vi.mock("../../../src/parser/lib/_module", async () => ({
  DDBDataUtils: (await vi.importActual<any>("../../../src/parser/lib/DDBDataUtils")).default,
  DDBTemplateStrings: {
    parse: vi.fn((_ddb: any, _raw: any, text: string) => ({ text })),
  },
}));
vi.mock("../../../src/parser/enrichers/effects/_module", async () => ({
  AutoEffects: { effectModules: () => ({ ac5eInstalled: false }) },
  EnchantmentEffects: {},
  ChangeHelper: (await vi.importActual<any>("../../../src/parser/enrichers/effects/ChangeHelper")).default,
  EffectGenerator: {},
}));

import HarvestUndead from "../../../src/parser/enrichers/class/wizard/HarvestUndead";
import DeathsMaster from "../../../src/parser/enrichers/class/wizard/DeathsMaster";
import ExtinguishUndead from "../../../src/parser/enrichers/class/wizard/ExtinguishUndead";
import ExtinguishUndeadSpellSlot from "../../../src/parser/enrichers/class/wizard/ExtinguishUndeadSpellSlot";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

describe("Necromancer Death's Master", () => {
  it("Harvest Undead is only the level 10 reaction heal", () => {
    const enricher = makeEnricherData(HarvestUndead, { name: "Harvest Undead", actions: null });
    expect(enricher.type).toBe("heal");
    expect(enricher.additionalActivities ?? []).toEqual([]);
    expect(enricher.useDefaultAdditionalActivities).toBe(false);
    expect((enricher.activity as any).activationType).toBe("reaction");
  });

  it("Death's Master carries the Bolster and both Extinguish actions", () => {
    const enricher = makeEnricherData(DeathsMaster, { name: "Death's Master", actions: null });
    expect(enricher.type).toBe("none");
    expect(enricher.additionalActivities.map((a: any) => a.action.name)).toEqual([
      "Bolster Undead: Bonus Temp HP",
      "Extinguish Undead",
      "Extinguish Undead: Spell Slot",
    ]);
  });

  it("the spell-slot Extinguish is a reaction costing a level 5 slot and shares the No Reactions effect", () => {
    const base = makeEnricherData(ExtinguishUndead, { name: "Extinguish Undead", actions: null, isAction: true });
    const slot = makeEnricherData(ExtinguishUndeadSpellSlot, { name: "Extinguish Undead: Spell Slot", actions: null, isAction: true });
    const activity = slot.activity as any;
    expect(activity.name).toBe("Extinguish Uncontrolled Undead");
    expect(activity.activationType).toBe("reaction");
    expect(activity.additionalConsumptionTargets).toEqual([
      { type: "spellSlots", value: "1", target: "5", scaling: { mode: "level", formula: "" } },
    ]);
    expect(activity.data.save.ability).toEqual(["dex"]);
    expect(slot.effects).toEqual([]);
    expect(base.effects[0].activitiesMatch).toEqual(["Extinguish Undead", "Extinguish Uncontrolled Undead"]);
  });
});
