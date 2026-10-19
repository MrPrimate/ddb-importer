/**
 * Activities that link several alternative effects, of which one is applied: a band picked by the
 * target's hit points, a rolled result, a chosen form or land. Midi with automatic effect
 * application would otherwise apply every linked effect (Divine Word's Dead whatever the target's
 * hit points, +78 AC from Evasive Footwork), so these carry Midi's chooseEffects and Midi prompts
 * for the one to apply. Monster enrichers (Syringe, Grant Resistance) are pinned beside their
 * other tests.
 */
import * as SpellEnrichers from "../../../src/parser/enrichers/spell/_module";
import * as ClassEnrichers from "../../../src/parser/enrichers/class/_module";
import * as ItemEnrichers from "../../../src/parser/enrichers/item/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => installActivityConfigStubs());

const CHOOSE = { midiProperties: { chooseEffects: true } };

describe("activities linking alternative effects prompt for one under Midi", () => {
  it.each([
    ["Divine Word", SpellEnrichers.DivineWord, 4],
    ["Imprisonment", SpellEnrichers.Imprisonment, 2],
    ["Calm Emotions", SpellEnrichers.CalmEmotions, 2],
  ])("%s", (_label, Enricher, count) => {
    const e: any = makeEnricherData(Enricher as any);
    expect(e.activity.data).toMatchObject(CHOOSE);
    expect(e.effects).toHaveLength(count);
  });

  it.each([
    ["Evasive Footwork", ClassEnrichers.Fighter.ManeuverEvasiveFootwork],
    ["Bait and Switch", ClassEnrichers.Fighter.ManeuverBaitAndSwitch],
  ])("%s offers one AC effect per rolled result", (_label, Enricher) => {
    const e: any = makeEnricherData(Enricher as any);
    expect(e.activity.data).toMatchObject(CHOOSE);
    expect(e.effects).toHaveLength(12);
  });

  it("Form of the Beast's tail reaction offers one AC effect per rolled result to the barbarian", () => {
    const e: any = makeEnricherData(ClassEnrichers.Barbarian.FormOfTheBeast);
    expect(e.activity).toMatchObject({ targetType: "self", data: CHOOSE });
    expect(e.effects).toHaveLength(8);
    const weapons: any = makeEnricherData(ClassEnrichers.Barbarian.FormOfTheBeastWeapons, {
      ddbParser: { originalName: "Form of the Beast: Tail (reaction)" },
    });
    expect(weapons.activity).toMatchObject({ targetType: "self", data: CHOOSE });
  });

  it("Nature's Sanctuary offers the ward of the chosen land", () => {
    const e: any = makeEnricherData(ClassEnrichers.Druid.NaturesSanctuary, { isAction: true });
    expect(e.activity.data).toMatchObject(CHOOSE);
  });

  it("Cogwork Wings offers the flight of the wearer's weight band", () => {
    const e: any = makeEnricherData(ItemEnrichers.CogworkWings);
    expect(e.additionalActivities[0].overrides.data).toMatchObject(CHOOSE);
    expect(e.effects).toHaveLength(2);
  });
});
