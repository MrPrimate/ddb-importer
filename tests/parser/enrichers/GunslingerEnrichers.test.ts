/**
 * Behavioural tests for the Gunslinger (The Griffon's Saddlebag) enrichers.
 *
 * These do not duplicate the audit harness: every audit suite is wrapped in
 * `describe.skipIf(suites.length === 0)` and its fixtures live in a private
 * submodule, so the whole audit is skipped in CI. More specifically, the audit
 * cannot see some of this even when it does run:
 *   - roll formulas were invisible to the worksheet until summariseActivity
 *     learned to record them, and a wrong die still only shows as a changed
 *     string in a human-read artifact;
 *   - the "Maneuver: X" actions are folded into their parent feature rather
 *     than built as their own document, so they never get an enricher column
 *     the decisions manifest can pin;
 *   - every capture has all six maneuvers and both Risk Taker actions present,
 *     so the absent-action branches below are dead to the fixtures entirely.
 *
 * The vi.mock preamble is required and is copied from DDBEnricherData.uses.test.ts:
 * loading the real lib barrel while DDBEnricherData is still mid-evaluation pulls
 * the apps/muncher tree and crashes SpellListExtractorMixin's `extends
 * DDBEnricherData`. vi.mock is hoisted per file, so it cannot be shared from
 * tests/_fixtures. Everything these enrichers touch in lib is just `logger`.
 */
const loggerMock = vi.hoisted(() => ({
  warn: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  verbose: vi.fn(),
}));

vi.mock("../../../src/lib/_module", () => ({ logger: loggerMock }));
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
vi.mock("../../../src/parser/enrichers/effects/_module", () => ({
  AutoEffects: {},
  EnchantmentEffects: {},
  ChangeHelper: {},
  EffectGenerator: {},
}));

import * as Gunslinger from "../../../src/parser/enrichers/class/gunslinger/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";

type TEnricher = new (options: any) => any;

/** The six maneuver actions Risk pays for, as DDB names them under actions.class. */
const MANEUVER_ACTIONS = [
  "Maneuver: Bite the Bullet",
  "Maneuver: Blindfire",
  "Maneuver: Dodge Roll",
  "Maneuver: Grazing Shot",
  "Maneuver: Maverick Spirit",
  "Maneuver: Skin of Your Teeth",
];

const RISK_TAKER_ACTIONS = [
  { name: "Maneuver: Maverick Spirit (Risk Taker)", description: "<p>Add a d6 to the failed check.</p>" },
  { name: "Maneuver: Skin of Your Teeth (Risk Taker)", description: "<p>Roll a d6 and add it to your AC.</p>" },
];

function build(Enricher: TEnricher, { name = "Test", actions = [] as any[] } = {}): any {
  return makeEnricherData(Enricher, { name, actions: { class: actions } });
}

describe("Gunslinger roll formulas", () => {
  // A Risk Die spender that hardcodes a die, or a free d6 variant that copy-pastes
  // the scale formula, is wrong in a way nothing else in the suite would catch.
  const ROLLS: [string, TEnricher, string, string, string][] = [
    ["CounterMageInuredToMagic", Gunslinger.CounterMageInuredToMagic, "reaction", "1d6", "Saving Throw Bonus"],
    ["DeftDeflection", Gunslinger.DeftDeflection, "reaction", "1@scale.gunslinger.risk.die", "Risk Die (add to ally AC vs attack)"],
    ["EagleEye", Gunslinger.EagleEye, "special", "1@scale.gunslinger.risk.die", "Risk Die (add to attack roll)"],
    ["MagicBullet", Gunslinger.MagicBullet, "bonus", "1@scale.gunslinger.risk.die", "Risk Die (add to attack roll)"],
    ["PartingShot", Gunslinger.PartingShot, "bonus", "@scale.secret-agent.parting-shot", "Risk Die (add to damage roll)"],
    ["Ricochet", Gunslinger.Ricochet, "bonus", "1@scale.gunslinger.risk.die", "Risk Die (add to rerolled attack)"],
    ["ManeuverMaverickSpirit", Gunslinger.ManeuverMaverickSpirit, "special", "1@scale.gunslinger.risk.die", "Risk Die"],
    ["ManeuverSkinOfYourTeeth", Gunslinger.ManeuverSkinOfYourTeeth, "reaction", "1@scale.gunslinger.risk.die", "Risk Die"],
    ["ManeuverMaverickSpiritRiskTaker", Gunslinger.ManeuverMaverickSpiritRiskTaker, "special", "1d6", "Risk Taker Die"],
    ["ManeuverSkinOfYourTeethRiskTaker", Gunslinger.ManeuverSkinOfYourTeethRiskTaker, "reaction", "1d6", "Risk Taker Die (add to AC vs attack)"],
  ];

  it.each(ROLLS)("%s rolls %s %s %s", (_label, Enricher, activation, formula, rollName) => {
    const enricher = build(Enricher);
    expect(enricher.type).toBe("utility");
    expect(enricher.activity.activationType).toBe(activation);
    expect(enricher.activity.data.roll).toMatchObject({ formula, name: rollName });
  });

  it("gives the Risk Taker variants a free d6, not the Risk Die scale", () => {
    // the whole point of Risk Taker: same maneuvers, no die expended
    for (const Enricher of [Gunslinger.ManeuverMaverickSpiritRiskTaker, Gunslinger.ManeuverSkinOfYourTeethRiskTaker]) {
      const enricher = build(Enricher);
      expect(enricher.activity.data.roll.formula).toBe("1d6");
      expect(enricher.activity).not.toHaveProperty("addItemConsume");
      expect(enricher.activity).not.toHaveProperty("itemConsumeTargetName");
    }
  });
});

describe("Gunslinger Risk consumption", () => {
  // Spenders that live on a document other than the pool must name the pool, or
  // they silently consume their own (non-existent) uses instead.
  const SPENDERS: [string, TEnricher][] = [
    ["DeftDeflection", Gunslinger.DeftDeflection],
    ["EagleEye", Gunslinger.EagleEye],
    ["LayDownTheLaw", Gunslinger.LayDownTheLaw],
    ["LicenseToKill", Gunslinger.LicenseToKill],
    ["MagicBullet", Gunslinger.MagicBullet],
    ["PartingShot", Gunslinger.PartingShot],
    ["Ricochet", Gunslinger.Ricochet],
  ];

  it.each(SPENDERS)("%s consumes a Risk Die from the Risk item", (_label, Enricher) => {
    const enricher = build(Enricher);
    expect(enricher.activity.addItemConsume).toBe(true);
    expect(enricher.activity.itemConsumeTargetName).toBe("Risk");
  });

  it.each([
    ["FanTheHammer", Gunslinger.FanTheHammer],
    ["LiarsDice", Gunslinger.LiarsDice],
  ] as [string, TEnricher][])("%s leaves Risk Die consumption to the description parse", (_label, Enricher) => {
    // DDBFeatureActivity generates the itemUses:risk target from the
    // "expend one Risk Die" text, so the enricher must not add its own
    const enricher = build(Enricher);
    expect(enricher.activity).not.toHaveProperty("addItemConsume");
    expect(enricher.activity).not.toHaveProperty("itemConsumeTargetName");
  });

  it.each([
    ["CheatDeath", Gunslinger.CheatDeath],
    ["Headshot", Gunslinger.Headshot],
  ] as [string, TEnricher][])("%s consumes its own uses, not the Risk pool", (_label, Enricher) => {
    const enricher = build(Enricher);
    expect(enricher.activity.addItemConsume).toBe(true);
    // an empty consume target means "this item"; naming Risk here would drain the pool
    expect(enricher.activity.itemConsumeTargetName).toBeUndefined();
  });

  it.each([
    ["DireGambit", Gunslinger.DireGambit],
    ["RiskyBusiness", Gunslinger.RiskyBusiness],
  ] as [string, TEnricher][])("%s regains a Risk Die with a negative consume value", (_label, Enricher) => {
    const enricher = build(Enricher);
    expect(enricher.activity.itemConsumeTargetName).toBe("Risk");
    expect(enricher.activity.itemConsumeValue).toBe("-1");
  });

  it("spends 3 Risk Dice to regain a Headshot use", () => {
    const [regain] = build(Gunslinger.Headshot).additionalActivities;
    expect(regain.init.name).toBe("Regain Use (3 Risk Dice)");
    expect(regain.overrides).toMatchObject({
      addItemConsume: true,
      itemConsumeTargetName: "Risk",
      itemConsumeValue: "3",
    });
    // and hands a use back to Headshot itself
    expect(regain.overrides.additionalConsumptionTargets).toEqual([
      expect.objectContaining({ type: "itemUses", target: "", value: "-1" }),
    ]);
  });

  it("keeps the Risk pool itself free of maneuver activities", () => {
    // the pool carries uses only; the spenders live on Maneuvers
    const risk = build(Gunslinger.Risk);
    expect(risk.additionalActivities).toBeNull();
    expect(risk.override.data.system.uses).toMatchObject({
      max: "@scale.gunslinger.risk.number",
      recovery: [{ period: "sr", type: "recoverAll" }],
    });
  });
});

describe("Gunslinger document renames", () => {
  // DDB decorates several names with a "[Maneuver]"/"[Manuever]" suffix or a
  // parent prefix; these renames are the decisions recorded in the manifest.
  it.each([
    ["DeftDeflection", Gunslinger.DeftDeflection, "Deft Deflection"],
    ["EagleEye", Gunslinger.EagleEye, "Eagle Eye"],
    ["CounterMageInuredToMagic", Gunslinger.CounterMageInuredToMagic, "Inured to Magic"],
    ["FanTheHammer", Gunslinger.FanTheHammer, "Fan the Hammer"],
    ["FancyGunplayGunSpinning", Gunslinger.FancyGunplayGunSpinning, "Gun Spinning"],
    ["LayDownTheLaw", Gunslinger.LayDownTheLaw, "Lay Down the Law"],
    ["LiarsDice", Gunslinger.LiarsDice, "Liar's Dice"],
    ["MagicBullet", Gunslinger.MagicBullet, "Magic Bullet"],
    ["PartingShot", Gunslinger.PartingShot, "Parting Shot"],
    ["Ricochet", Gunslinger.Ricochet, "Ricochet"],
  ] as [string, TEnricher, string][])("%s renames the document to %s", (_label, Enricher, expected) => {
    expect(build(Enricher).override.data.name).toBe(expected);
  });
});

describe("FancyGunplayGunSpinning", () => {
  it("builds two complete skill rolls without consuming Risk", () => {
    // Gun Spinning is free; a check activity cannot carry the Risk Die bonus, so
    // the enricher supplies whole 1d20 formulas as utility rolls instead
    const enricher = build(Gunslinger.FancyGunplayGunSpinning, { name: "Fancy Gunplay: Gun Spinning" });

    expect(enricher.activity).toMatchObject({
      name: "Performance",
      targetType: "self",
      activationType: "special",
      data: { roll: { formula: "1d20 + @skills.prf.total + 1@scale.gunslinger.risk.die" } },
    });
    expect(enricher.activity).not.toHaveProperty("addItemConsume");

    expect(enricher.additionalActivities).toEqual([
      expect.objectContaining({
        init: { name: "Sleight of Hand", type: "utility" },
        build: expect.objectContaining({
          generateConsumption: false,
          generateRoll: true,
          rollOverride: expect.objectContaining({
            formula: "1d20 + @skills.slt.total + 1@scale.gunslinger.risk.die",
            name: "Sleight of Hand Check + Risk Die",
          }),
        }),
      }),
    ]);
    expect(enricher.effects).toEqual([]);
  });
});

describe("CounterMageInuredToMagic", () => {
  it("is a resource-free 1d6 reaction roll", () => {
    const enricher = build(Gunslinger.CounterMageInuredToMagic, { name: "Counter-Mage: Inured to Magic" });

    expect(enricher.activity).toMatchObject({
      targetType: "self",
      activationType: "reaction",
      activationCondition: "You fail a saving throw against a spell or magical effect",
      data: { roll: { formula: "1d6", name: "Saving Throw Bonus" } },
    });
    expect(enricher.activity).not.toHaveProperty("addItemConsume");
    expect(enricher.activity).not.toHaveProperty("itemConsumeTargetName");
    expect(enricher.additionalActivities).toBeNull();
    expect(enricher.effects).toEqual([]);
  });
});

describe("Maneuvers", () => {
  const actions = (names: string[]): any[] => names.map((name) => ({ name }));

  it("pulls every known maneuver action as an activity", () => {
    const activities = build(Gunslinger.Maneuvers, { actions: actions(MANEUVER_ACTIONS) }).additionalActivities;

    expect(activities).toHaveLength(6);
    expect(activities.map((a: any) => a.action.name)).toEqual(MANEUVER_ACTIONS);
    for (const activity of activities) {
      expect(activity.action.type).toBe("class");
      // the Risk Die consumption comes from the "expend one Risk Die"
      // description parse in DDBFeatureActivity, not an enricher override
      expect(activity.overrides).toBeUndefined();
    }
  });

  it("renames each pulled activity to the bare maneuver name", () => {
    const activities = build(Gunslinger.Maneuvers, { actions: actions(MANEUVER_ACTIONS) }).additionalActivities;
    expect(activities.map((a: any) => a.action.rename)).toEqual([
      ["Bite the Bullet"], ["Blindfire"], ["Dodge Roll"],
      ["Grazing Shot"], ["Maverick Spirit"], ["Skin of Your Teeth"],
    ]);
  });

  it("pulls only the maneuvers the character actually knows", () => {
    // every fixture capture has all six, so this branch is invisible to the audit
    const known = ["Maneuver: Blindfire", "Maneuver: Grazing Shot"];
    const activities = build(Gunslinger.Maneuvers, { actions: actions(known) }).additionalActivities;
    expect(activities.map((a: any) => a.action.name)).toEqual(known);
  });

  it("pulls nothing when no maneuver actions are present", () => {
    expect(build(Gunslinger.Maneuvers, { actions: [] }).additionalActivities).toEqual([]);
  });

  it("keeps the chosen maneuvers as description text rather than child features", () => {
    // Fighter's "Maneuvers" wants children, so this cannot live in the flat
    // NO_CHOICE_BUILD list — it has to be the class-scoped enricher getter
    expect(build(Gunslinger.Maneuvers).noChoiceBuild).toBe(true);
  });

  it("supplies no activity of its own", () => {
    expect(build(Gunslinger.Maneuvers).type).toBe("none");
  });
});

describe("RiskTaker", () => {
  it("folds both d6 variant descriptions in under short headings", () => {
    const enricher = build(Gunslinger.RiskTaker, { actions: RISK_TAKER_ACTIONS });
    expect(enricher.override.descriptionSuffix).toBe(
      "<hr><p><strong>Maverick Spirit</strong></p><p>Add a d6 to the failed check.</p>"
      + "<p><strong>Skin of Your Teeth</strong></p><p>Roll a d6 and add it to your AC.</p>",
    );
  });

  it("emits only the blocks whose actions are present", () => {
    const enricher = build(Gunslinger.RiskTaker, { actions: [RISK_TAKER_ACTIONS[1]] });
    expect(enricher.override.descriptionSuffix).toBe(
      "<hr><p><strong>Skin of Your Teeth</strong></p><p>Roll a d6 and add it to your AC.</p>",
    );
  });

  it("adds no suffix at all when neither action is present", () => {
    // an <hr> with nothing after it would be worse than leaving the text alone
    expect(build(Gunslinger.RiskTaker, { actions: [] }).override).not.toHaveProperty("descriptionSuffix");
  });

  it("keeps the default action match so the two activities survive", () => {
    // DDBEnricherData defaults this to false while the Generic fallback it replaced
    // returns true; without the override both activities vanish from the feature
    expect(build(Gunslinger.RiskTaker, { actions: RISK_TAKER_ACTIONS }).useDefaultAdditionalActivities).toBe(true);
  });
});
