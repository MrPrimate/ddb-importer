/**
 * Behavioural pins for a batch of user-reported enricher fixes. The ruleset splits (Bardic
 * Inspiration's duration, 2024 Deft Explorer) and the AC5e change strings are invisible or
 * fixture-dependent in the audit worksheets, and Potent Dragonmark builds its casts from the
 * character's Dragonmark feat, which no audit capture carries alongside it.
 */
import WarriorOfTheGods from "../../../src/parser/enrichers/class/barbarian/WarriorOfTheGods";
import BardicInspiration from "../../../src/parser/enrichers/class/bard/BardicInspiration";
import DeftExplorer from "../../../src/parser/enrichers/class/ranger/DeftExplorer";
import FavoredEnemy from "../../../src/parser/enrichers/class/ranger/FavoredEnemy";
import SupernaturalDefense from "../../../src/parser/enrichers/class/ranger/SupernaturalDefense";
import AuraOfVitality from "../../../src/parser/enrichers/spell/AuraOfVitality";
import ProtectionFromEvilAndGood from "../../../src/parser/enrichers/spell/ProtectionFromEvilAndGood";
import SilveryBarbs from "../../../src/parser/enrichers/spell/SilveryBarbs";
import CreepingTouch from "../../../src/parser/enrichers/spell/CreepingTouch";
import BattleFamiliar from "../../../src/parser/enrichers/spell/BattleFamiliar";
import PotentDragonmark from "../../../src/parser/enrichers/feat/PotentDragonmark";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

function build(Enricher: TEnricher, options: Record<string, any> = {}): any {
  return makeEnricherData(Enricher, { actions: null, ...options });
}

describe("Warrior of the Gods", () => {
  it("replaces the item uses target so the expended dice scale by amount", () => {
    const activity = build(WarriorOfTheGods, { name: "Warrior of the Gods" }).activity;
    expect(activity).toMatchObject({ addItemConsume: true, addScalingMode: "amount", itemConsumeValue: "1" });
  });
});

describe("Bardic Inspiration", () => {
  it.each([
    [true, { value: "10", units: "minute" }, 600],
    [false, { value: "1", units: "hour" }, 3600],
  ])("is2014 %s lasts %o", (is2014, duration, seconds) => {
    const enricher = build(BardicInspiration, { name: "Bardic Inspiration", is2014 });
    expect(enricher.activity.data.duration).toEqual(duration);
    expect(enricher.effects[0].options.durationSeconds).toBe(seconds);
  });
});

describe("Deft Explorer", () => {
  it("keeps Tasha's Roving and Tireless on the 2014 feature", () => {
    const enricher = build(DeftExplorer, { name: "Deft Explorer", is2014: true });
    expect(enricher.type).toBe("heal");
    expect(enricher.activity.name).toBe("Tireless");
    expect(enricher.effects.map((e: any) => e.name)).toEqual(["Roving"]);
  });

  it("adds nothing to the 2024 feature, which has separate Roving and Tireless features", () => {
    const enricher = build(DeftExplorer, { name: "Deft Explorer", is2014: false });
    expect(enricher.type).toBe("none");
    expect(enricher.activity).toEqual({});
    expect(enricher.effects).toEqual([]);
  });
});

describe("Favored Enemy", () => {
  it("shows the free Hunter's Mark cast in the spellbook", () => {
    const [cast] = build(FavoredEnemy, { name: "Favored Enemy" }).additionalActivities;
    expect(cast.overrides.data.spell.spellbook).toBe(true);
  });
});

describe("Aura of Vitality", () => {
  it.each([
    [true, "bonus", "While the aura lasts, one creature inside it"],
    [false, "special", "Start of each of your turns while the aura persists, one creature inside it"],
  ])("is2014 %s heals with a %s activation", (is2014, type, condition) => {
    const [heal] = build(AuraOfVitality, { name: "Aura of Vitality", is2014 }).additionalActivities;
    expect(heal.build.activationOverride).toMatchObject({ type, condition });
  });
});

describe("AC5e changes", () => {
  it("Supernatural Defense opts in a 1d6 to saves and grapple escape checks", () => {
    const [hint] = build(SupernaturalDefense, { name: "Supernatural Defense" }).effects;
    expect(hint).toMatchObject({ ac5eOnly: true, options: { transfer: true } });
    expect(hint.ac5eChanges.map((c: any) => [c.key, c.value])).toEqual([
      ["flags.automated-conditions-5e.save.bonus", "bonus=1d6; optin; optinId=supernatural-defense-0; description=From target of Slayer's Prey"],
      ["flags.automated-conditions-5e.check.bonus", "bonus=1d6; optin; optinId=supernatural-defense-1; description=To escape the grapple of your Slayer's Prey target; skill.acr || skill.ath"],
    ]);
  });

  it("Protection from Evil and Good gives the six creature types Disadvantage for 10 minutes", () => {
    const [hint] = build(ProtectionFromEvilAndGood, { name: "Protection from Evil and Good" }).effects;
    expect(hint.options.durationSeconds).toBe(600);
    expect(hint.ac5eOnly).toBeUndefined();
    expect(hint.ac5eChanges).toHaveLength(1);
    expect(hint.ac5eChanges[0]).toMatchObject({
      key: "flags.automated-conditions-5e.grants.attack.disadvantage",
      value: ["aberration", "celestial", "elemental", "fey", "fiend", "undead"]
        .map((type) => `rollingActor.creatureType.includes('${type}')`)
        .join(" || "),
    });
  });

  it("Silvery Barbs grants a one-use Advantage from its own activity", () => {
    const enricher = build(SilveryBarbs, { name: "Silvery Barbs" });
    const [ally] = enricher.additionalActivities;
    expect(ally.init.name).toBe("Ally Advantage");
    expect(ally.build).toMatchObject({ noSpellslot: true, activationOverride: { type: "special" } });
    const [hint] = enricher.effects;
    expect(hint).toMatchObject({ name: "Silvery Barbs: Advantage", activityMatch: "Ally Advantage" });
    expect(hint.ac5eChanges[0]).toMatchObject({ key: "flags.automated-conditions-5e.d20.advantage", value: "once" });
  });
});

describe("Creeping Touch", () => {
  it.each([
    [true, "CreepingHand2014"],
    [false, "CreepingHand2024"],
  ])("summons the ruleset's Creeping Hand actor (is2014 %s)", (is2014, key) => {
    const activity = build(CreepingTouch, { name: "Creeping Touch", is2014 }).activity;
    expect(activity.profileKeys).toEqual([{ count: "1", name: key }]);
  });
});

describe("Battle Familiar", () => {
  it("copies the stored stat blocks from the summon onto the empower transform", async () => {
    const data = {
      system: {
        activities: {
          summon: { type: "summon", profiles: [
            { _id: "b", name: "Battle Familiar (Brute)", uuid: "Compendium.x.Actor.brute" },
            { _id: "c", name: "Battle Familiar (Flyer)", uuid: null },
          ] },
          [BattleFamiliar.TRANSFORM_ID]: { type: "transform", profiles: [] },
        },
      },
    };
    const enricher = build(BattleFamiliar, { name: "Battle Familiar", data });
    const [transform] = enricher.additionalActivities;
    expect(enricher.additionalActivities).toHaveLength(1);
    expect(transform.init).toMatchObject({ id: BattleFamiliar.TRANSFORM_ID, name: "Empower Familiar" });
    // the cast spends the slot, which is how the rider effect learns the spell level
    expect(transform.build.noSpellslot).toBeUndefined();
    expect(transform.overrides.data.flags.ddbimporter.castLevelRider).toBe("Battle Familiar: Spell Level");
    expect(transform.overrides.data.settings).toMatchObject({
      keep: ["bio", "type", "hp"],
      tempFormula: "@source.attributes.hp.max + 5 * max(0, @flags.ddbimporter.battleFamiliarLevel - 2)",
      minimumAC: "@source.attributes.ac.value + @flags.ddbimporter.battleFamiliarLevel",
    });

    await enricher.cleanup();
    const profiles = enricher.data.system.activities[BattleFamiliar.TRANSFORM_ID].profiles;
    expect(profiles).toHaveLength(1);
    expect(profiles[0]).toMatchObject({ name: "Battle Familiar (Brute)", uuid: "Compendium.x.Actor.brute", types: [] });
  });

  it("explains the transform and the cast-time target in the description", () => {
    const suffix = build(BattleFamiliar, { name: "Battle Familiar" }).override.descriptionSuffix;
    expect(suffix).toContain("Implementation Details");
    expect(suffix).toContain("Target your familiar when you cast Empower Familiar");
  });

  it("keeps the cast-level rider effect unlinked for the enhancer to apply", () => {
    const [hint] = build(BattleFamiliar, { name: "Battle Familiar" }).effects;
    expect(hint).toMatchObject({ name: "Battle Familiar: Spell Level", originReplacement: true, options: { durationSeconds: 3600 } });
    expect(hint.activityMatch).toBeUndefined();
    expect(hint.data.flags.ddbimporter.noeffect).toBe(true);
    expect(hint.changes[0]).toMatchObject({ key: "flags.ddbimporter.battleFamiliarLevel", value: "@item.level" });
    expect(hint.changes[1]).toMatchObject({ key: "damage", type: "dnd5e.bonus", value: "@item.level" });
    expect(JSON.parse(hint.changes[1].conditions)).toEqual({ k: "item.identifier", o: "exact", v: "rend" });
  });
});

describe("Potent Dragonmark", () => {
  const markTable = `<p><strong>Spells of the Mark.</strong> Added to your list.</p>
<table><tbody>
<tr>
<td>1</td>
<td>Identify, Tenser’s Floating Disk</td>
</tr>
<tr>
<td>3</td>
<td>Elemental Weapon</td>
</tr>
<tr>
<td>5</td>
<td>Creation</td>
</tr>
</tbody></table>`;

  function character(level: number) {
    return {
      classes: [{ level, definition: { name: "Druid" } }],
      feats: [
        { definition: { id: 1, name: "Potent Dragonmark" } },
        { definition: { id: 2, name: "Mark of Making", description: markTable } },
      ],
      spells: {
        feat: [
          { componentId: 2, definition: { name: "Mending", level: 0 } },
          { componentId: 2, definition: { name: "Magic Weapon", level: 2 } },
          { componentId: 2, definition: { name: "Magic Weapon", level: 2 } },
          { componentId: 9, definition: { name: "Polymorph", level: 4 } },
        ],
      },
    };
  }

  it("casts the mark's leveled spells at half the character level, up to the slot level", () => {
    const enricher = build(PotentDragonmark, { name: "Potent Dragonmark", actions: {}, character: character(5) });
    expect(enricher.slotLevel).toBe(3);
    const casts = enricher.additionalActivities;
    expect(casts.map((c: any) => c.overrides.addSpellUuid)).toEqual([
      "Identify", "Tenser's Floating Disk", "Magic Weapon", "Elemental Weapon",
    ]);
    expect(casts.every((c: any) => c.overrides.data.spell.level === 3 && c.overrides.addItemConsume)).toBe(true);
    expect(enricher.override.uses).toMatchObject({ max: "1", recovery: [{ period: "sr" }] });
  });

  it("caps the slot at 5th level", () => {
    const enricher = build(PotentDragonmark, { name: "Potent Dragonmark", actions: {}, character: character(20) });
    expect(enricher.slotLevel).toBe(5);
    expect(enricher.additionalActivities.map((c: any) => c.overrides.addSpellUuid)).toContain("Creation");
  });

  it("adds no casts without a Dragonmark feat", () => {
    const enricher = build(PotentDragonmark, {
      name: "Potent Dragonmark",
      actions: {},
      character: { ...character(8), feats: [{ definition: { id: 1, name: "Potent Dragonmark" } }] },
    });
    expect(enricher.additionalActivities).toEqual([]);
  });
});
