// @vitest-environment jsdom
/**
 * Pins for the text-driven monster zone enricher and the readers it shares with the lair
 * enricher. The monsters audit shows what each real stat block ends up with; what it cannot show
 * is which branch the text took (fire the action's own activity or build a sibling, follow the
 * monster or stay put), and that a same-named plain action on another monster changes nothing.
 * All wording here is synthetic.
 *
 * No vi.mock preamble, for the reasons given in ClassEnrichers.test.ts.
 */
import PlacedZone from "../../../src/parser/enrichers/monster/Generic/PlacedZone";
import LairActions from "../../../src/parser/enrichers/monster/Generic/LairActions";
import { parseShape, parseTrigger, terrainTypes } from "../../../src/parser/enrichers/monster/Generic/_ZoneText";
import { MOVEMENT_EVENTS } from "../../../src/parser/enrichers/data/RegionBuilders";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

interface IParsed {
  isSave?: boolean;
  type?: string;
  template?: { type: string; size: string };
  damage?: boolean;
}

/** A monster feature enricher: the text and what the parser made of it sit on the parser. */
function zone(text: string, { isSave = true, type = "action", template, damage = false }: IParsed = {}, name = "Test Zone"): any {
  return makeEnricherData(PlacedZone as any, {
    name,
    actions: null,
    data: { name },
    ddbParser: {
      strippedHtml: text,
      isSave,
      type,
      actionData: { damageParts: damage ? [{}] : [], healingParts: [], target: { template: template ?? {} } },
    },
  });
}

function behaviors(e: any): any[] {
  return e.activity.data?.behaviors ?? [];
}

function macro(e: any): any {
  return behaviors(e).find((b: any) => b.type === "ddbMacro");
}

describe("PlacedZone: text with no zone wording changes nothing", () => {
  it.each([
    ["Test Breath (Recharge 5-6). The thing exhales gas in a 30-foot cone. Each creature in that area must make a DC 14 Constitution saving throw, taking 21 (6d6) poison damage on a failed save."],
    ["Test Burst. When the thing dies, it explodes. Each creature within 5 feet of it must make a DC 10 Dexterity saving throw or take 4 (1d8) fire damage."],
    // the save belongs to a sphere the monster left behind, which is no token of its own
    ["Test Mimicry. It creates a sphere of fire within 60 feet. A creature that ends its turn within 5 feet of the sphere makes a DC 16 Dexterity saving throw."],
  ])("%s", (text) => {
    const e = zone(text, { template: { type: "cone", size: "30" } });
    expect(e.activity).toEqual({});
    expect(e.additionalActivities).toEqual([]);
    expect(e.effects).toEqual([]);
    expect(e.type).toBeNull();
    expect(e.keepParsedActivities).toBe(false);
  });
});

describe("PlacedZone: the region fires the action's own activity", () => {
  const cloud = "Test Cloud (1/Day). A 10-foot radius of gas extends out from the thing and lasts for 1 minute. Any creature that starts its turn in that area must succeed on a DC 11 Constitution saving throw or be poisoned until the start of its next turn.";

  it("names no sibling, so the use is not spent again and nothing extra is built", () => {
    const e = zone(cloud);
    expect(macro(e).config.events).toEqual(["tokenTurnStart"]);
    expect(macro(e).config.args.activityName).toBeUndefined();
    expect(e.additionalActivities).toEqual([]);
    expect(e.keepParsedActivities).toBe(false);
  });

  it("centres a cloud the parser gave no template on the monster, and leaves it where it was made", () => {
    expect(zone(cloud).activity.data.target.template).toMatchObject({ type: "radius", size: "10", stationary: true });
  });

  it("reads a size through DDB's soft hyphen", () => {
    expect(zone(cloud.replace("10-foot", "10\u00AD-foot")).activity.data.target.template).toMatchObject({ type: "radius", size: "10" });
  });

  it("treats 'must also' as the same save, even after a roll made as the area appears", () => {
    const e = zone("Test Spray. Grease covers a 10-foot square centered on a point within 30 feet, and the area is difficult terrain. Each creature standing in the area must succeed on a DC 16 Dexterity saving throw or fall prone. A creature that enters the area or ends its turn there must also succeed on a DC 16 Dexterity saving throw or fall prone.",
      { template: { type: "radius", size: "30" } });
    expect(macro(e).config.events).toEqual(["tokenEnter", "tokenTurnEnd"]);
    expect(macro(e).config.args.activityName).toBeUndefined();
    // the parser read the range as a radius
    expect(e.activity.data.target.template).toMatchObject({ type: "square", size: "10" });
    expect(e.activity.data.range).toMatchObject({ value: "30", units: "ft" });
    expect(behaviors(e)[0].type).toBe("difficultTerrain");
  });

  it("fires a plain damage action on every movement when the text prices movement", () => {
    const e = zone("Test Spikes. The ground in a 20-foot square within 90 feet sprouts spikes. The area becomes difficult terrain for the duration. A creature takes 10 (3d6) piercing damage for each 5 feet it moves on this terrain.",
      { isSave: false, damage: true });
    expect(macro(e).config).toMatchObject({ events: MOVEMENT_EVENTS, oncePerTurn: false });
    expect(macro(e).config.args.activityName).toBeUndefined();
    expect(e.additionalActivities).toEqual([]);
  });
});

describe("PlacedZone: a sibling for a later roll that differs", () => {
  const breath = "Test Fog (Recharge 5-6). The thing exhales fog in a 20-foot radius centered on itself. Each creature in the area must make a DC 14 Constitution saving throw. On a failure, a creature takes 28 (8d6) poison damage. The fog lasts for 1 minute. A creature that starts its turn in the fog or enters the fog for the first time on a turn must succeed on a DC 14 Constitution saving throw or be poisoned until the end of its next turn.";

  it("builds a free save with its own effect and keeps the parser's activities", () => {
    const e = zone(breath, { template: { type: "radius", size: "20" } });
    expect(macro(e).config).toMatchObject({ events: ["tokenEnter", "tokenTurnStart"], args: { activityName: "Ongoing Save" } });
    const [sibling] = e.additionalActivities;
    expect(sibling.init).toEqual({ name: "Ongoing Save", type: "save" });
    expect(sibling.build.saveOverride).toMatchObject({ ability: ["con"], dc: { formula: "14" } });
    // the breath's dice belong to the breath
    expect(sibling.build.generateDamage).toBe(false);
    expect(e.keepParsedActivities).toBe(true);
    const [effect] = e.effects;
    expect(effect).toMatchObject({ activityMatch: "Ongoing Save", statuses: ["Poisoned"], options: { transfer: false, expiry: "targetEnd" } });
    expect(sibling.overrides.data.effects[0]._id).toBe(effect.data._id);
    // a fog centred on the monster stays where it was breathed
    expect(e.activity.data.target.template).toMatchObject({ type: "radius", size: "20", stationary: true });
  });

  it("builds an effect-only utility when the later sentence rolls nothing", () => {
    const e = zone("Test Smoke. Each creature within 10 feet of it must make a DC 12 Constitution saving throw, taking 7 (2d6) poison damage on a failure. The smoke fills a 10-foot-radius sphere. A creature that enters the cloud for the first time on a turn or starts its turn there is poisoned until the end of its next turn.",
      { template: { type: "sphere", size: "10" } });
    expect(e.additionalActivities[0].init).toEqual({ name: "Ongoing Effect", type: "utility" });
    expect(macro(e).config.args.activityName).toBe("Ongoing Effect");
  });

  it("gives a breath that leaves cutting ground a Movement Damage sibling", () => {
    const e = zone("Test Shards (Recharge 5-6). It spits shards in a 60-foot cone. Each creature in that area must make a DC 19 Constitution saving throw, taking 42 (12d6) slashing damage on a failed save. The area becomes difficult terrain for 1 minute. When a creature moves into or within the area, it takes 7 (2d6) slashing damage for every 5 feet it travels.",
      { template: { type: "cone", size: "60" } });
    expect(behaviors(e).map((b: any) => b.type)).toEqual(["difficultTerrain", "ddbMacro"]);
    expect(macro(e).config).toMatchObject({ events: MOVEMENT_EVENTS, oncePerTurn: false, args: { activityName: "Movement Damage" } });
    const [moved] = e.additionalActivities;
    expect(moved.init).toEqual({ name: "Movement Damage", type: "damage" });
    expect(moved.build.damageParts).toHaveLength(1);
    expect(moved.overrides.noeffect).toBe(true);
    // the cone is the parser's, and a cone never follows anything
    expect(e.activity.data.target).toBeUndefined();
  });
});

describe("PlacedZone: follows the monster or stays put", () => {
  it.each([
    ["Test Smoke. Smoke fills a 30-foot-radius sphere centered on itself that moves with it. A creature that starts its turn there must succeed on a DC 15 Constitution saving throw or take 14 (4d6) fire damage.", { type: "sphere", size: "30" }, "30"],
    ["Test Storm. A 30-foot-tall cylinder of sand forms in its space and moves with it. The area within 5 feet of it is heavily obscured. A creature that starts its turn in that area must succeed on a DC 13 Strength saving throw or be restrained.", undefined, "5"],
    ["Test Spray. When a creature ends its turn within 30 feet of Testor, Testor sprays slime at it. The target must make a DC 19 Dexterity saving throw.", undefined, "30"],
  ])("follows and never cards the monster: %s", (text, template, size) => {
    const e = zone(text, { template: template as IParsed["template"] });
    const placed = e.activity.data.target.template;
    expect(placed).toMatchObject({ type: "radius", size });
    expect(placed.stationary).toBeUndefined();
    expect(macro(e).config.excludeSelf).toBe(true);
  });

  it("leaves a following aura the parser already read as a radius alone", () => {
    const e = zone("Test Aura. It manifests an aura of blades around itself. Each creature that starts its turn within 10 feet of it must make a DC 19 Dexterity saving throw.",
      { template: { type: "radius", size: "10" } });
    expect(e.activity.data.target).toBeUndefined();
    expect(macro(e).config.excludeSelf).toBe(true);
  });

  it("pins a burst's leftover terrain where the burst happened", () => {
    const e = zone("Test Blast (Recharge 6). Each creature within 15 feet of it must make a DC 16 Constitution saving throw. The area becomes difficult terrain for 1 minute.",
      { template: { type: "radius", size: "15" } });
    expect(e.activity.data.target.template).toMatchObject({ type: "radius", size: "15", stationary: true });
    expect(behaviors(e).map((b: any) => b.type)).toEqual(["difficultTerrain"]);
  });

  it("sets a point area down at range", () => {
    const e = zone("Test Fog. It creates a 40-foot-diameter sphere of fog within 60 feet of it. When a creature enters the fog for the first time on a turn or starts its turn there, it must make a DC 16 Constitution saving throw.");
    expect(e.activity.data.target.template).toMatchObject({ type: "sphere", size: "20" });
    expect(e.activity.data.range).toMatchObject({ value: "60", units: "ft" });
  });

  it("reads a line", () => {
    const e = zone("Test Gust (1/Day). A 10-foot-wide, 60-foot-long line of wind gusts from it for 1 minute. Each creature who starts their turn in that area must succeed on a DC 15 Strength saving throw or be pushed.");
    expect(e.activity.data.target.template).toMatchObject({ type: "line", size: "60", width: "10" });
  });
});

describe("PlacedZone: an always-on trait the parser gives no activity", () => {
  it("becomes a utility that carries the ground with the monster", () => {
    const e = zone("Test Mud. The ground within 15 feet of the mud thing is difficult terrain for other creatures.",
      { isSave: false, type: "special" }, "Test Mud");
    expect(e.type).toBe("utility");
    expect(e.activity).toMatchObject({ name: "Test Mud", activationType: "special" });
    const placed = e.activity.data.target.template;
    expect(placed).toMatchObject({ type: "radius", size: "15" });
    expect(placed.stationary).toBeUndefined();
    expect(behaviors(e)[0]).toMatchObject({ type: "difficultTerrain", config: { types: ["mud"] } });
  });

  it("leaves an action's own type alone", () => {
    expect(zone("Test Web. The web is difficult terrain.", { isSave: false, type: "action" }).type).toBeNull();
  });
});

describe("PlacedZone: terrain is typed from its own sentence", () => {
  it.each([
    ["It sends a shock wave through the ground in a 120-foot-radius circle. That area becomes difficult terrain for 1 minute.", []],
    ["It digs its roots in, shrouding a 20-foot radius. This area is difficult terrain.", []],
    ["It fills a 30-foot cube with hair. The web is difficult terrain, and it lasts for 1 minute.", ["web"]],
    ["A boggle makes a puddle of oil. The puddle is difficult terrain for all creatures except boggles.", []],
  ])("%s", (text, types) => {
    expect(behaviors(zone(`Test Ground. ${text}`, { template: { type: "cube", size: "30" } }))[0].config.types).toEqual(types);
  });
});

describe("_ZoneText, shared with the lair enricher", () => {
  it("answers through the lair enricher's own names", () => {
    const text = "Fog fills a 20-foot-radius sphere within 120 feet. A creature that starts its turn there must succeed on a DC 15 Constitution saving throw or be poisoned.";
    expect(LairActions.parseTrigger(text)).toEqual(parseTrigger(text));
    expect(LairActions.parseShape(text)).toEqual(parseShape(text));
    expect(LairActions.parseShape(text)?.template).toMatchObject({ type: "sphere", size: "20" });
  });

  it("reads a hyphenated square and keeps a boggle out of the mud", () => {
    expect(parseShape("a 10-foot-square puddle of oil")?.template).toMatchObject({ type: "square", size: "10" });
    expect(terrainTypes("difficult terrain for all creatures except boggles")).toEqual([]);
    expect(terrainTypes("the bog is difficult terrain")).toEqual(["mud"]);
  });
});
