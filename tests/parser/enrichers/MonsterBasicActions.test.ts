// @vitest-environment jsdom
// The enricher barrel loads first: importing DDBMonsterFeatureEnricher directly re-enters the
// enricher tree mid-evaluation and DDBGenericEnricher extends an undefined mixin.
import { DDBMonsterFeatureEnricher, MonsterEnrichers } from "../../../src/parser/enrichers/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";
import { withSystemVersion } from "../../_fixtures/systemVersion";
import { SRD_EFFECTS } from "../../../src/config/dictionary/effects/srdEffects";

const BasicActions = MonsterEnrichers.Generic.BasicActions;
const Teleport = MonsterEnrichers.Generic.Teleport;

beforeAll(() => installActivityConfigStubs());

function feature(
  name: string,
  text: string,
  { activation = "bonus", is2014 = false, parser = {} }: { activation?: string; is2014?: boolean; parser?: Record<string, unknown> } = {},
): InstanceType<typeof BasicActions> {
  const e = makeEnricherData(BasicActions, {
    name,
    is2014,
    actions: null,
    ddbParser: {
      strippedHtml: text,
      actionData: { damageParts: [], healingParts: [], activation: { type: activation, value: null, condition: "" } },
      ...parser,
    },
  });
  e.document = { system: { activities: {} }, effects: [] };
  return e;
}

describe("monster standard action offers", () => {
  it("reads every offered action in text order", () => {
    expect(BasicActions.offeredActionNames("The goblin takes the Disengage or Hide action.", "bonus")).toEqual(["Disengage", "Hide"]);
    expect(BasicActions.offeredActionNames("On each of its turns, the spy can use a bonus action to take the Dash, Disengage, or Hide action.", "bonus"))
      .toEqual(["Dash", "Disengage", "Hide"]);
    expect(BasicActions.offeredActionNames("Rain takes either the Disengage or the Hide action.", "bonus")).toEqual(["Disengage", "Hide"]);
    expect(BasicActions.offeredActionNames("The scout takes the Influence, Search, or Study action.", "bonus")).toEqual(["Influence", "Search", "Study"]);
    expect(BasicActions.offeredActionNames("While in Dim Light or Darkness, the satyr takes the Hide action.", "bonus")).toEqual(["Hide"]);
  });

  it.each([
    ["a prohibition", "A flab giant can't take the Dash action."],
    ["a forced action", "While frightened in this way, the creature must take the Dash action and move away."],
    ["a rule about the action", "If Iguanodon takes the Dash action, its base speed is increased to 40 ft."],
    ["another creature's action", "Creatures provoke Opportunity Attacks from the deep knight even if they take the Disengage action before leaving its reach."],
    ["a trigger", "Trigger: A creature within 5 feet of the dreg takes the Disengage action or makes a melee attack roll."],
    ["an exemption", "Each creature must succeed on a DC 21 Wisdom saving throw, in which case it needn't take the Dash action."],
  ])("ignores %s", (_label, text) => {
    expect(BasicActions.offeredActionNames(text, "action")).toEqual([]);
  });

  it("only handles features the monster uses", () => {
    // a passive trait that widens where it can hide
    expect(BasicActions.matches("River Skulker", "The dinosaur can take the Hide action in sparse foliage.", "special")).toBe(false);
    // a 2014 trait spends a bonus action without saying "as a bonus action"
    expect(BasicActions.matches("Cunning Action", "The spy can use a bonus action to take the Dash, Disengage, or Hide action.", "special")).toBe(true);
    expect(BasicActions.matches("Multiattack", "The assassin makes two attacks. It can then take the Dash, Disengage, or Hide action.", "action")).toBe(false);
  });

  it("builds the 2024 goblin's Nimble Escape as Disengage and a DC 15 Hide check", () => {
    const e = feature("Nimble Escape", "The goblin takes the Disengage or Hide action.");
    expect(e.type).toBe("utility");
    expect(e.activity).toMatchObject({ name: "Disengage", targetSelf: true, rangeSelf: true });
    expect(e.activity).not.toHaveProperty("activationType");
    expect(e.additionalActivities).toHaveLength(1);
    expect(e.additionalActivities[0]).toMatchObject({
      init: { name: "Hide", type: "check" },
      build: {
        activationOverride: { type: "bonus" },
        generateConsumption: true,
        generateCheck: true,
        checkOverride: { ability: "dex", associated: ["ste"], dc: { calculation: "", formula: "15" } },
        targetOverride: { affects: { type: "self" } },
        rangeOverride: { units: "self" },
      },
    });
    expect(e.additionalActivities[0].init?.id).toHaveLength(16);
    expect(e.effects).toEqual([
      expect.objectContaining({ name: "Disengaged", activityMatch: "Disengage" }),
      expect.objectContaining({ name: "Hiding", statuses: ["hiding"], activityMatch: "Hide" }),
    ]);
  });

  it("leaves the 2014 Hide check without a DC and makes a trait a bonus action", () => {
    const e = feature(
      "Nimble Escape",
      "The goblin can take the Disengage or Hide action as a bonus action on each of its turns.",
      { activation: "special", is2014: true },
    );
    expect(e.activity).toMatchObject({ name: "Disengage", activationType: "bonus" });
    expect(e.additionalActivities[0].build?.checkOverride?.dc?.formula).toBe("");
    expect(e.additionalActivities[0].build?.activationOverride?.type).toBe("bonus");
  });

  it("makes a lone Hide the primary check", () => {
    const e = feature("Shadow Stealth", "While in Dim Light or Darkness, the mangler takes the Hide action.");
    expect(e.type).toBe("check");
    expect(e.activity).toMatchObject({ name: "Hide", data: { check: { associated: ["ste"] } } });
    expect(e.additionalActivities).toEqual([]);
  });

  it("reads multi-skill checks from the action's rules summary", () => {
    const e = feature("Quick Thinking", "The scout takes the Influence, Search, or Study action.");
    expect((e.activity?.data as Partial<I5eCheckActivity> | undefined)?.check).toMatchObject({ ability: "", associated: expect.arrayContaining(["dec", "itm", "prf", "per", "ani"]) });
    const [search, study] = e.additionalActivities;
    expect(search.build?.checkOverride).toMatchObject({ ability: "wis", associated: ["ins", "med", "prc", "sur"] });
    expect(study.build?.checkOverride).toMatchObject({ ability: "int", associated: ["arc", "his", "inv", "nat", "rel"] });
  });

  it("keeps the parser's attack and adds the actions beside it", () => {
    const e = feature(
      "Assassin's Agility",
      "The cuprilach takes the Dash or Disengage action, or it makes one Burnished Blade attack.",
      { parser: { isAttack: true } },
    );
    expect(e.type).toBeNull();
    expect(e.activity).toBeNull();
    expect(e.additionalActivities.map((a) => a.init?.name)).toEqual(["Dash", "Disengage"]);
  });

  it("keeps a feature's own utility when the offer is not its opening", () => {
    const e = feature(
      "Reduce",
      "For 1 minute, the duergar magically decreases in size. It can also take a bonus action on each of its turns to take the Hide action.",
      { activation: "action" },
    );
    expect(e.type).toBeNull();
    expect(e.additionalActivities.map((a) => a.init?.name)).toEqual(["Hide"]);
    // the Hide it allows while reduced is a bonus action of its own and spends none of Reduce's uses
    expect(e.additionalActivities[0].build).toMatchObject({ activationOverride: { type: "bonus" }, generateConsumption: false });
  });

  it("keeps the legendary cost on every option", () => {
    const e = feature("Rampant Thrashing", "Megalosaurus takes the Dash or Disengage action.", { activation: "legendary" });
    (e.ddbParser as { actionData: { activation: { value: number } } }).actionData.activation.value = 2;
    expect(e.activity).not.toHaveProperty("activationType");
    expect(e.additionalActivities[0].build).toMatchObject({ activationOverride: { type: "legendary", value: 2 }, generateConsumption: true });
  });
});

describe("monster standard action resolution", () => {
  const enricher = new DDBMonsterFeatureEnricher({
    activityGenerator: null as unknown as TActivityGenerator,
  });

  function textHint(name: string, text: string, section = "bonus"): string | null {
    enricher.name = name;
    // the parser has not resolved its activation when the enricher loads
    enricher.ddbParser = { strippedHtml: text, type: section, actionData: { activation: { value: null } } } as unknown as TDDBParsers;
    return enricher._genericTextHint();
  }

  it("routes a standard action offer by its text, whatever the feature is called", () => {
    expect(enricher._genericFeatureHint("Nimble Escape")).toBeNull();
    expect(textHint("Nimble Escape", "The goblin takes the Disengage or Hide action.")).toBe("Basic Actions");
    expect(textHint("Skitter", "The ratatosk takes the Dash, Disengage, or Hide action.")).toBe("Basic Actions");
    expect(textHint("Hide", "Rezmir takes the Hide action.", "legendary")).toBe("Basic Actions");
    expect(enricher.GENERIC_ENRICHERS["Basic Actions"]).toBe(BasicActions);
  });

  it("leaves a feature that only mentions an action", () => {
    // the Snowfox's Nimble Escape is a different trait under the same name
    expect(textHint("Nimble Escape", "The snowfox doesn't provoke opportunity attacks when they leave an enemy's reach.", "special")).toBeNull();
    enricher.name = "Legendary Actions";
    enricher.ddbParser = { strippedHtml: "Hide. Rezmir takes the Hide action.", type: "legendary", isBlockSummary: true, actionData: {} } as unknown as TDDBParsers;
    expect(enricher._genericTextHint()).toBeNull();
    expect(textHint("Bipedal Shift", "If Iguanodon takes the Dash action, its base speed is increased.", "special")).toBeNull();
  });
});

describe("standard action effects", () => {
  const spy = () => feature("Cunning Action", "The spy takes the Dash, Disengage, or Dodge action.");

  it("copies dnd5e 6.1's Dashing, Disengaged and Dodging effects onto each action", () => {
    withSystemVersion("6.1.0", () => {
      const [dash, disengage, dodge] = spy().effects;
      expect(dash).toMatchObject({
        name: "Dashing",
        img: "systems/dnd5e/icons/svg/action/dash.svg",
        activityMatch: "Dash",
        options: { durationSeconds: null, expiry: "turnEnd" },
        data: { _stats: { compendiumSource: expect.stringContaining(SRD_EFFECTS.conditions.dashing.id) } },
      });
      expect(dash.statuses).toBeUndefined();
      expect(dash.options?.description).toBeUndefined();
      expect(disengage).toMatchObject({ name: "Disengaged", activityMatch: "Disengage", options: { expiry: "turnEnd" } });
      expect(dodge).toMatchObject({
        name: "Dodging",
        img: "systems/dnd5e/icons/svg/action/dodge.svg",
        statuses: ["dodging"],
        activityMatch: "Dodge",
        options: { expiry: "sourceStart" },
      });
    });
  });

  it("builds its own effects before 6.1, described by the action's rules", () => {
    withSystemVersion("6.0.6", () => {
      const [dash, disengage, dodge] = spy().effects;
      expect(dash).toMatchObject({ name: "Dashing", img: "systems/dnd5e/icons/svg/action/dash.svg", options: { expiry: "turnEnd" } });
      expect(dash.data).toBeUndefined();
      expect(dash.options?.description).toContain("extra movement");
      // dnd5e 6.0 has no Disengage artwork; the effect keeps the feature's
      expect(disengage.img).toBeUndefined();
      expect(disengage.options?.description).toContain("Opportunity Attack");
      expect(dodge).toMatchObject({ img: "systems/dnd5e/icons/svg/statuses/dodging.svg", statuses: ["dodging"], options: { expiry: "sourceStart" } });
      expect(dodge.options?.description).toContain("Disadvantage");
    });
  });

  it("describes Hiding with the Hide action's rules on every version", () => {
    withSystemVersion("6.1.0", () => {
      const [hide] = feature("Sneak", "The assassin takes the Hide action.").effects;
      expect(hide).toMatchObject({ name: "Hiding", statuses: ["hiding"], img: "systems/dnd5e/icons/svg/statuses/hiding.svg" });
      expect(hide.options?.description).toContain("Stealth");
      // DDB's rule tags are linked, never left as raw markup
      expect(hide.options?.description).not.toMatch(/\[\/?rule\]/);
    });
  });
});

describe("teleports that also hide", () => {
  function teleport(name: string, text: string): InstanceType<typeof Teleport> {
    const e = makeEnricherData(Teleport, {
      name,
      actions: null,
      ddbParser: {
        strippedHtml: text,
        actionData: { damageParts: [], healingParts: [], activation: { type: "bonus", value: null, condition: "" } },
      },
    });
    e.document = { system: { activities: {} }, effects: [] };
    return e;
  }

  it("adds Hidden Step's Hide as a free follow-up of the teleport", () => {
    const e = teleport(
      "Hidden Step",
      "The vile barber magically teleports, along with any equipment it is wearing or carrying, up to 30 feet to an unoccupied space it can see and takes the Hide action.",
    );
    expect(e.type).toBe("teleport");
    expect(e.additionalActivities).toHaveLength(1);
    expect(e.additionalActivities[0]).toMatchObject({
      init: { name: "Hide", type: "check" },
      build: {
        activationOverride: { type: "special", condition: "As part of Hidden Step." },
        generateConsumption: false,
        checkOverride: { associated: ["ste"] },
      },
    });
    expect(e.effects).toEqual([expect.objectContaining({ name: "Hiding", activityMatch: "Hide" })]);
  });

  it("gives a later Hide offer the feature's own activation", () => {
    const e = teleport(
      "Fey Step",
      "The Forgotten Prince can teleport up to 30 feet to an unoccupied space he can see. Shadow Stealth. The Forgotten Prince can take the Hide action.",
    );
    expect(e.additionalActivities[0]).toMatchObject({
      init: { name: "Hide" },
      build: { activationOverride: { type: "bonus" }, generateConsumption: false },
    });
  });

  it("leaves a plain teleport alone", () => {
    const e = teleport("Fey Step", "The fey magically teleports up to 30 feet to an unoccupied space it can see.");
    expect(e.additionalActivities).toEqual([]);
    expect(e.effects).toEqual([]);
  });
});
