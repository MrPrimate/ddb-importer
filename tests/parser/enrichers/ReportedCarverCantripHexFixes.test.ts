/**
 * Behavioural pins for user-reported fixes to the Carver Guild's Close Quarters and the Gray Gaze,
 * Gust Barrier, Mind Sliver and Hex spells. The audit harness runs module-free, so the AC5e
 * change strings and ac5eOnly effects never reach its worksheets; they are pinned here.
 */
import CloseQuarters from "../../../src/parser/enrichers/class/monster-hunter/CloseQuarters";
import GrayGaze from "../../../src/parser/enrichers/spell/GrayGaze";
import GustBarrier from "../../../src/parser/enrichers/spell/GustBarrier";
import MindSliver from "../../../src/parser/enrichers/spell/MindSliver";
import Hex from "../../../src/parser/enrichers/spell/Hex";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

const CLOSE_QUARTERS_SCALE = "@scale.carver-guild.close-quarters-damage";

function build(Enricher: TEnricher, options: Record<string, any> = {}): any {
  return makeEnricherData(Enricher, { actions: null, ...options });
}

function ac5e(hint: any): string[][] {
  return hint.ac5eChanges.map((c: any) => [c.key, c.value]);
}

describe("Close Quarters", () => {
  it("rolls the subclass scale, applies disadvantage from its own activity and offers the damage through AC5e", () => {
    const enricher = build(CloseQuarters, { name: "Close Quarters" });
    expect(enricher.activity.data.damage.parts[0].custom).toMatchObject({ enabled: true, formula: CLOSE_QUARTERS_SCALE });
    const [apply] = enricher.additionalActivities;
    expect(apply.init).toMatchObject({ name: "Apply Disadvantage", type: "utility" });

    const [disadvantage, automation] = enricher.effects;
    expect(disadvantage).toMatchObject({ name: "Close Quarters Disadvantage", activityMatch: "Apply Disadvantage", options: { expiry: "sourceStart" } });
    expect(ac5e(disadvantage)).toEqual([["flags.automated-conditions-5e.attack.disadvantage", "once"]]);
    expect(automation).toMatchObject({ name: "Close Quarters (Automation)", ac5eOnly: true, options: { transfer: true } });
    expect(ac5e(automation)).toEqual([
      [
        "flags.automated-conditions-5e.damage.bonus",
        `bonus=${CLOSE_QUARTERS_SCALE}; oncePerRound; optin; name=Close Quarters; description=Uses Reaction; actionType.mwak`,
      ],
    ]);
  });
});

describe("Cantrips", () => {
  it("Gray Gaze deals proficiency necrotic damage and Stiffens the next Dex save once", () => {
    const enricher = build(GrayGaze, { name: "Gray Gaze" });
    expect(enricher.activity.data.damage).toMatchObject({ onSave: "none" });
    expect(enricher.activity.data.damage.parts[0].custom).toMatchObject({ enabled: true, formula: "@prof" });
    const [withAc5e, withoutAc5e] = enricher.effects;
    expect(withAc5e).toMatchObject({ name: "Stiffened", ac5eOnly: true, options: { expiry: "targetEnd" } });
    expect(ac5e(withAc5e)).toEqual([["flags.automated-conditions-5e.save.disadvantage", "once; ability.dex"]]);
    expect(withoutAc5e).toMatchObject({ name: "Stiffened", ac5eNever: true });
  });

  it("Gust Barrier wards against ranged attacks from a Cast activity and keeps Prone on the attacker's save", () => {
    const enricher = build(GustBarrier, { name: "Gust Barrier" });
    expect(enricher.activity).toMatchObject({
      name: "Melee Attacker Save", activationType: "special", overrideActivation: true, overrideTarget: true,
    });
    expect(enricher.additionalActivities[0].init).toMatchObject({ name: "Cast", type: "utility" });
    const [prone, ward] = enricher.effects;
    expect(prone).toMatchObject({ activityMatch: "Melee Attacker Save", statuses: ["Prone"] });
    expect(ward).toMatchObject({ name: "Gust Barrier", activityMatch: "Cast", options: { expiry: "sourceEnd" } });
    expect(ac5e(ward)).toEqual([
      ["flags.automated-conditions-5e.grants.attack.disadvantage", "actionType.rwak || actionType.rsak"],
    ]);
  });

  it("Mind Sliver subtracts 1d4 from one save with AC5e and falls back to the core bonus without it", () => {
    const [withAc5e, withoutAc5e] = build(MindSliver, { name: "Mind Sliver" }).effects;
    expect(withAc5e).toMatchObject({ ac5eOnly: true, options: { expiry: "sourceEnd" } });
    expect(ac5e(withAc5e)).toEqual([["flags.automated-conditions-5e.save.bonus", "bonus=-1d4; once"]]);
    expect(withoutAc5e).toMatchObject({ ac5eNever: true, daeSpecialDurations: ["isSave"] });
  });
});

describe("Hex", () => {
  it("each Hexed effect grants the caster 1d6 necrotic on attack hits through AC5e", () => {
    const effects = build(Hex, { name: "Hex" }).effects;
    expect(effects).toHaveLength(6);
    for (const hint of effects) {
      expect(ac5e(hint)).toEqual([
        ["flags.automated-conditions-5e.grants.damage.bonus", "bonus=1d6[necrotic]; effectOriginTokenId === tokenId && hasAttack"],
      ]);
    }
  });
});
