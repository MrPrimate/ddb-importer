import "../../../src/parser/character/specialTraits";
import { makeMockCharacter } from "../../_fixtures/mockCharacter";
import DDBCharacter from "../../../src/parser/DDBCharacter";

const setSpecialTraitFlags = DDBCharacter.prototype._setSpecialTraitFlags;

function traitMock(ddbCharacter: Record<string, any>): any {
  return makeMockCharacter({ ddbCharacter });
}

// minimal valid class entry: filterBaseModifiers always walks
// classes[].classFeatures, even for race-bucket modifiers
function subclassed(classFeatures: Record<string, any>[], level = 3): Record<string, any> {
  return {
    level,
    classFeatures: [],
    definition: { id: 1, name: "Sorcerer", classFeatures: [] },
    subclassDefinition: { id: 2, classFeatures },
  };
}

describe("DDBCharacter._setSpecialTraitFlags", () => {
  it("writes an all-default dnd5e flag block for a plain character", () => {
    const mock = traitMock({});
    setSpecialTraitFlags.call(mock);
    expect(mock.raw.character.flags.dnd5e).toEqual({
      powerfulBuild: false,
      savageAttacks: false,
      elvenAccuracy: false,
      halflingLucky: false,
      initiativeAdv: false,
      initiativeAlert: false,
      jackOfAllTrades: false,
      weaponCriticalThreshold: 20,
      observantFeat: false,
      remarkableAthlete: false,
      reliableTalent: false,
      diamondSoul: false,
      meleeCriticalDamageDice: 0,
      wildMagic: false,
      spellSniper: false,
      tavernBrawlerFeat: false,
      initiativeHalfProf: false,
    });
  });

  it("never sets initiativeAdv from a modifier (advantage/initiative is effect-excluded)", () => {
    // (type: "advantage", subType: "initiative") is on the excluded-effects list
    // (config/dictionary/effects/excluded.ts), and filterBaseModifiers is called
    // here without includeExcludedEffects, so this flag cannot currently be set
    // by any modifier - the advantage is expected to arrive as an active effect
    // instead. Pinned; if this starts returning true the exclusion interplay
    // changed and the assertion should flip.
    const mock = traitMock({
      modifiers: {
        race: [{ type: "advantage", subType: "initiative", isGranted: true, restriction: "" }],
        class: [], background: [], item: [], feat: [], condition: [],
      },
    });
    setSpecialTraitFlags.call(mock);
    expect(mock.raw.character.flags.dnd5e.initiativeAdv).toBe(false);
  });

  it("sets initiativeHalfProf from a half-proficiency initiative modifier", () => {
    const mock = traitMock({
      modifiers: {
        race: [{ type: "half-proficiency", subType: "initiative", isGranted: true, restriction: "" }],
        class: [], background: [], item: [], feat: [], condition: [],
      },
    });
    setSpecialTraitFlags.call(mock);
    expect(mock.raw.character.flags.dnd5e.initiativeHalfProf).toBe(true);
  });

  it("forces the concentration roll mode to advantage for War Caster", () => {
    const mock = traitMock({
      feats: [{ definition: { name: "War Caster" } }],
    });
    setSpecialTraitFlags.call(mock);
    expect(mock.raw.character.system.attributes.concentration.roll.mode).toBe("1");
  });

  it("leaves the concentration roll mode untouched without War Caster", () => {
    const mock = traitMock({});
    setSpecialTraitFlags.call(mock);
    expect(mock.raw.character.system.attributes.concentration).toBeUndefined();
  });

  it("sets wildMagic when the subclass grants Wild Magic Surge at level", () => {
    const mock = traitMock({
      classes: [subclassed([{ name: "Wild Magic Surge", requiredLevel: 1 }], 3)],
    });
    setSpecialTraitFlags.call(mock);
    expect(mock.raw.character.flags.dnd5e.wildMagic).toBe(true);
  });

  it("does not set wildMagic below the feature's required level", () => {
    const mock = traitMock({
      classes: [subclassed([{ name: "Wild Magic Surge", requiredLevel: 6 }], 3)],
    });
    setSpecialTraitFlags.call(mock);
    expect(mock.raw.character.flags.dnd5e.wildMagic).toBe(false);
  });

});
