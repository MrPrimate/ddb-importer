/**
 * A region's useActivity behavior takes its dispositions from the activity it fires, not from the
 * activity that placed it (DDBMacroActivityBehavior.createBehaviorData), and dnd5e only narrows
 * dispositions for `enemy` and `ally`. A placer marked `enemy` whose triggered save targets
 * `creature` therefore fires on the caster and every ally in the area.
 *
 * No vi.mock preamble, for the reasons given in ClassEnrichers.test.ts.
 */
import * as Enrichers from "../../../src/parser/enrichers/_module";
import * as ClassEnrichers from "../../../src/parser/enrichers/class/_module";
import * as SpellEnrichers from "../../../src/parser/enrichers/spell/_module";
import DDBEnricherData from "../../../src/parser/enrichers/data/DDBEnricherData";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

/** The affects type an activity hint asks for, from whichever field the hint uses. */
function affectsType(hint: any): string | undefined {
  return hint?.build?.targetOverride?.affects?.type
    ?? hint?.overrides?.data?.target?.affects?.type
    ?? hint?.overrides?.targetType
    ?? hint?.data?.target?.affects?.type
    ?? hint?.targetType;
}

interface IRegionTrigger {
  placer: string;
  placerType: string | undefined;
  sibling: string;
  /** false when no activity hint on the enricher carries the fired name */
  resolved: boolean;
  siblingType: string | undefined;
  excludeSelf: boolean;
}

/**
 * Every name an activity hint can end up with: its own name, or for a hint that pulls a DDB action
 * onto the document, the action's name and any rename it asks for.
 */
function hintNames(hint: any): string[] {
  return [
    hint?.name,
    hint?.init?.name,
    hint?.overrides?.name,
    hint?.action?.name,
    ...(hint?.action?.rename ?? []),
  ].filter((name): name is string => typeof name === "string" && name !== "");
}

/**
 * The primary hint for each DDB activity type the parser could hand it. The parser applies the
 * primary to every activity it parsed, so an enricher can return a different primary per type
 * (Conjure Celestial's Searing Light for the save, Healing Light for the heal).
 */
function primaryHints(e: any): any[] {
  const original = e.ddbEnricher._originalActivity;
  const hints: any[] = [];
  for (const type of [undefined, "save", "heal", "damage", "attack", "utility"]) {
    e.ddbEnricher._originalActivity = type ? { type } : original;
    const hint = e.activity;
    if (hint && !hints.some((known) => known.name === hint.name)) hints.push(hint);
  }
  e.ddbEnricher._originalActivity = original;
  return hints;
}

/**
 * Every useActivity behavior that fires a named activity, with both ends' target types. The fired
 * activity can be any hint on the enricher, the primary and the placer itself included.
 */
function regionTriggers(e: any): IRegionTrigger[] {
  const primaries = primaryHints(e);
  const additional: any[] = e.additionalActivities ?? [];
  const hints = [...primaries, ...additional];
  const placers = [
    ...primaries.map((hint) => ({ hint, name: hint.name ?? "primary", behaviors: hint.data?.behaviors ?? [] })),
    ...additional.map((hint) => ({
      hint,
      name: hintNames(hint)[0],
      behaviors: hint.overrides?.data?.behaviors ?? [],
    })),
  ];
  const triggers: IRegionTrigger[] = [];
  for (const placer of placers) {
    for (const behavior of placer.behaviors) {
      const siblingName = behavior?.type === "ddbMacro" ? behavior.config?.args?.activityName : undefined;
      if (!siblingName) continue;
      // exact names first, then a prefix, as resolveRegionActivity looks them up
      const sibling = hints.find((hint) => hintNames(hint).includes(siblingName))
        ?? hints.find((hint) => hintNames(hint).some((name) => name.startsWith(siblingName)));
      triggers.push({
        placer: placer.name,
        placerType: affectsType(placer.hint),
        sibling: siblingName,
        resolved: Boolean(sibling),
        siblingType: sibling ? affectsType(sibling) : undefined,
        excludeSelf: behavior.config.excludeSelf,
      });
    }
  }
  return triggers;
}

/**
 * Whether an enricher's own class chain, below the shared base, builds region behaviors. Readers in shared helper modules
 * (monster/Generic/_ZoneText.ts) are not seen, so this narrows build failures, never triggers.
 */
function buildsRegions(Enricher: TEnricher): boolean {
  for (let ctor: any = Enricher; ctor && ctor !== DDBEnricherData; ctor = Object.getPrototypeOf(ctor)) {
    if ((/behaviors|BehaviorHelper|regionPlacer|regionTrigger/).test(String(ctor))) return true;
  }
  return false;
}

describe("region-fired activities keep the placer's hostile or friendly targeting", () => {
  it.each([
    ["SpiritGuardians", "Save vs Damage", "enemy", true, SpellEnrichers.SpiritGuardians],
    ["LightningRing", "Ring Save", "enemy", true, SpellEnrichers.LightningRing],
    ["DraconicPresence", "Awe Save", "enemy", true, ClassEnrichers.Sorcerer.DraconicPresence],
    ["DraconicPresence", "Fear Save", "enemy", true, ClassEnrichers.Sorcerer.DraconicPresence],
    ["VascularCorruptionAura", "Aura Damage", "enemy", true, ClassEnrichers.Cleric.VascularCorruptionAura],
    ["BondOfShelter", "Nature's Wrath", "enemy", true, ClassEnrichers.Druid.BondOfShelter],
    ["DreadLord", "Aura Damage", "enemy", true, ClassEnrichers.Paladin.DreadLord],
    ["SpellBlind", "Ongoing Save", "enemy", true, ClassEnrichers.Sorcerer.SpellBlind],
    ["EventHorizon", "Ongoing Save", "enemy", true, ClassEnrichers.Wizard.EventHorizon],
    // "you or any creature of your choice": the cleric is an ally of itself, so no excludeSelf
    ["ChannelDivinityTwilightSanctuary", "Temp HP", "ally", false, ClassEnrichers.Cleric.ChannelDivinityTwilightSanctuary],
  ] as [string, string, string, boolean, TEnricher][])("%s fires %s at %s", (_name, sibling, type, excludeSelf, Enricher) => {
    for (const is2014 of [true, false]) {
      const triggers = regionTriggers(makeEnricherData(Enricher, { is2014 })).filter((t) => t.sibling === sibling);
      expect(triggers.length).toBeGreaterThan(0);
      for (const trigger of triggers) {
        expect(trigger.siblingType).toBe(type);
        expect(trigger.excludeSelf).toBe(excludeSelf);
      }
    }
  });

  it("no enemy or ally placer fires a sibling that targets every creature", () => {
    const enrichers: [string, TEnricher][] = [];
    const seen = new Set<unknown>();
    const collect = (mod: any, path: string) => {
      if (!mod || seen.has(mod)) return;
      seen.add(mod);
      for (const [key, value] of Object.entries(mod)) {
        if (typeof value === "function" && value.prototype instanceof DDBEnricherData) {
          enrichers.push([`${path}.${key}`, value as TEnricher]);
        } else if (value && typeof value === "object") {
          collect(value, `${path}.${key}`);
        }
      }
    };
    collect(Enrichers, "enrichers");
    expect(enrichers.length).toBeGreaterThan(1000);

    const offenders = new Set<string>();
    const unresolved = new Set<string>();
    const failures = new Set<string>();
    for (const [name, Enricher] of enrichers) {
      for (const is2014 of [true, false]) {
        let e: any;
        try {
          // a document name and an empty item definition are the parser fields enrichers read
          // outside their own feature context (item text helpers, monster name parsing)
          e = makeEnricherData(Enricher, {
            is2014,
            data: { name: "Test Feature" },
            ddbParser: { ddbDefinition: { description: "", properties: [] } },
          });
          for (const trigger of regionTriggers(e)) {
            if (!trigger.resolved) {
              unresolved.add(`${name}: ${trigger.placer} -> ${trigger.sibling}`);
              continue;
            }
            const narrowed = ["enemy", "ally"].includes(trigger.placerType ?? "");
            const everyone = !["enemy", "ally", "self"].includes(trigger.siblingType ?? "");
            if (narrowed && everyone) offenders.add(`${name}: ${trigger.placer} -> ${trigger.sibling}`);
          }
        } catch (err) {
          if (buildsRegions(Enricher)) failures.add(`${name} (${is2014 ? "2014" : "2024"}): ${(err as Error)?.message}`);
        }
      }
    }
    // a region enricher this sweep cannot build, or a fired name it cannot find, is a trigger it never checks
    expect([...failures]).toEqual([]);
    expect([...unresolved]).toEqual([]);
    expect([...offenders]).toEqual([]);
  });
});
