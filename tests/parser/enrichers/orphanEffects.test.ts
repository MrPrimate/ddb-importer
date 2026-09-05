/**
 * An enricher effect hint that is not a transfer effect only ever reaches an actor through an
 * activity: dnd5e applies embedded non-transfer effects from an activity's effects list, and the
 * standalone/region variants are placed by a template an activity owns. FeatEffect defaults to
 * `transfer: false`, so an effects-only class or feat enricher with no activity path ships an effect
 * nothing can apply - the War Priest shape, found 2026-09-05, where a named enricher also replaced
 * the Generic fallback's action-matched activity. Every hint getter is read against the test stub
 * for both rulesets; an enricher is an offender when a variant has a non-transfer hint and no
 * activity path. `KNOWN_ORPHANS` lists the accepted exceptions with the reason; remove an entry
 * once its enricher gains an activity. A feature whose benefit only applies while another feature is
 * active (Stormborn, Stride of the Elements) carries no effect of its own: the owning feature's
 * activity or enchantment applies it, level-gated with `effectIdLevel`.
 */
import * as BackgroundEnrichers from "../../../src/parser/enrichers/background/_module";
import * as ClassEnrichers from "../../../src/parser/enrichers/class/_module";
import * as FeatEnrichers from "../../../src/parser/enrichers/feat/_module";
import * as TraitEnrichers from "../../../src/parser/enrichers/trait/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

/**
 * Accepted orphans: `<barrel key>: reason`. "parent" entries are choice options or sub-features
 * whose effect is folded into the activity the parent feature or its DDB action builds.
 */
const KNOWN_ORPHANS: Record<string, string> = {
  "class.Fighter.InfamyStrength": "parent: the Infamy save activity built from the DDB action applies the option effect",
  "class.Fighter.InfamyDexterity": "parent: as InfamyStrength",
  "class.Fighter.Blindsight": "parent: the Night Stalker feature's Blindsight action builds the activity",
  "class.Paladin.EmissaryOfPeace": "parent: paladin ChannelDivinity builds the Emissary of Peace action activity",
  "class.Warlock.SpiritProjectionProjectSpirit": "parent: Spirit Projection option, the parent action activity applies it",
};

/** Flatten a barrel (one level of namespace re-exports for class/trait) into `Key` / `Group.Key`. */
function flatten(barrel: Record<string, any>, prefix = ""): [string, TEnricher][] {
  const out: [string, TEnricher][] = [];
  for (const [key, value] of Object.entries(barrel)) {
    if (key.startsWith("_")) continue;
    if (typeof value === "function") out.push([`${prefix}${key}`, value as TEnricher]);
    else if (value && typeof value === "object") out.push(...flatten(value, `${prefix}${key}.`));
  }
  return out;
}

const ENRICHERS: [string, TEnricher][] = [
  ...flatten(ClassEnrichers, "class."),
  ...flatten(FeatEnrichers, "feat."),
  ...flatten(TraitEnrichers, "trait."),
  ...flatten(BackgroundEnrichers, "background."),
];

/**
 * A hint the actor can only receive through an activity. An explicit activityMatch names the
 * activity that applies it (often one another document builds from the DDB action); the audit
 * harness reports those links when they fail to resolve, so they are not orphans here.
 */
function isAppliedHint(hint: any): boolean {
  if (!hint || hint.noCreate) return false;
  if (hint.activityMatch || (hint.activitiesMatch?.length ?? 0) > 0) return false;
  return hint.options?.transfer !== true;
}

/** Any getter that makes the feature build at least one activity for the effect to hang from. */
function hasActivityPath(e: any): boolean {
  const activityType = e.activity?.type ?? e.type;
  if (e.activity && activityType !== "none") return true;
  if (e.type && e.type !== "none") return true;
  if ((e.additionalActivities?.length ?? 0) > 0) return true;
  if (e.useDefaultAdditionalActivities || e.addToDefaultAdditionalActivities) return true;
  if (e.generateSummons || e.summonsFunction) return true;
  return false;
}

interface IScanResult {
  offenders: string[];
  unevaluated: string[];
}

function scan(): IScanResult {
  const offenders = new Set<string>();
  const unevaluated = new Set<string>();
  for (const [key, Enricher] of ENRICHERS) {
    for (const is2014 of [false, true]) {
      try {
        const e = makeEnricherData(Enricher, { is2014 });
        const hints: any[] = e.effects ?? [];
        if (hints.some(isAppliedHint) && !hasActivityPath(e)) offenders.add(key);
      } catch {
        // a getter that reaches into parser state the stub does not carry; the audit
        // harness covers those against real captures
        unevaluated.add(key);
      }
    }
  }
  return { offenders: [...offenders].sort(), unevaluated: [...unevaluated].sort() };
}

describe("enricher applied effects have an activity to hang from", () => {
  const result = scan();

  it("evaluates most of the tree", () => {
    // ~1,000 class/feat/trait/background enrichers; a handful read parser state the stub lacks
    expect(ENRICHERS.length).toBeGreaterThan(800);
    expect(result.unevaluated.length, `unevaluated: ${result.unevaluated.join(", ")}`).toBeLessThan(ENRICHERS.length / 10);
  });

  it("finds no applied effect without an activity outside the known list", () => {
    const unexpected = result.offenders.filter((key) => !(key in KNOWN_ORPHANS));
    expect(unexpected, "non-transfer effect with no activity: add an activity, options.transfer, or a KNOWN_ORPHANS entry").toEqual([]);
  });

  it("keeps the known list current", () => {
    const stale = Object.keys(KNOWN_ORPHANS).filter((key) => !result.offenders.includes(key));
    expect(stale, "no longer an orphan: remove from KNOWN_ORPHANS").toEqual([]);
  });
});
