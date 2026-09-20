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

describe("LairActions enricher", () => {
  const e = lair(li(
    "Hailstorm. A storm fills a 30-foot cube centered on a point within 120 feet. It lasts until the end of initiative count 20 on the next round. Its area is difficult terrain, and creatures who enter it must succeed on a DC 18 Dexterity saving throw.",
    "The monster casts a spell.",
  ));

  it("adds one lair-activation placer per shaped option, carrying only difficult terrain", () => {
    expect(e.additionalActivities).toHaveLength(1);
    const [placer] = e.additionalActivities;
    expect(placer.init).toMatchObject({ name: "Lair Terrain: Hailstorm", type: "utility" });
    expect(placer.build).toMatchObject({
      activationOverride: { type: "lair" },
      targetOverride: { affects: { type: "creature" }, template: { type: "cube", size: "30" } },
      rangeOverride: { value: "120", units: "ft" },
      durationOverride: { value: "1", units: "round" },
      generateConsumption: false,
    });
    expect(placer.overrides.data.behaviors).toHaveLength(1);
    expect(placer.overrides.data.behaviors[0]).toMatchObject({ type: "difficultTerrain", config: { types: ["ice"] } });
  });

  it("keeps the saves the parser builds from the same list beside its placers", () => {
    expect(e.keepParsedActivities).toBe(true);
    // and leaves the parsed primary alone
    expect(e.type).toBeNull();
    expect(e.activity).toBeNull();
  });

  it("adds nothing to a lair with no shaped terrain, so that lair parses exactly as before", () => {
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

  it("halves Speed while inside and re-fires its own save at turn start, never at the swarm", () => {
    const [slow, save] = e.activity.data.behaviors;
    expect(slow).toMatchObject({ type: "applyActiveEffect", config: { effects: ["Weight of Wings: Speed Halved"] } });
    expect(save.config).toMatchObject({ events: ["tokenTurnStart"], excludeSelf: true });
    expect(save.config.args.activityName).toBeUndefined();
    expect(e.effects[0]).toMatchObject({
      name: "Weight of Wings: Speed Halved",
      standalone: true,
      options: { expiry: null, durationSeconds: null },
    });
  });
});
