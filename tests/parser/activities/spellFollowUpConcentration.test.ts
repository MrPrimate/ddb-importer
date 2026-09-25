// @vitest-environment jsdom
// The feature factory initializes the real activity/enricher dependency chain first.
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBSpellActivity from "../../../src/parser/activities/DDBSpellActivity";
import DDBSpellEnricher from "../../../src/parser/enrichers/DDBSpellEnricher";
import type DDBSpell from "../../../src/parser/spells/DDBSpell";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

// The spell parser's own extras (study checks, extra healing, a save beside an attack) are used
// after the cast, so they keep the spell's duration without beginning concentration again.
describe("parser-built spell follow-ups", () => {
  function host(concentration = true) {
    const definition = { name: "Test Spell", level: 2, description: "", modifiers: [], range: { rangeValue: 60 } };
    const parent = {
      name: "Test Spell",
      originalName: "Test Spell",
      is2014: false,
      ddbDefinition: definition,
      spellData: { definition },
      data: {
        name: "Test Spell",
        type: "spell",
        effects: [],
        flags: {},
        system: {
          description: { value: "" },
          duration: { value: "1", units: "minute", concentration },
          activities: {},
        },
      },
    } as unknown as DDBSpell;
    (parent as any).enricher = new DDBSpellEnricher({ activityGenerator: DDBSpellActivity });
    return parent;
  }

  it("keeps the spell's duration without concentration on a slotless follow-up", () => {
    const activity = new DDBSpellActivity({ type: "check", name: "Study Check", ddbParent: host() });
    activity.build({ generateCheck: true, noSpellslot: true, noConcentration: true });
    expect(activity.data.duration).toEqual({ value: "1", units: "minute", concentration: false, override: true });
  });

  it("recognises a save made slotless through its consumption override", () => {
    const activity = new DDBSpellActivity({ type: "save", name: "Save", ddbParent: host() });
    activity.build({
      generateSave: true,
      noConcentration: true,
      consumptionOverride: { targets: [], spellSlot: false, scaling: { allowed: false, max: "" } },
    });
    expect(activity.data.duration).toMatchObject({ units: "minute", concentration: false, override: true });
  });

  it("leaves a slot-spending activity, a non-concentration spell and an explicit duration alone", () => {
    const cast = new DDBSpellActivity({ type: "save", name: "Cast", ddbParent: host() });
    cast.build({ generateSave: true, noConcentration: true });
    expect(cast.data.duration?.override).not.toBe(true);

    const plain = new DDBSpellActivity({ type: "heal", name: "Healing", ddbParent: host(false) });
    plain.build({ noSpellslot: true, noConcentration: true });
    expect(plain.data.duration?.override).not.toBe(true);

    const explicit = new DDBSpellActivity({ type: "damage", name: "Damage", ddbParent: host() });
    explicit.build({
      noSpellslot: true,
      noConcentration: true,
      generateDuration: true,
      durationOverride: { units: "inst", concentration: false },
    });
    expect(explicit.data.duration).toMatchObject({ units: "inst", concentration: false, override: true });

    const viaData = new DDBSpellActivity({ type: "save", name: "Save", ddbParent: host() });
    viaData.build({
      noSpellslot: true,
      noConcentration: true,
      data: { duration: { override: true, units: "inst", concentration: false } },
    });
    expect(viaData.data.duration?.value ?? null).toBeNull();
    expect(viaData.data.duration).toMatchObject({ units: "inst", concentration: false });
  });
});
