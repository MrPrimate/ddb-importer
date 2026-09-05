/**
 * Pins for the Arcana Unleashed (2024) enrichers whose output the audit harness cannot see:
 * AC5e sandbox strings (the harness runs module-free, so ac5eChanges audit as empty) and the
 * Monk third-caster progression that Warrior of the Mystic Arts relies on.
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

import FocusedStrike from "../../../src/parser/enrichers/class/monk/FocusedStrike";
import StaffOfSkulls from "../../../src/parser/enrichers/item/StaffOfSkulls";
import ArcaneShot from "../../../src/parser/enrichers/class/fighter/ArcaneShot";
import BeguilingShot from "../../../src/parser/enrichers/class/fighter/BeguilingShot";
import EnfeeblingShot from "../../../src/parser/enrichers/class/fighter/EnfeeblingShot";
import PiercingShot from "../../../src/parser/enrichers/class/fighter/PiercingShot";
import { SPELL } from "../../../src/config/dictionary/spell/spell";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

function ac5eChanges(Enricher: TEnricher, options: any = {}): any[] {
  const enricher = makeEnricherData(Enricher, { name: "Test", actions: null, ...options });
  return (enricher.effects as any[]).flatMap((hint: any) => (hint.ac5eChanges ?? []).map((c: any) => ({ hint, ...c })));
}

describe("Arcana Unleashed AC5e pins", () => {
  it("Focused Strike scopes the save disadvantage to the monk's spells", () => {
    const changes = ac5eChanges(FocusedStrike);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      key: "flags.automated-conditions-5e.save.disadvantage",
      value: "isSpell && effectOriginTokenId === opponentId",
    });
    expect(changes[0].hint.options.expiry).toBe("sourceStart");
  });

  it("Chattering Staff of Skulls imposes a one-shot attack disadvantage", () => {
    const changes = ac5eChanges(StaffOfSkulls, { name: "Chattering Staff of Skulls" });
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ key: "flags.automated-conditions-5e.attack.disadvantage", value: "once; 1" });
    expect(ac5eChanges(StaffOfSkulls, { name: "Ominous Staff of Skulls" })).toHaveLength(0);
  });
});

describe("Arcana Unleashed Arcane Shot options", () => {
  it("Arcane Shot (2024) spends the Intelligence-modifier pool through one utility activity", () => {
    const enricher = makeEnricherData(ArcaneShot, { name: "Arcane Shot", actions: null });
    expect(enricher.type).toBe("utility");
    expect(enricher.activity).toMatchObject({ name: "Arcane Shot", addItemConsume: true, noTemplate: true });
    expect(enricher.useDefaultAdditionalActivities).toBe(false);
    expect((enricher.override as any).uses.max).toBe("max(1, @abilities.int.mod)");
  });

  it("Beguiling Shot rides the DDB action with two dice, no template and a Charmed rider", () => {
    const enricher = makeEnricherData(BeguilingShot, { name: "Beguiling Shot", actions: null });
    expect(enricher.useDefaultAdditionalActivities).toBe(true);
    expect(enricher.additionalActivities ?? []).toEqual([]);
    const activity = enricher.activity as any;
    expect(activity.noTemplate).toBe(true);
    expect(activity.data.damage.parts[0].custom.formula).toBe("2@scale.arcane-archer.arcane-shot.die");
    expect(activity.data.damage.onSave).toBe("full");
    expect(enricher.effects[0]).toMatchObject({ activityMatch: "Beguiling Shot", statuses: ["Charmed"], options: { expiry: "sourceStart" } });
  });

  it("Piercing Shot is a 30 ft line with a Dexterity save for half", () => {
    const enricher = makeEnricherData(PiercingShot, { name: "Piercing Shot", actions: null });
    const activity = enricher.activity as any;
    expect(activity.name).toBeUndefined();
    expect(activity.data.target.template).toMatchObject({ type: "line", size: "30", width: "1" });
    expect(activity.data.save.ability).toEqual(["dex"]);
    expect(activity.data.damage.onSave).toBe("half");
    expect(activity.data.damage.parts[0].custom.formula).toBe("2@scale.arcane-archer.arcane-shot.die");
  });

  it("Enfeebling Shot rolls two Arcane Shot Dice and subtracts one from the target's damage", () => {
    const enricher = makeEnricherData(EnfeeblingShot, { name: "Enfeebling Shot", actions: null, isAction: true });
    const activity = enricher.activity as any;
    expect(activity.data.damage.parts[0].custom.formula).toBe("2@scale.arcane-archer.arcane-shot.die");
  });
});

describe("Monk spell progression", () => {
  it("is a third caster so Warrior of the Mystic Arts gets the Eldritch Knight slot table", () => {
    expect(SPELL.progression.find((p) => p.name === "Monk")?.value).toBe("third");
  });
});
