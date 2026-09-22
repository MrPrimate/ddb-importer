/**
 * Pins for a monster that summons other monsters. The called creatures are ordinary stat blocks
 * in the monster compendium, so the activity is written with named, actor-less profiles and the
 * actors are filled in afterwards by name. The monsters audit has no compendium, so it can show
 * the activity but never the link; the link is pinned here against a stand-in pack index.
 *
 * No vi.mock preamble, for the reasons given in ClassEnrichers.test.ts.
 */
import RottingRitual from "../../../src/parser/enrichers/monster/KeeperOfTheBlight/RottingRitual";
import ConvocationOfIron from "../../../src/parser/enrichers/monster/ForceOfIron/ConvocationOfIron";
import SummonCreatures from "../../../src/parser/enrichers/monster/Generic/SummonCreatures";
import LairActions from "../../../src/parser/enrichers/monster/Generic/LairActions";
import { linkMonsterSummons, monsterSummon } from "../../../src/parser/enrichers/monster/_MonsterSummons";
import CompendiumHelper from "../../../src/lib/CompendiumHelper";
import { setMonsterBatch } from "../../../src/parser/monster/batch";
import utils from "../../../src/lib/Utils";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

const realGetCompendiumType = CompendiumHelper.getCompendiumType;

afterEach(() => {
  CompendiumHelper.getCompendiumType = realGetCompendiumType;
  setMonsterBatch([]);
});

interface IIndexEntry {
  name: string;
  uuid: string;
  system: { source: { rules: string } };
  flags?: { ddbimporter: { id: number } };
}

/** Stands in for the configured monster compendium; null is "none configured". */
function useMonsterPack(entries: IIndexEntry[] | null): void {
  const pack = entries === null
    ? undefined
    : { getIndex: async () => entries, index: entries, metadata: { id: "world.monsters" } };
  CompendiumHelper.getCompendiumType = (() => pack) as unknown as typeof CompendiumHelper.getCompendiumType;
}

function entry(name: string, rules: string): IIndexEntry {
  return { name, uuid: `Compendium.world.monsters.Actor.${name.replace(/\s/g, "")}${rules}`, system: { source: { rules } } };
}

/** A built item holding the summon as the factory would leave it. */
function builtItem(summon: any): any {
  return {
    name: "Test Feature",
    system: {
      activities: {
        save1: { type: "save", name: "Something Else" },
        summon1: { type: "summon", name: summon.init.name, ...foundry.utils.deepClone(summon.overrides.data) },
      },
    },
  };
}

describe("monsterSummon writes a summon that does nothing until it is linked", () => {
  const summon = monsterSummon("Call Pets", {
    creatures: [{ name: "Test Hound", count: "1d4" }, { name: "Test Cat", label: "Test Cat (no collar)" }],
    range: "30",
    duration: { value: "1", units: "minute" },
  });

  it("is a summon activity with a range, a duration and no template", () => {
    expect(summon.init).toMatchObject({ name: "Call Pets", type: "summon" });
    expect(summon.build).toMatchObject({ generateSummon: true, generateRange: true, generateDuration: true });
    expect(summon.build?.rangeOverride).toMatchObject({ value: "30", units: "ft" });
    expect(summon.overrides?.noTemplate).toBe(true);
  });

  it("names each creature, carries its count and has no actor yet", () => {
    const profiles = (summon.overrides?.data as any).profiles;
    expect(profiles.map((p: any) => [p.name, p.count, p.uuid])).toEqual([
      ["Test Hound", "1d4", undefined],
      ["Test Cat (no collar)", "1", undefined],
    ]);
    expect(new Set(profiles.map((p: any) => p._id)).size).toBe(2);
    expect(profiles.every((p: any) => (/^[a-zA-Z0-9]{16}$/).test(p._id))).toBe(true);
  });

  it("takes the summoner's disposition and spends nothing unless told to", () => {
    expect((summon.overrides?.data as any).match.disposition).toBe(true);
    expect(summon.overrides?.noConsumeTargets).toBe(true);
    expect(monsterSummon("Call Pets", { creatures: [], consume: true }).overrides?.addItemConsume).toBe(true);
  });
});

describe("linkMonsterSummons fills in the actors by name", () => {
  const creatures = [{ name: "Test Hound" }, { name: "Test Cat", label: "Test Cat (no collar)" }];
  const summon = monsterSummon("Call Pets", { creatures });

  it("prefers the summoner's ruleset and matches on the creature name, not the label", async () => {
    useMonsterPack([entry("Test Hound", "2014"), entry("Test Hound", "2024"), entry("test cat", "2024")]);
    const item = builtItem(summon);
    await linkMonsterSummons(item, creatures, true);
    const [hound, cat] = item.system.activities.summon1.profiles;
    expect(hound.uuid).toBe("Compendium.world.monsters.Actor.TestHound2024");
    expect(cat.uuid).toBe("Compendium.world.monsters.Actor.testcat2024");
    expect(cat.name).toBe("Test Cat (no collar)");
  });

  it("falls back to the other ruleset when the creature has one printing", async () => {
    useMonsterPack([entry("Test Hound", "2014")]);
    const item = builtItem(summon);
    await linkMonsterSummons(item, creatures, true);
    expect(item.system.activities.summon1.profiles[0].uuid).toBe("Compendium.world.monsters.Actor.TestHound2014");
  });

  it("leaves a creature that is not munched yet as a named profile with no actor", async () => {
    useMonsterPack([entry("Test Hound", "2024")]);
    const item = builtItem(summon);
    await linkMonsterSummons(item, creatures, true);
    expect(item.system.activities.summon1.profiles[1]).toMatchObject({ name: "Test Cat (no collar)" });
    expect(item.system.activities.summon1.profiles[1].uuid).toBeUndefined();
  });

  it("links a creature that gives its D&D Beyond id to where a munch will put it", async () => {
    useMonsterPack([]);
    const early = [{ name: "Test Hound", ddbId: 1234567 }];
    const item = builtItem(monsterSummon("Call Pets", { creatures: early }));
    await linkMonsterSummons(item, early, true);
    // the same stub parser/monster/templates/monster.ts gives a munched monster
    expect(item.system.activities.summon1.profiles[0].uuid).toBe("Compendium.world.monsters.Actor.ddbTesHou1234567");
  });

  it("links a creature that is part of the munch now running, preferring the summoner's printing", async () => {
    useMonsterPack([]);
    setMonsterBatch([
      { id: 1111111, name: "Test Hound", isLegacy: true },
      { id: 2222222, name: "Test Hound", isLegacy: false },
    ]);
    // the id parser/monster/templates/monster.ts gives a munched monster
    const landsOn = (id: number) => `Compendium.world.monsters.Actor.${utils.namedIDStub("Test Hound", { postfix: id })}`;
    const modern = builtItem(summon);
    await linkMonsterSummons(modern, creatures, true);
    expect(modern.system.activities.summon1.profiles[0].uuid).toBe(landsOn(2222222));
    const legacy = builtItem(summon);
    await linkMonsterSummons(legacy, creatures, false);
    expect(legacy.system.activities.summon1.profiles[0].uuid).toBe(landsOn(1111111));
    // the cat is in neither the compendium nor the munch
    expect(modern.system.activities.summon1.profiles[1].uuid).toBeUndefined();
  });

  it("links by the D&D Beyond id a link gave, and takes the printed name from the compendium", async () => {
    const printed = { ...entry("Hag's Cat", "2014"), flags: { ddbimporter: { id: 103 } } };
    useMonsterPack([printed, entry("Test Hound", "2014")]);
    const linked = [{ name: "Hags Cat", ddbId: 103 }];
    const item = builtItem(monsterSummon("Call Pets", { creatures: linked }));
    await linkMonsterSummons(item, linked, false);
    expect(item.system.activities.summon1.profiles[0]).toMatchObject({ uuid: printed.uuid, name: "Hag's Cat" });
  });

  it("prefers a same-named creature of the summoner's rules over the legacy one a link points at", async () => {
    const legacy = { ...entry("Test Hound", "2014"), flags: { ddbimporter: { id: 7 } } };
    const modern = { ...entry("Test Hound", "2024"), flags: { ddbimporter: { id: 8 } } };
    useMonsterPack([legacy, modern]);
    const linked = [{ name: "Test Hound", ddbId: 7 }];
    const item = builtItem(monsterSummon("Call Pets", { creatures: linked }));
    await linkMonsterSummons(item, linked, true);
    expect(item.system.activities.summon1.profiles[0].uuid).toBe(modern.uuid);
  });

  it("does nothing without a monster compendium", async () => {
    useMonsterPack(null);
    const item = builtItem(summon);
    await expect(linkMonsterSummons(item, creatures, true)).resolves.toBeUndefined();
    expect(item.system.activities.summon1.profiles[0].uuid).toBeUndefined();
  });
});

describe("Rotting Ritual: Blight Spawn", () => {
  function ritual(): any {
    return makeEnricherData(RottingRitual, { name: "Rotting Ritual", actions: null, data: { name: "Rotting Ritual" } });
  }

  it("summons one rotweaver within 30 feet for a minute, beside the fungus", () => {
    const names = ritual().additionalActivities.map((a: any) => a.init.name);
    expect(names).toEqual(["Blight Spawn", "Devouring Fungus"]);
    const spawn = ritual().additionalActivities[0];
    expect(spawn.init.type).toBe("summon");
    expect(spawn.build.rangeOverride).toMatchObject({ value: "30", units: "ft" });
    expect(spawn.build.durationOverride).toMatchObject({ value: "1", units: "minute" });
    expect(spawn.overrides.data.profiles).toHaveLength(1);
    expect(spawn.overrides.data.profiles[0]).toMatchObject({ count: "1" });
  });

  it("links the profile from the compendium in cleanup", async () => {
    useMonsterPack([entry("Rotweaver", "2024")]);
    const e = ritual();
    const item = builtItem(e.additionalActivities[0]);
    e.ddbEnricher.ddbParser.data = item;
    await e.cleanup();
    expect(item.system.activities.summon1.profiles[0].uuid).toBe("Compendium.world.monsters.Actor.Rotweaver2024");
  });
});

describe("Summon Creatures: the text-driven generic", () => {
  /** `parser` is what the monster feature parser knows when the enricher is consulted. */
  function generic(name: string, text: string, parser: Record<string, unknown> = {}): any {
    const e: any = makeEnricherData(SummonCreatures, { name, actions: null, data: { name } });
    Object.assign(e.ddbEnricher.ddbParser, { strippedHtml: `${name}. ${text}`, ddbMonster: { name: "Test Caller" }, ...parser });
    return e;
  }

  const CALL = "The caller magically summons 1d4 cave rat;cave rats, which appear in unoccupied spaces within 30 feet of it. They remain for 1 hour.";

  it("makes the summon the feature's own activity when it does nothing else", () => {
    const e = generic("Call Vermin (1/Day)", CALL);
    expect(e.type).toBe("summon");
    expect(e.activity.data.profiles.map((p: any) => [p.name, p.count])).toEqual([["Cave Rat", "1d4"]]);
    expect(e.activity.data.range).toMatchObject({ value: "30", units: "ft" });
    expect(e.activity.data.duration).toMatchObject({ value: "1", units: "hour" });
    expect(e.additionalActivities).toEqual([]);
    expect(e.keepParsedActivities).toBe(false);
  });

  it("sits beside a save the feature also makes, and spends nothing itself", () => {
    const e = generic("Foul Bile", `Each creature must make a saving throw. ${CALL}`, { isSave: true });
    expect(e.type).toBeNull();
    expect(e.activity).toEqual({});
    expect(e.keepParsedActivities).toBe(true);
    const [summon] = e.additionalActivities;
    expect(summon.init).toMatchObject({ name: "Summon Creatures", type: "summon" });
    expect(summon.build.activationOverride.type).toBe("special");
    expect(summon.overrides.noConsumeTargets).toBe(true);
  });

  it("rolls the d100 first when the summoning can fail", () => {
    const e = generic("Summon Kin (1/Day)", "The caller has a 30 percent chance of summoning 1d4 cave rat;cave rats. They appear in unoccupied spaces.");
    expect(e.type).toBeNull();
    expect(e.activity.data.roll).toMatchObject({ formula: "1d100" });
    expect(e.activity.noTemplate).toBe(true);
    expect(e.activity.activationCondition).toBe("30 percent chance of success");
    expect(e.additionalActivities[0].build.activationOverride.condition).toContain("30 or lower");
  });

  it("marks an up-to count on the profile label and notes a delay", () => {
    const e = generic("Raise Husks", "The lord magically calls up to five husk;husks. The called creatures arrive in 1d4 rounds.");
    expect(e.activity.data.profiles[0]).toMatchObject({ name: "Husk (up to 5)", count: "5" });
    expect(e.activity.activationCondition).toBe("Arrive in 1d4 rounds");
  });

  it("asks dnd5e for the creature when the text gives a challenge rating", () => {
    const e = generic("Infernal Aid (1/Day)", "The gnome magically calls 1d4 devils with a challenge rating of 4 or lower. The called Fiends arrive in 1d4 rounds.");
    expect(e.activity.data.summon.mode).toBe("cr");
    expect(e.activity.data.profiles[0]).toMatchObject({ count: "1d4", cr: "4", types: ["fiend"] });
  });

  it("changes nothing when the text names no creature", () => {
    const e = generic("Summon Demon", "The mage summons a cone of silver fire that scorches the floor.");
    expect(e.type).toBeNull();
    expect(e.activity).toEqual({});
    expect(e.additionalActivities).toEqual([]);
    expect(e.keepParsedActivities).toBe(false);
  });

  it("links every creature it read", async () => {
    useMonsterPack([entry("Cave Rat", "2024")]);
    const e = generic("Call Vermin (1/Day)", CALL);
    const item = { name: "Call Vermin", system: { activities: { summon1: { type: "summon", ...foundry.utils.deepClone(e.activity.data) } } } };
    e.ddbEnricher.ddbParser.data = item;
    await e.cleanup();
    expect(item.system.activities.summon1.profiles[0].uuid).toBe("Compendium.world.monsters.Actor.CaveRat2024");
  });
});

describe("Lair Actions: options that call creatures", () => {
  const html = [
    "<p>On initiative count 20, the lord takes a lair action:</p>",
    "<ul><li>Grasping roots fill a 20-foot-radius area the lord can see within 120 feet. The area is difficult terrain until the next round.</li>",
    "<li><strong>Rouse the Hive (1/Day).</strong> The lord causes 2d4 giant gnat;giant gnats to appear in unoccupied spaces within 60 feet of him. They vanish after 1 hour.</li>",
    "<li>Doors in the lair slam, and an equal number of doors appear where there were none.</li></ul>",
  ].join("");

  it("reads a tagged option, labels it by its own name and ignores prose that merely appears", () => {
    expect(LairActions.parseSummons(html)).toEqual([{
      label: "Rouse the Hive",
      creatures: [{ name: "Giant Gnat", count: "2d4" }],
      range: "60",
      duration: { value: "1", units: "hour" },
    }]);
  });

  it("adds the summon beside the terrain placer, as a lair action", () => {
    const e: any = makeEnricherData(LairActions, { name: "Lair Actions", actions: null, data: { name: "Lair Actions" } });
    Object.assign(e.ddbEnricher.ddbParser, { html });
    const summon = e.additionalActivities.find((a: any) => a.init.type === "summon");
    expect(summon.init.name).toBe("Lair Summon: Rouse the Hive");
    expect(summon.build.activationOverride.type).toBe("lair");
    expect(e.additionalActivities.some((a: any) => a.init.name.startsWith("Lair Terrain"))).toBe(true);
  });
});

describe("Convocation of Iron: a summon among bold-only options", () => {
  const e: any = makeEnricherData(ConvocationOfIron, { name: "Convocation of Iron", actions: null, data: { name: "Convocation of Iron" } });

  it("names the parsed activity for the option with an effect, and spends the daily use on the summon too", () => {
    expect(e.activity.name).toBe("Iron Skin");
    const [summon] = e.additionalActivities;
    expect(summon.init).toMatchObject({ name: "Earth Reinforcements", type: "summon" });
    expect(summon.overrides.addItemConsume).toBe(true);
    expect(summon.overrides.data.profiles[0]).toMatchObject({ count: "5" });
    expect(e.keepParsedActivities).toBe(true);
  });

  it("gives Iron Skin resistance to the three weapon damage types", () => {
    const [effect] = e.effects;
    expect(effect.activityMatch).toBe("Iron Skin");
    expect(effect.changes.map((c: any) => c.value)).toEqual(["bludgeoning", "piercing", "slashing"]);
  });
});
