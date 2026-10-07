/**
 * Behavioural pins for user-reported fixes to the Hunt Domain, Oath of Revelry and three spells.
 * The audit harness runs module-free, so the AC5e change strings (and Aura of Fraternity's
 * ac5eOnly aura) never reach its worksheets; they are pinned verbatim here.
 */
import MarkPrey from "../../../src/parser/enrichers/class/cleric/MarkPrey";
import PackHunter from "../../../src/parser/enrichers/class/cleric/PackHunter";
import AuraOfFraternity from "../../../src/parser/enrichers/class/paladin/AuraOfFraternity";
import ResilientFriendship from "../../../src/parser/enrichers/spell/ResilientFriendship";
import TruthsBlade from "../../../src/parser/enrichers/spell/TruthsBlade";
import ConjureMinorElementals from "../../../src/parser/enrichers/spell/ConjureMinorElementals";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

const MARK_PREY_SCALE = "@scale.hunt.mark-prey-damage";

function build(Enricher: TEnricher, options: Record<string, any> = {}): any {
  return makeEnricherData(Enricher, { actions: null, ...options });
}

describe("Hunt Domain", () => {
  it("Mark Prey rolls the scale and grants it to the marker's weapon hits through AC5e", () => {
    const enricher = build(MarkPrey, { name: "Mark Prey" });
    const [extra] = enricher.additionalActivities;
    expect(extra.build.damageParts[0].custom).toMatchObject({ enabled: true, formula: MARK_PREY_SCALE });
    const [hint] = enricher.effects;
    expect(hint).toMatchObject({ name: "Marked as Prey", activityMatch: "Mark Prey" });
    expect(hint.ac5eChanges.map((c: any) => [c.key, c.value])).toEqual([
      [
        "flags.automated-conditions-5e.grants.damage.bonus",
        `bonus=${MARK_PREY_SCALE}; effectOriginTokenId === tokenId && (actionType.mwak || actionType.rwak)`,
      ],
    ]);
  });

  it("Pack Hunter has Kill on the scale and a Retreat reaction, both spending a use", () => {
    const enricher = build(PackHunter, { name: "Pack Hunter" });
    expect(enricher.activity).toMatchObject({ name: "Kill", activationType: "reaction" });
    expect(enricher.activity.data.damage.parts[0].custom).toMatchObject({ enabled: true, formula: MARK_PREY_SCALE });
    const [retreat] = enricher.additionalActivities;
    expect(retreat.init).toMatchObject({ name: "Retreat", type: "utility" });
    expect(retreat.overrides).toMatchObject({ activationType: "reaction", addItemConsume: true, data: { range: { value: 60 } } });
  });
});

describe("Aura of Fraternity", () => {
  it("adds 1d4 to melee weapon damage for the paladin and allies in the Aura of Protection", () => {
    const [hint] = build(AuraOfFraternity, { name: "Aura of Fraternity" }).effects;
    expect(hint).toMatchObject({ ac5eOnly: true, options: { transfer: true } });
    expect(hint.ac5eChanges.map((c: any) => [c.key, c.value])).toEqual([
      [
        "flags.automated-conditions-5e.aura.damage.bonus",
        "bonus=1d4; radius=(auraActor.classes.paladin.levels < 18 ? 10 : 30); allies; singleAura; includeSelf; actionType.mwak && !auraActor.statuses.incapacitated",
      ],
    ]);
  });
});

describe("Spells", () => {
  it("Resilient Friendship gives a one-use Advantage from the Help activity only", () => {
    const [hint] = build(ResilientFriendship, { name: "Resilient Friendship" }).effects;
    expect(hint).toMatchObject({ name: "Resilient Friendship: Help", activityTypesMatch: ["utility"], options: { expiry: "sourceStart" } });
    expect(hint.ac5eChanges[0]).toMatchObject({ key: "flags.automated-conditions-5e.d20.advantage", value: "once" });
  });

  it("Truth's Blade saves without damage and rolls the lie damage separately", () => {
    const enricher = build(TruthsBlade, { name: "Truth's Blade" });
    expect(enricher.type).toBe("save");
    expect(enricher.activity).toMatchObject({ name: "Cast", removeDamageParts: true });
    const [lie] = enricher.additionalActivities;
    expect(lie.init).toMatchObject({ name: "Lie Damage", type: "damage" });
    expect(lie.build).toMatchObject({ allowCritical: false, noSpellslot: true });
    expect(lie.build.damageParts[0]).toMatchObject({ number: 4, denomination: 8, types: ["psychic"], scaling: { mode: "whole", number: 1 } });
    expect(enricher.effects[0]).toMatchObject({ name: "Truth's Blade", activityMatch: "Cast", options: { durationSeconds: 600 } });
  });

  it("2024 Conjure Minor Elementals adds the upcast elemental dice to the caster's hits in the emanation", () => {
    const [hint] = build(ConjureMinorElementals, { name: "Conjure Minor Elementals", is2014: false }).effects;
    expect(hint.ac5eChanges.map((c: any) => [c.key, c.value])).toEqual([
      [
        "flags.automated-conditions-5e.damage.bonus",
        "bonus=(spellLevel - 2)d8[acid, cold, fire, lightning]; hasAttack && checkDistance(tokenId, opponentId) <= 15",
      ],
    ]);
  });
});
