// @vitest-environment jsdom
/**
 * Pins for the two monster-side region enrichers from the 2026-09 backlog: the generic lair
 * actions enricher, which reads difficult-terrain areas out of a lair's option list, and the
 * swarm-space trait. The lair parsing is a pure static, exercised here against synthetic wording
 * shaped like the real options; the real text lives in the private monster fixtures, where the
 * monsters audit replays it.
 *
 * No vi.mock preamble, for the reasons given in ClassEnrichers.test.ts.
 */
import LairActions from "../../../src/parser/enrichers/monster/Generic/LairActions";
import WeightOfWings from "../../../src/parser/enrichers/monster/Generic/WeightOfWings";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

function lair(html: string): any {
  return makeEnricherData(LairActions as any, {
    name: "Lair Actions",
    actions: null,
    data: { name: "Lair Actions" },
    ddbParser: { html },
  });
}

const li = (...options: string[]) => `<ul>${options.map((option) => `<li>${option}</li>`).join("")}</ul>`;

describe("LairActions.parseZones", () => {
  it("reads a square within range that lasts the round", () => {
    const [zone] = LairActions.parseZones(li(
      "A 50-foot square area of ground within 120 feet of the monster becomes slimy; that area is difficult terrain until initiative count 20 on the next round.",
    ));
    expect(zone).toEqual({
      label: "Slime",
      template: { type: "square", size: "50" },
      range: "120",
      duration: { value: "1", units: "round" },
      terrain: [],
      trigger: null,
    });
  });

  it("reads a radius, takes the option's own name and types the terrain", () => {
    const [zone] = LairActions.parseZones(li(
      "Grasping Roots. Roots and vines erupt in a 20-foot radius centered on a point on the ground that the monster can see within 120 feet of it. That area becomes difficult terrain. The roots wilt away when the monster uses this lair action again.",
    ));
    expect(zone).toMatchObject({
      label: "Grasping Roots",
      template: { type: "circle", size: "20" },
      range: "120",
      terrain: ["plants"],
      duration: { units: "spec" },
    });
  });

  it.each([
    ["a cylinder that is 30 feet tall with a 20-foot radius, centered on a point within 120 feet. The area within the cylinder is difficult terrain.", { type: "cylinder", size: "20", height: "30" }],
    ["a 30-foot-radius sphere of wasps centered on a point within 300 feet. The sphere's area is difficult terrain.", { type: "sphere", size: "30" }],
    ["a storm in a 30-foot cube centered on a point within 120 feet. Its area is difficult terrain.", { type: "cube", size: "30" }],
    ["A wall appears within 120 feet. The wall is up to 60 feet long, 10 feet high, and 5 feet thick. The wall's area is difficult terrain.", { type: "wall", size: "60", height: "10", width: "5" }],
    ["Plants erupt from a point within 120 feet. The area within 20 feet of that point is difficult terrain.", { type: "circle", size: "20" }],
  ])("reads the shape of %s", (text, template) => {
    expect(LairActions.parseZones(li(text))[0].template).toEqual(template);
  });

  it("centres a diameter on the monster, as a fixed emanation of half the size with no range", () => {
    const [zone] = LairActions.parseZones(li(
      "Roots erupt from the ground in a 100-foot diameter circle centered on the monster. The area becomes difficult terrain.",
    ));
    expect(zone.template).toEqual({ type: "radius", size: "50", stationary: true });
    expect(zone.range).toBeNull();
  });

  it("does not mistake the area around a point for a range", () => {
    const [zone] = LairActions.parseZones(li(
      "Plants erupt from a point the monster can see within 90 feet of it. The area within 20 feet of that point is difficult terrain.",
    ));
    expect(zone.range).toBe("90");
  });

  it("reads a stated duration", () => {
    const [zone] = LairActions.parseZones(li(
      "A 30-foot-radius sphere appears within 300 feet. The sphere remains for 10 minutes. Its area is difficult terrain.",
    ));
    expect(zone.duration).toEqual({ value: "10", units: "minute" });
  });

  it("leaves alone every option it cannot give a shape", () => {
    expect(LairActions.parseZones(li(
      "The ceiling, floor, and walls of the lair become difficult terrain until initiative count 20 on the next round.",
      "Underground surfaces within 1 mile of the lair are slimy and wet and are difficult terrain.",
      "A 20-foot radius of fire erupts within 120 feet; each creature there takes fire damage.",
    ))).toEqual([]);
  });

  it("keeps two options of one lair apart by name", () => {
    const zones = LairActions.parseZones(li(
      "Vines erupt in a 20-foot radius within 120 feet. That area becomes difficult terrain.",
      "Roots erupt in a 10-foot radius within 60 feet. That area becomes difficult terrain.",
    ));
    expect(zones.map((zone) => zone.label)).toEqual(["Plants", "Plants 2"]);
  });

  it("splits paragraph lists as well as bullet lists, and survives no text at all", () => {
    expect(LairActions.parseZones("<p>A 20-foot square within 60 feet is difficult terrain.</p><p>Nothing here.</p>")).toHaveLength(1);
    expect(LairActions.parseZones("")).toEqual([]);
  });
});

describe("LairActions.parseTrigger", () => {
  it("reads a save with damage from the trigger's own sentence", () => {
    const trigger = LairActions.parseTrigger("A storm fills a 30-foot cube within 120 feet. Creatures who enter the storm for the first time on a turn or start their turn there must succeed on a DC 18 Dexterity saving throw or take 10 (3d6) cold damage.");
    expect(trigger).toMatchObject({ events: ["tokenEnter", "tokenTurnStart"], save: { ability: ["dex"], dc: "18" }, onSave: "none", status: null });
    expect(trigger?.damageParts).toHaveLength(1);
    expect(trigger?.damageParts[0]).toMatchObject({ number: 3, denomination: 6, types: ["cold"] });
  });

  // The option rolls a save as the area appears; the later turn costs damage with no save at all.
  it("does not borrow the appearing save for a trigger that just deals damage", () => {
    const trigger = LairActions.parseTrigger("A cloud fills a 20-foot-radius sphere within 120 feet. Any creature in the cloud when it appears must make a DC 15 Constitution saving throw, taking 10 (3d6) piercing damage on a failed save, or half as much damage on a successful one. A creature that ends its turn in the cloud takes 10 (3d6) piercing damage.");
    expect(trigger).toMatchObject({ events: ["tokenTurnEnd"], save: null });
    expect(trigger?.damageParts).toHaveLength(1);
  });

  it("borrows the option's save and damage when the trigger only restates it", () => {
    const trigger = LairActions.parseTrigger("A 30-foot-radius sphere of wasps appears within 300 feet. When the sphere appears, each creature in it must make a DC 20 Constitution saving throw, taking 16 (3d10) piercing damage on a failed save, or half as much damage on a successful one. A creature must also make this saving throw when it enters the sphere for the first time on a turn or starts its turn there.");
    expect(trigger).toMatchObject({ events: ["tokenEnter", "tokenTurnStart"], save: { ability: ["con"], dc: "20" }, onSave: "half" });
    expect(trigger?.damageParts).toHaveLength(1);
  });

  it("takes the first condition named, not one that only qualifies it", () => {
    const trigger = LairActions.parseTrigger("Gases form a cloud in a 20-foot-radius sphere within 120 feet. Each creature that starts its turn in the cloud must succeed on a DC 13 Constitution saving throw or be poisoned until the end of its turn. While poisoned in this way, a creature is incapacitated.");
    expect(trigger).toMatchObject({ events: ["tokenTurnStart"], status: "Poisoned", save: { ability: ["con"], dc: "13" } });
    expect(trigger?.damageParts).toEqual([]);
  });

  it("reads a condition with no save as an effect-only trigger, and spares the monster when told to", () => {
    const trigger = LairActions.parseTrigger("A 20-foot square within 120 feet turns to quicksand. Creatures other than the monster who start their turn in that area or enter it become restrained.");
    expect(trigger).toMatchObject({ save: null, status: "Restrained", excludeSelf: true });
  });

  it("ignores damage that is a cost of moving through, and options that act only once", () => {
    expect(LairActions.parseTrigger("Spikes grow in a 20-foot-radius area within 60 feet. A creature that moves through the area takes 1d8 piercing damage for every 5 feet it moves there.")).toBeNull();
    expect(LairActions.parseTrigger("Each creature in a 20-foot radius within 120 feet must succeed on a DC 15 Strength saving throw or be restrained.")).toBeNull();
  });
});

describe("LairActions enricher", () => {
  const e = lair(li(
    "Hailstorm. A storm fills a 30-foot cube centered on a point within 120 feet. It lasts until the end of initiative count 20 on the next round. Its area is difficult terrain, and creatures who enter it or start their turn there must succeed on a DC 18 Dexterity saving throw or be blinded until the end of its next turn.",
    "The monster casts a spell.",
    "A 50-foot square area of ground within 120 feet becomes slimy; that area is difficult terrain until initiative count 20 on the next round.",
  ));
  const [placer, fired, terrainOnly] = e.additionalActivities;

  it("adds a lair-activation placer per shaped option, and the trigger it fires", () => {
    expect(e.additionalActivities).toHaveLength(3);
    expect(placer.init).toMatchObject({ name: "Lair Area: Hailstorm", type: "utility" });
    expect(placer.build).toMatchObject({
      activationOverride: { type: "lair" },
      targetOverride: { affects: { type: "creature" }, template: { type: "cube", size: "30" } },
      rangeOverride: { value: "120", units: "ft" },
      durationOverride: { value: "1", units: "round" },
      generateConsumption: false,
    });
    const [terrain, trigger] = placer.overrides.data.behaviors;
    expect(terrain).toMatchObject({ type: "difficultTerrain", config: { types: ["ice"] } });
    expect(trigger.config).toMatchObject({ events: ["tokenEnter", "tokenTurnStart"], args: { activityName: "Hailstorm Save" } });
    expect(trigger.config.args.autoRoll).toBeUndefined();
  });

  it("builds the trigger as a free save named after the option", () => {
    expect(fired.init).toMatchObject({ name: "Hailstorm Save", type: "save" });
    expect(fired.build).toMatchObject({
      saveOverride: { ability: ["dex"], dc: { formula: "18" } },
      activationOverride: { type: "special" },
      generateConsumption: false,
    });
  });

  // An activity with no effect links of its own picks up every unmatched effect the parser made
  // for the other options of the lair, so each trigger links its own or opts out.
  it("links the trigger to its own effect only, by a shared id", () => {
    const [hint] = e.effects;
    expect(hint).toMatchObject({ name: "Hailstorm: Blinded", activityMatch: "Hailstorm Save", statuses: ["Blinded"], options: { transfer: false, expiry: "targetEnd" } });
    expect(fired.overrides.data.effects).toEqual([expect.objectContaining({ _id: hint.data._id })]);
    expect(hint.data._id).toMatch(/^[A-Za-z0-9]{16}$/);
  });

  it("keeps a terrain-only option as a terrain placer with nothing to fire", () => {
    expect(terrainOnly.init.name).toBe("Lair Terrain: Slime");
    expect(terrainOnly.overrides.data.behaviors.map((behavior: any) => behavior.type)).toEqual(["difficultTerrain"]);
  });

  it("opts a trigger with nothing to apply out of effect links altogether", () => {
    const plain = lair(li("A cloud fills a 20-foot-radius sphere within 120 feet. A creature that ends its turn in the cloud takes 10 (3d6) piercing damage."));
    const [, damage] = plain.additionalActivities;
    expect(damage.init).toMatchObject({ name: "Cloud Damage", type: "damage" });
    expect(damage.overrides.noeffect).toBe(true);
    expect(plain.effects).toEqual([]);
  });

  it("keeps the saves the parser builds from the same list beside its own", () => {
    expect(e.keepParsedActivities).toBe(true);
    // and leaves the parsed primary alone
    expect(e.type).toBeNull();
    expect(e.activity).toBeNull();
  });

  it("adds nothing to a lair with no shaped area, so that lair parses exactly as before", () => {
    expect(lair(li("Each creature within 60 feet must succeed on a DC 15 Wisdom saving throw.")).additionalActivities).toEqual([]);
  });
});

describe("Weight of Wings", () => {
  const e = makeEnricherData(WeightOfWings as any, { name: "Weight of Wings", actions: null, data: { name: "Weight of Wings" } }) as any;

  it("gives the parsed save the swarm's own space as its area", () => {
    // dnd5e reads a size of 0 as no size, so the space is the footprint plus 1 foot
    expect(e.activity.data.target).toMatchObject({ override: true, affects: { type: "creature" }, template: { type: "radius", size: "1" } });
    expect(e.type).toBeNull();
  });

  it("re-fires its own save at turn start, never at the swarm", () => {
    const behaviors = e.activity.data.behaviors;
    expect(behaviors).toHaveLength(1);
    expect(behaviors[0].config).toMatchObject({ events: ["tokenTurnStart"], excludeSelf: true });
    expect(behaviors[0].config.args.activityName).toBeUndefined();
  });

  // The swarm always stands in its own space and the native apply-effect behavior cannot skip the
  // token a region comes from: seen live, an effect applied while inside halved the swarm's own
  // Speed. So the effect rides on the save, which the region never fires at the swarm.
  it("halves Speed from the save, on a success too, and applies nothing while merely inside", () => {
    expect(e.activity.data.behaviors.some((behavior: any) => behavior.type === "applyActiveEffect")).toBe(false);
    expect(e.effects[0]).toMatchObject({
      name: "Weight of Wings: Speed Halved",
      onSave: true,
      options: { transfer: false, expiry: null, durationSeconds: null },
    });
    expect(e.effects[0].standalone).toBeUndefined();
  });
});
