/**
 * Pins for the Transmuter's Stone (AU 2024) self-enchantment: every profile must target its own
 * enchant activity by id (the rename and the blanked consumption are what make "Change Stone
 * Benefit" free), ride exactly one bearer effect, and the Potent Stone additions must only appear
 * when the feature is known. The audit harness shows the linked profiles but not the change keys.
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

import TransmutersStone from "../../../src/parser/enrichers/class/wizard/TransmutersStone";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

const ID = /^[A-Za-z0-9]{16}$/;

function transmuter({ potent }: { potent: boolean }): TransmutersStone {
  const classFeatures = [{ definition: { name: "Transmuter's Stone", requiredLevel: 3 } }];
  if (potent) classFeatures.push({ definition: { name: "Potent Stone", requiredLevel: 10 } });
  return makeEnricherData(TransmutersStone, {
    name: "Transmuter's Stone",
    character: {
      classes: [{ level: potent ? 10 : 3, definition: { name: "Wizard" }, subclassDefinition: { name: "Transmuter" }, classFeatures }],
    },
  });
}

describe("Transmuter's Stone self-enchantment", () => {
  it("offers the three level 3 benefits (resistance per damage type) on one consuming enchant activity", () => {
    const enricher = transmuter({ potent: false });
    expect(enricher.type).toBe("enchant");
    expect(enricher.noChoiceBuild).toBe(true);
    const activity = enricher.activity as any;
    expect(activity).toMatchObject({ id: TransmutersStone.CREATE_ACTIVITY_ID, addItemConsume: true, data: { enchant: { self: true } } });
    expect(activity.id).toMatch(ID);
    expect(enricher.additionalActivities).toEqual([]);

    const enchantments = enricher.effects.filter((hint) => hint.type === "enchant");
    expect(enchantments.map((hint) => hint.name)).toEqual([
      "Stone Benefit: Darkvision",
      "Stone Benefit: Resistance (Acid)",
      "Stone Benefit: Resistance (Cold)",
      "Stone Benefit: Resistance (Fire)",
      "Stone Benefit: Resistance (Lightning)",
      "Stone Benefit: Resistance (Poison)",
      "Stone Benefit: Resistance (Thunder)",
      "Stone Benefit: Speed",
    ]);
    expect(enchantments.every((hint) => hint.activityMatch === TransmutersStone.CREATE_ACTIVITY_NAME)).toBe(true);
  });

  it("renames the activity and blanks its consumption while a benefit is applied", () => {
    const enricher = transmuter({ potent: false });
    const darkvision = enricher.effects.find((hint) => hint.name === "Stone Benefit: Darkvision")!;
    expect(darkvision.changes).toEqual([
      expect.objectContaining({ key: `system.activities.${TransmutersStone.CREATE_ACTIVITY_ID}.name`, value: "Change Stone Benefit" }),
      expect.objectContaining({ key: `system.activities.${TransmutersStone.CREATE_ACTIVITY_ID}.consumption.targets`, value: "[]" }),
    ]);
  });

  it("rides one transfer effect per profile carrying Constitution save proficiency plus the benefit", () => {
    const enricher = transmuter({ potent: false });
    const riders = enricher.effects.filter((hint) => hint.options?.transfer);
    expect(riders).toHaveLength(8);
    const riderIds = new Set(riders.map((hint) => hint.data!._id as string));
    expect(riderIds.size).toBe(8);
    for (const id of riderIds) expect(id).toMatch(ID);

    for (const hint of enricher.effects.filter((h) => h.type === "enchant")) {
      const [riderId, ...rest] = hint.data!.flags!.ddbimporter!.effectRiders!;
      expect(rest).toEqual([]);
      expect(riderIds.has(riderId)).toBe(true);
    }

    const fire = riders.find((hint) => hint.name === "Transmuter's Stone: Resistance (Fire)")!;
    expect(fire.changes).toEqual([
      expect.objectContaining({ key: "system.abilities.con.proficient" }),
      expect.objectContaining({ key: "system.traits.dr.value", value: "fire" }),
    ]);
    const speed = riders.find((hint) => hint.name === "Transmuter's Stone: Speed")!;
    expect(speed.changes[1]).toMatchObject({ key: "system.attributes.movement.speeds.walk", value: "10" });
  });

  it("with Potent Stone adds a free second enchant activity and the Mighty Build and Tremorsense profiles", () => {
    const enricher = transmuter({ potent: true });
    expect(enricher.additionalActivities).toHaveLength(1);
    const second = enricher.additionalActivities[0];
    expect(second.init).toEqual({ name: TransmutersStone.SECOND_ACTIVITY_NAME, type: "enchant" });
    expect(second.overrides).toMatchObject({ id: TransmutersStone.SECOND_ACTIVITY_ID, noConsumeTargets: true, data: { enchant: { self: true } } });
    expect(enricher.override.ignoredConsumptionActivities).toEqual([TransmutersStone.SECOND_ACTIVITY_NAME]);

    const enchantments = enricher.effects.filter((hint) => hint.type === "enchant");
    expect(enchantments).toHaveLength(20);
    const byActivity = (name: string) => enchantments.filter((hint) => hint.activityMatch === name);
    expect(byActivity(TransmutersStone.CREATE_ACTIVITY_NAME).map((hint) => hint.name)).toContain("Stone Benefit: Mighty Build");
    expect(byActivity(TransmutersStone.SECOND_ACTIVITY_NAME).map((hint) => hint.name)).toContain("Stone Benefit: Tremorsense");

    const ids = enchantments.map((hint) => hint.data!._id as string);
    expect(new Set(ids).size).toBe(20);

    const secondTremor = byActivity(TransmutersStone.SECOND_ACTIVITY_NAME).find((hint) => hint.name === "Stone Benefit: Tremorsense")!;
    expect(secondTremor.changes).toEqual([
      expect.objectContaining({ key: `system.activities.${TransmutersStone.SECOND_ACTIVITY_ID}.name`, value: "Change Second Benefit" }),
    ]);

    const mighty = enricher.effects.find((hint) => hint.name === "Transmuter's Stone: Mighty Build")!;
    expect(mighty.changes.map((change) => change.key)).toEqual([
      "system.abilities.con.proficient",
      "system.abilities.str.save.roll.mode",
      "flags.dnd5e.powerfulBuild",
    ]);
  });

  it("leaves the 2014 School of Transmutation printing on its DDB defaults", () => {
    const enricher = makeEnricherData(TransmutersStone, { name: "Transmuter's Stone", is2014: true });
    expect(enricher.type).toBeNull();
    expect(enricher.activity).toBeNull();
    expect(enricher.effects).toEqual([]);
    expect(enricher.noChoiceBuild).toBe(false);
    expect(enricher.useDefaultAdditionalActivities).toBe(true);
  });
});
