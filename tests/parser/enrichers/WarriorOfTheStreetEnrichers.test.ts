/**
 * Warrior of the Street (monk) enrichers. The audit harness runs module-free and never sees
 * ac5eOnly hints, and it only exercises the captured build, so the AC5e values, the Combo stage
 * wiring and the K.O. restore consumption are pinned here.
 *
 * The vi.mock preamble is copied from CharacterAc5eOptinEnrichers.test.ts (see the rationale
 * there); ChangeHelper is real because it builds the output.
 */
const loggerMock = vi.hoisted(() => ({
  warn: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  verbose: vi.fn(),
}));

vi.mock("../../../src/lib/_module", () => ({ logger: loggerMock, utils: { capitalize: (s: string) => s } }));
vi.mock("../../../src/parser/spells/CharacterSpellFactory", () => ({ default: class {} }));
vi.mock("../../../src/parser/spells/DDBSpell", () => ({ default: class {} }));
vi.mock("../../../src/parser/lib/_module", () => ({
  DDBDataUtils: {
    findSubClassByFeatureId: vi.fn(),
    classIdentifierName: (name: string) => name,
    getLimitedUses: vi.fn(),
  },
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

import AirDash from "../../../src/parser/enrichers/class/monk/AirDash";
import Combo from "../../../src/parser/enrichers/class/monk/Combo";
import IronFist from "../../../src/parser/enrichers/class/monk/IronFist";
import KO from "../../../src/parser/enrichers/class/monk/KO";
import SpecialMoveEnergyBlast from "../../../src/parser/enrichers/class/monk/SpecialMoveEnergyBlast";
import SpecialMoveGuardBreaker from "../../../src/parser/enrichers/class/monk/SpecialMoveGuardBreaker";
import SpecialMoveUppercut from "../../../src/parser/enrichers/class/monk/SpecialMoveUppercut";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

function build(Enricher: TEnricher): any {
  return makeEnricherData(Enricher, { name: "Test", actions: null });
}

describe("Combo", () => {
  it("spends Focus only to begin the combo", () => {
    const e = build(Combo);
    expect(e.activity).toMatchObject({ name: "Begin Combo", addItemConsume: true, itemConsumeTargetName: "Monk's Focus" });
    expect(e.additionalActivities.map((a: any) => [a.id, a.overrides.name, a.overrides.noConsumeTargets])).toEqual([
      ["ddbComboSecondHt", "Combo: Second Hit", true],
      ["ddbComboThirdHit", "Combo: Third Hit", true],
    ]);
  });

  it("stacks an Unarmed Strike attack bonus per stage, with a melee fallback without AC5e", () => {
    const hints = build(Combo).effects as any[];
    const stages = ["Begin Combo", "Combo: Second Hit", "Combo: Third Hit"];
    const ac5eHints = hints.filter((hint) => hint.ac5eOnly);
    const coreHints = hints.filter((hint) => hint.ac5eNever);
    expect(ac5eHints.map((hint) => hint.activityMatch)).toEqual(stages);
    expect(coreHints.map((hint) => hint.activityMatch)).toEqual(stages);
    for (const hint of ac5eHints) {
      expect(hint.options.durationTurns).toBe(1);
      expect(hint.ac5eChanges).toEqual([expect.objectContaining({
        key: "flags.automated-conditions-5e.attack.bonus",
        value: "bonus=2; item.name.includes('Unarmed')",
      })]);
    }
    for (const hint of coreHints) {
      expect(hint.changes).toEqual([expect.objectContaining({ key: "system.bonuses.mwak.attack", value: "2" })]);
    }
  });
});

describe("K.O.", () => {
  it("spends its own use and restores it with 5 Focus", () => {
    const e = build(KO);
    expect(e.activity).toMatchObject({ name: "K.O.", addItemConsume: true });
    expect(e.activity.itemConsumeTargetName).toBeUndefined();
    const [restore] = e.additionalActivities;
    expect(restore.id).toBe("ddbKORestoreUse1");
    expect(restore.overrides).toMatchObject({ itemConsumeTargetName: "Monk's Focus", itemConsumeValue: "5" });
    expect(restore.overrides.additionalConsumptionTargets).toEqual([expect.objectContaining({ type: "itemUses", target: "", value: "-1" })]);
    expect(e.effects).toEqual([expect.objectContaining({ activityMatch: "K.O.", statuses: ["Unconscious"] })]);
  });
});

describe("Air Dash", () => {
  it("takes no action and grants flight until the end of the next turn", () => {
    const e = build(AirDash);
    expect(e.activity.activationType).toBe("special");
    const [flight] = e.effects;
    expect(flight.options).toMatchObject({ expiry: null, durationRounds: 1, durationTurns: 1 });
    expect(flight.changes[0]).toMatchObject({ key: "system.attributes.movement.fly", value: "@attributes.movement.walk" });
  });

  it("puts the one-attack melee advantage on the midi and AC5e channels", () => {
    const [, advantage] = build(AirDash).effects;
    expect(advantage.daeSpecialDurations).toEqual(["1Attack"]);
    expect(advantage.options.durationTurns).toBe(1);
    expect(advantage.midiChanges.map((c: any) => c.key)).toEqual([
      "flags.midi-qol.advantage.attack.mwak",
      "flags.midi-qol.advantage.attack.msak",
    ]);
    expect(advantage.ac5eChanges).toEqual([expect.objectContaining({
      key: "flags.automated-conditions-5e.attack.advantage",
      value: "once; actionType.mwak || actionType.msak",
    })]);
  });
});

describe("Iron Fist and the Special Moves actions", () => {
  it("Iron Fist builds no activity", () => {
    const e = build(IronFist);
    expect(e.stopDefaultActivity).toBe(true);
    expect(e.useDefaultAdditionalActivities).toBe(false);
  });

  it("fix the move activities and scope Prone to Uppercut", () => {
    expect(build(SpecialMoveGuardBreaker).activity.data.damage.parts[0].custom.formula).toBe("@abilities.dex.mod");
    expect(build(SpecialMoveEnergyBlast).activity).toMatchObject({ activationType: "special", data: { damage: { onSave: "half" } } });
    expect(build(SpecialMoveUppercut).effects).toEqual([
      expect.objectContaining({ activityMatch: "Uppercut", statuses: ["Prone"] }),
    ]);
  });
});
