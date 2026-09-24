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
  siblingType: string | undefined;
  excludeSelf: boolean;
}

/** Every useActivity behavior that fires a named sibling, with both ends' target types. */
function regionTriggers(e: any): IRegionTrigger[] {
  const primary = e.activity;
  const additional: any[] = e.additionalActivities ?? [];
  const placers = [
    { hint: primary, name: primary?.name ?? "primary", behaviors: primary?.data?.behaviors ?? [] },
    ...additional.map((hint) => ({
      hint,
      name: hint.init?.name ?? hint.overrides?.name,
      behaviors: hint.overrides?.data?.behaviors ?? [],
    })),
  ];
  const triggers: IRegionTrigger[] = [];
  for (const placer of placers) {
    for (const behavior of placer.behaviors) {
      const siblingName = behavior?.type === "ddbMacro" ? behavior.config?.args?.activityName : undefined;
      if (!siblingName) continue;
      const sibling = additional.find((hint) => (hint.init?.name ?? hint.overrides?.name ?? "").startsWith(siblingName));
      if (!sibling) continue;
      triggers.push({
        placer: placer.name,
        placerType: affectsType(placer.hint),
        sibling: siblingName,
        siblingType: affectsType(sibling),
        excludeSelf: behavior.config.excludeSelf,
      });
    }
  }
  return triggers;
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
        if (typeof value === "function" && value.prototype && "additionalActivities" in value.prototype) {
          enrichers.push([`${path}.${key}`, value as TEnricher]);
        } else if (value && typeof value === "object") {
          collect(value, `${path}.${key}`);
        }
      }
    };
    collect(Enrichers, "enrichers");
    expect(enrichers.length).toBeGreaterThan(1000);

    const offenders = new Set<string>();
    for (const [name, Enricher] of enrichers) {
      for (const is2014 of [true, false]) {
        let e: any;
        try {
          e = makeEnricherData(Enricher, { is2014 });
          for (const trigger of regionTriggers(e)) {
            const narrowed = ["enemy", "ally"].includes(trigger.placerType ?? "");
            const everyone = !["enemy", "ally", "self"].includes(trigger.siblingType ?? "");
            if (narrowed && everyone) offenders.add(`${name}: ${trigger.placer} -> ${trigger.sibling}`);
          }
        } catch {
          // enrichers whose getters need a fuller parser context are covered by their own tests
        }
      }
    }
    expect([...offenders]).toEqual([]);
  });
});
